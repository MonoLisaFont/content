#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { del as deleteBlob, put } from "@vercel/blob";
import dotenv from "dotenv";
import {
  getWebsiteRevalidationConfig,
  revalidateWebsitePathname,
} from "./revalidate-website.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const COLLECTIONS = new Map([
  ["02_drafts", "drafts"],
  ["03_posts", "posts"],
]);
const STANDALONE_FILES = new Map([["faq.md", "faq.md"]]);
const IMAGE_DIRECTORY = "images";
const IMAGE_CONTENT_TYPES = new Map([
  [".avif", "image/avif"],
  [".gif", "image/gif"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);
const CACHE_MAX_AGE = 60;

function usage() {
  return `Publish MonoLisa content and images to Vercel Blob.

Usage:
  npm run publish:content -- --all
  npm run publish:content -- 02_drafts/my-post.md 03_posts/another-post.md faq.md
  npm run publish:content -- 02_drafts
  npm run publish:content -- images
  npm run publish:content -- images/example.png

Options:
  --all      Publish every draft and post plus faq.md
  --dry-run  Show uploads and invalidations without making network requests
  --help     Show this help

Objects use deterministic paths such as drafts/my-post.md,
posts/another-post.md, and images/example.png; the FAQ is stored as faq.md.
Images referenced by selected Markdown files are published first. Existing
objects are overwritten. Website caches are invalidated after every upload
succeeds.`;
}

export function parseArgs(argv) {
  const options = { all: false, dryRun: false, inputs: [] };

  for (const arg of argv) {
    if (arg === "--all") options.all = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      options.inputs.push(arg);
    }
  }

  if (!options.all && options.inputs.length === 0) {
    throw new Error("Pass --all or at least one content/image path.\n\n" + usage());
  }
  return options;
}

function repositoryPath(path) {
  return relative(root, path).split(sep).join("/");
}

function blobPathFor(path) {
  const localPath = repositoryPath(path);
  const standaloneBlobPath = STANDALONE_FILES.get(localPath);
  if (standaloneBlobPath) return standaloneBlobPath;

  const [directory, ...rest] = localPath.split("/");
  if (
    directory === IMAGE_DIRECTORY &&
    rest.length === 1 &&
    IMAGE_CONTENT_TYPES.has(extname(rest[0]).toLowerCase())
  ) {
    return localPath;
  }

  const prefix = COLLECTIONS.get(directory);

  if (!prefix || rest.length !== 1 || extname(rest[0]) !== ".md") {
    throw new Error(
      `${localPath} must be faq.md or a Markdown file directly inside 02_drafts or 03_posts`,
    );
  }
  return `${prefix}/${rest[0]}`;
}

function isImagePath(path) {
  return repositoryPath(path).startsWith(`${IMAGE_DIRECTORY}/`);
}

function isPublishableMarkdownPath(path) {
  const localPath = repositoryPath(path);
  if (STANDALONE_FILES.has(localPath)) return true;
  return COLLECTIONS.has(localPath.split("/")[0]) && extname(path) === ".md";
}

function requiresCompleteImages(path) {
  const localPath = repositoryPath(path);
  if (STANDALONE_FILES.has(localPath)) return true;
  return COLLECTIONS.get(localPath.split("/")[0]) === "posts";
}

async function markdownFilesIn(directory) {
  const entries = await readdir(resolve(root, directory), {
    withFileTypes: true,
  });
  return entries
    .filter((entry) => entry.isFile() && extname(entry.name) === ".md")
    .map((entry) => resolve(root, directory, entry.name));
}

async function imageFiles() {
  const entries = await readdir(resolve(root, IMAGE_DIRECTORY), {
    withFileTypes: true,
  });
  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        IMAGE_CONTENT_TYPES.has(extname(entry.name).toLowerCase()),
    )
    .map((entry) => resolve(root, IMAGE_DIRECTORY, entry.name));
}

async function filesForInput(input) {
  const path = resolve(root, input);
  const localPath = repositoryPath(path);
  if (localPath === ".." || localPath.startsWith("../")) {
    throw new Error(`${input} is outside this repository`);
  }

  let metadata;
  try {
    metadata = await stat(path);
  } catch (error) {
    if (error.code === "ENOENT") throw new Error(`${input} does not exist`);
    throw error;
  }

  if (metadata.isDirectory()) {
    if (localPath === IMAGE_DIRECTORY) return imageFiles();
    if (!COLLECTIONS.has(localPath)) {
      throw new Error(`${input} must be 02_drafts, 03_posts, or images`);
    }
    return markdownFilesIn(localPath);
  }
  if (!metadata.isFile()) throw new Error(`${input} is not a regular file`);

  blobPathFor(path);
  return [path];
}

function transformInlineCode(markdown, transform) {
  let cursor = 0;
  let output = "";
  const openingPattern = /`+/g;

  while (cursor < markdown.length) {
    openingPattern.lastIndex = cursor;
    const opening = openingPattern.exec(markdown);
    if (!opening) {
      output += transform(markdown.slice(cursor));
      break;
    }

    const marker = opening[0];
    let closingIndex = openingPattern.lastIndex;
    let closing;
    while (closingIndex < markdown.length) {
      const candidate = markdown.indexOf(marker, closingIndex);
      if (candidate === -1) break;
      const beforeIsBacktick = markdown[candidate - 1] === "`";
      const afterIsBacktick = markdown[candidate + marker.length] === "`";
      if (!beforeIsBacktick && !afterIsBacktick) {
        closing = candidate;
        break;
      }
      closingIndex = candidate + marker.length;
    }

    if (closing === undefined) {
      output += transform(markdown.slice(cursor));
      break;
    }

    output += transform(markdown.slice(cursor, opening.index));
    output += markdown.slice(opening.index, closing + marker.length);
    cursor = closing + marker.length;
  }

  return output;
}

function transformOutsideHtmlCode(markdown, transform) {
  const htmlCodePattern =
    /<!--[\s\S]*?(?:-->|$)|<(pre|code)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
  let cursor = 0;
  let output = "";

  for (const match of markdown.matchAll(htmlCodePattern)) {
    output += transformInlineCode(markdown.slice(cursor, match.index), transform);
    output += match[0];
    cursor = match.index + match[0].length;
  }
  output += transformInlineCode(markdown.slice(cursor), transform);
  return output;
}

export function transformMarkdownOutsideCode(markdown, transform) {
  const lines = String(markdown).match(/[^\n]*(?:\n|$)/g)?.filter(Boolean) ?? [];
  let fence;
  let indentedCodeIndent = 0;
  let listContext = false;
  let listContentIndent = 0;
  let previousBlank = true;
  let prose = "";
  let output = "";

  const flushProse = () => {
    output += transformOutsideHtmlCode(prose, transform);
    prose = "";
  };

  for (const line of lines) {
    const content = line.replace(/\r?\n$/, "");
    const blank = /^\s*$/.test(content);
    if (fence) {
      output += line;
      const blockquotePrefix = fence.blockquoteDepth
        ? `(?:>[ \\t]?){${fence.blockquoteDepth}}`
        : "";
      const closingPattern = new RegExp(
        `^ {0,3}${blockquotePrefix}${fence.character}{${fence.length},}\\s*$`,
      );
      const closesFence = closingPattern.test(content);
      if (closesFence) {
        fence = undefined;
        listContext = false;
      }
      previousBlank = closesFence || blank;
      continue;
    }

    if (indentedCodeIndent) {
      if (blank || leadingIndentWidth(content) >= indentedCodeIndent) {
        output += line;
        previousBlank = blank;
        continue;
      }
      indentedCodeIndent = 0;
    }

    const leadingIndent = leadingIndentWidth(content);
    const codeIndent = listContext ? listContentIndent + 4 : 4;
    if (previousBlank && leadingIndent >= codeIndent && !blank) {
      flushProse();
      output += line;
      indentedCodeIndent = codeIndent;
      previousBlank = false;
      continue;
    }

    const blockquoteOpening = content.match(
      /^ {0,3}((?:>[ \t]?)+)(`{3,}|~{3,})(.*)$/,
    );
    const plainOpening = content.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    const opening = blockquoteOpening
      ? [
          blockquoteOpening[0],
          blockquoteOpening[2],
          blockquoteOpening[3],
          (blockquoteOpening[1].match(/>/g) ?? []).length,
        ]
      : plainOpening
        ? [plainOpening[0], plainOpening[1], plainOpening[2], 0]
        : undefined;
    const validOpening =
      opening && (opening[1][0] !== "`" || !opening[2].includes("`"));
    if (validOpening) {
      flushProse();
      output += line;
      fence = {
        blockquoteDepth: opening[3],
        character: opening[1][0],
        length: opening[1].length,
      };
    } else {
      prose += line;
    }

    const listMarker = content.match(/^( {0,3})(?:[-+*]|\d+[.)])([ \t]+)/);
    if (listMarker) {
      listContext = true;
      listContentIndent =
        leadingIndentWidth(listMarker[1]) +
        content.slice(listMarker[1].length).search(/[ \t]/) +
        leadingIndentWidth(listMarker[2]);
    } else if (!blank && !/^(?: {2}|\t)/.test(content)) {
      listContext = false;
      listContentIndent = 0;
    }
    previousBlank = blank;
  }

  flushProse();
  return output;
}

function leadingIndentWidth(value) {
  let width = 0;
  for (const character of String(value)) {
    if (character === " ") width += 1;
    else if (character === "\t") width += 4 - (width % 4);
    else break;
  }
  return width;
}

const LOCAL_SRCSET_IMAGE_PATTERN =
  /(^|,)(\s*)((?:\/images\/|https:\/\/raw\.githubusercontent\.com\/MonoLisaFont\/content\/main\/images\/)[^\s]*?\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#][^\s,]*)?)(?=\s|,|$)/gi;

export function transformLocalSrcsetReferences(value, transform) {
  return String(value).replace(
    LOCAL_SRCSET_IMAGE_PATTERN,
    (_match, separator, whitespace, reference) =>
      `${separator}${whitespace}${transform(reference)}`,
  );
}

export function transformHtmlImageAttributes(element, transform) {
  const source = String(element);
  let cursor = 0;
  let index = 0;
  let quote;
  let output = "";

  while (index < source.length) {
    const character = source[index];
    if (quote) {
      if (character === quote) quote = undefined;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      index += 1;
      continue;
    }
    if (index === 0 || !/\s/.test(source[index - 1])) {
      index += 1;
      continue;
    }

    const nameMatch = source.slice(index).match(/^(srcset|src)(?=\s*=)/i);
    if (!nameMatch) {
      index += 1;
      continue;
    }

    const name = nameMatch[0];
    let valueStart = index + name.length;
    while (/\s/.test(source[valueStart] ?? "")) valueStart += 1;
    if (source[valueStart] !== "=") {
      index += name.length;
      continue;
    }
    valueStart += 1;
    while (/\s/.test(source[valueStart] ?? "")) valueStart += 1;

    const valueQuote = source[valueStart];
    const quoted = valueQuote === '"' || valueQuote === "'";
    if (quoted) valueStart += 1;
    let valueEnd = valueStart;
    if (quoted) {
      while (valueEnd < source.length && source[valueEnd] !== valueQuote) {
        valueEnd += 1;
      }
      if (valueEnd === source.length) break;
    } else {
      while (
        valueEnd < source.length &&
        !/[\s>]/.test(source[valueEnd])
      ) {
        valueEnd += 1;
      }
    }
    if (valueEnd === valueStart) {
      index = valueEnd + Number(quoted);
      continue;
    }

    output += source.slice(cursor, valueStart);
    output += transform(name.toLowerCase(), source.slice(valueStart, valueEnd));
    cursor = valueEnd;
    index = valueEnd + Number(quoted);
  }

  return output + source.slice(cursor);
}

export function isMarkdownSyntaxEscaped(value, index) {
  let backslashes = 0;
  for (let offset = index - 1; offset >= 0 && value[offset] === "\\"; offset -= 1) {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
}

function balancedClosingIndex(source, openingIndex, opening, closing) {
  let depth = 1;
  for (let index = openingIndex + 1; index < source.length; index += 1) {
    if (source[index] === "\\") {
      index += 1;
      continue;
    }
    if (source[index] === opening) depth += 1;
    else if (source[index] === closing) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function inlineImageDestination(source, labelEnd) {
  const openingParenthesis = labelEnd + 1;
  if (source[openingParenthesis] !== "(") return undefined;

  let index = openingParenthesis + 1;
  while (/[\t\n\r ]/.test(source[index] ?? "")) index += 1;
  const angled = source[index] === "<";
  if (angled) index += 1;
  const destinationStart = index;
  let nestedParentheses = 0;

  while (index < source.length) {
    const character = source[index];
    if (character === "\\") {
      index += 2;
      continue;
    }
    if (angled) {
      if (character === ">") break;
      if (character === "\n" || character === "\r") return undefined;
    } else {
      if (character === "(") nestedParentheses += 1;
      else if (character === ")") {
        if (nestedParentheses === 0) break;
        nestedParentheses -= 1;
      } else if (/[\t\n\r ]/.test(character) && nestedParentheses === 0) {
        break;
      }
    }
    index += 1;
  }

  const destinationEnd = index;
  if (destinationEnd === destinationStart) return undefined;
  if (angled) {
    if (source[index] !== ">") return undefined;
    index += 1;
  }

  let quote;
  let titleParentheses = 0;
  for (; index < source.length; index += 1) {
    const character = source[index];
    if (character === "\\") {
      index += 1;
      continue;
    }
    if (quote) {
      if (character === quote) quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === "(") {
      titleParentheses += 1;
    } else if (character === ")") {
      if (titleParentheses === 0) {
        return { destinationStart, destinationEnd, end: index + 1 };
      }
      titleParentheses -= 1;
    }
  }
  return undefined;
}

export function transformInlineMarkdownImageDestinations(markdown, transform) {
  const source = String(markdown);
  let cursor = 0;
  let index = 0;
  let output = "";

  while (index < source.length) {
    const opening = source.indexOf("![", index);
    if (opening === -1) break;
    if (isMarkdownSyntaxEscaped(source, opening)) {
      index = opening + 2;
      continue;
    }

    const labelEnd = balancedClosingIndex(source, opening + 1, "[", "]");
    if (labelEnd === -1) break;
    const destination = inlineImageDestination(source, labelEnd);
    if (!destination) {
      index = labelEnd + 1;
      continue;
    }

    output += source.slice(cursor, destination.destinationStart);
    output += transform(
      source.slice(destination.destinationStart, destination.destinationEnd),
    );
    cursor = destination.destinationEnd;
    index = destination.end;
  }

  return output + source.slice(cursor);
}

export function transformHtmlImageElements(markdown, transform) {
  const source = String(markdown);
  let cursor = 0;
  let index = 0;
  let output = "";

  while (index < source.length) {
    const opening = source.indexOf("<", index);
    if (opening === -1) break;
    const tag = source
      .slice(opening)
      .match(/^<\s*(\/?)\s*([A-Za-z][A-Za-z0-9:-]*)\b/);
    if (!tag) {
      index = opening + 1;
      continue;
    }

    let end = opening + tag[0].length;
    let quote;
    while (end < source.length) {
      const character = source[end];
      if (quote) {
        if (character === quote) quote = undefined;
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === ">") {
        end += 1;
        break;
      }
      end += 1;
    }
    if (end > source.length || source[end - 1] !== ">") break;

    const name = tag[2].toLowerCase();
    const isImageElement =
      !tag[1] &&
      (name === "img" || name === "source") &&
      !isMarkdownSyntaxEscaped(source, opening);
    if (isImageElement) {
      output += source.slice(cursor, opening);
      output += transform(source.slice(opening, end));
      cursor = end;
    }
    index = end;
  }

  return output + source.slice(cursor);
}

function normalizeReferenceLabel(label) {
  return label.trim().replace(/\s+/g, " ").toLowerCase();
}

function referenceImageLabels(markdown) {
  const labels = new Set();

  transformMarkdownOutsideCode(markdown, (prose) => {
    let index = 0;
    while (index < prose.length) {
      const opening = prose.indexOf("![", index);
      if (opening === -1) break;
      if (isMarkdownSyntaxEscaped(prose, opening)) {
        index = opening + 2;
        continue;
      }

      const descriptionEnd = balancedClosingIndex(
        prose,
        opening + 1,
        "[",
        "]",
      );
      if (descriptionEnd === -1) break;
      const description = prose.slice(opening + 2, descriptionEnd);
      let continuation = descriptionEnd + 1;
      while (/[\t ]/.test(prose[continuation] ?? "")) continuation += 1;

      if (prose[continuation] === "(") {
        index = continuation + 1;
        continue;
      }

      let label = description;
      if (prose[continuation] === "[") {
        const referenceEnd = balancedClosingIndex(
          prose,
          continuation,
          "[",
          "]",
        );
        if (referenceEnd === -1) {
          index = continuation + 1;
          continue;
        }
        label = prose.slice(continuation + 1, referenceEnd) || description;
        index = referenceEnd + 1;
      } else {
        index = descriptionEnd + 1;
      }

      const normalized = normalizeReferenceLabel(label);
      if (normalized) labels.add(normalized);
    }
    return prose;
  });
  return labels;
}

const REFERENCE_DEFINITION_PATTERN =
  /^( {0,3}\[([^\]\r\n]+)\]:[ \t]*)(?:<([^>\r\n]+)>|([^\s\r\n]+))([ \t]*(?:(?:"[^"\r\n]*"|'[^'\r\n]*'|\([^\)\r\n]*\)))?[ \t]*)(\r?)$/gm;

export function transformReferencedImageDefinitions(markdown, transform) {
  const labels = referenceImageLabels(markdown);
  if (labels.size === 0) return String(markdown);

  return transformMarkdownOutsideCode(markdown, (prose) =>
    prose.replace(
      REFERENCE_DEFINITION_PATTERN,
      (match, prefix, label, angleReference, bareReference, suffix, carriage) => {
        if (!labels.has(normalizeReferenceLabel(label))) return match;
        const reference = angleReference ?? bareReference;
        const rewritten = transform(reference);
        const destination =
          angleReference === undefined ? rewritten : `<${rewritten}>`;
        return `${prefix}${destination}${suffix}${carriage}`;
      },
    ),
  );
}

export function referencedImagePaths(markdown) {
  const references = [];

  transformMarkdownOutsideCode(markdown, (prose) => {
    transformInlineMarkdownImageDestinations(prose, (reference) => {
      references.push(reference);
      return reference;
    });

    transformHtmlImageElements(prose, (element) => {
      transformHtmlImageAttributes(element, (name, value) => {
        if (name === "srcset") {
          transformLocalSrcsetReferences(value, (reference) => {
            references.push(reference);
            return reference;
          });
        } else {
          references.push(value);
        }
        return value;
      });
      return element;
    });
    return prose;
  });

  transformReferencedImageDefinitions(markdown, (reference) => {
    references.push(reference);
    return reference;
  });

  return references
    .map(localImagePathForReference)
    .filter((path) => path !== null);
}

export function localImagePathForReference(reference) {
  let pathname;

  if (reference.startsWith("/images/")) {
    pathname = new URL(reference, "https://local.invalid").pathname;
  } else {
    let url;
    try {
      url = new URL(reference);
    } catch {
      return null;
    }

    const rawGitHubPrefix = "/MonoLisaFont/content/main/images/";
    if (
      url.hostname !== "raw.githubusercontent.com" ||
      !url.pathname.startsWith(rawGitHubPrefix)
    ) {
      return null;
    }
    pathname = `/images/${url.pathname.slice(rawGitHubPrefix.length)}`;
  }

  const localPath = decodeURIComponent(pathname.slice(1));
  if (localPath.includes("\\")) {
    throw new Error(`Image reference cannot contain backslashes: ${reference}`);
  }
  const [directory, ...rest] = localPath.split("/");
  if (directory !== IMAGE_DIRECTORY || rest.length !== 1) {
    throw new Error(`Image reference must point directly inside /images: ${reference}`);
  }
  if (!IMAGE_CONTENT_TYPES.has(extname(rest[0]).toLowerCase())) {
    throw new Error(`Unsupported image type in reference: ${reference}`);
  }
  return localPath;
}

async function relatedImageFiles(markdownPaths) {
  const images = [];

  for (const markdownPath of markdownPaths) {
    const markdown = await readFile(markdownPath, "utf8");
    const localImagePaths = new Set(referencedImagePaths(markdown));
    for (const localImagePath of localImagePaths) {
      const imagePath = resolve(root, localImagePath);
      try {
        const metadata = await stat(imagePath);
        if (!metadata.isFile()) throw new Error(`${localImagePath} is not a regular file`);
        images.push(imagePath);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        if (requiresCompleteImages(markdownPath)) {
          throw new Error(
            `${repositoryPath(markdownPath)} references missing ${localImagePath}`,
          );
        }
        console.warn(
          `Warning: ${repositoryPath(markdownPath)} references missing ${localImagePath}; skipping it`,
        );
      }
    }
  }

  return images;
}

export async function collectFiles(options) {
  const paths = [];
  if (options.all) {
    for (const directory of COLLECTIONS.keys()) {
      paths.push(...(await markdownFilesIn(directory)));
    }
    for (const file of STANDALONE_FILES.keys()) paths.push(resolve(root, file));
  }
  for (const input of options.inputs) paths.push(...(await filesForInput(input)));

  const markdownPaths = paths.filter(isPublishableMarkdownPath);
  paths.push(...(await relatedImageFiles(markdownPaths)));

  return [...new Set(paths)].sort((a, b) => {
    const priority = Number(isImagePath(b)) - Number(isImagePath(a));
    return priority || repositoryPath(a).localeCompare(repositoryPath(b));
  });
}

function contentTypeFor(path) {
  if (!isImagePath(path)) return "text/markdown; charset=utf-8";
  return IMAGE_CONTENT_TYPES.get(extname(path).toLowerCase());
}

function plural(count, singular, pluralForm = `${singular}s`) {
  return count === 1 ? singular : pluralForm;
}

function redactSecret(value, secret) {
  return String(value).split(secret).join("[REDACTED]");
}

function shellQuote(value) {
  const stringValue = String(value);
  if (/^[a-zA-Z0-9_./-]+$/.test(stringValue)) return stringValue;
  return `'${stringValue.replaceAll("'", "'\\''")}'`;
}

export function validateContentPublishingConfig(env = process.env) {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is missing from .env.private");
  }

  const { url, secret } = getWebsiteRevalidationConfig(env);
  return { token: env.BLOB_READ_WRITE_TOKEN, url, secret };
}

export async function publishContentFiles(
  files,
  { dryRun = false, env = process.env } = {},
  {
    logger = console,
    putBlob = put,
    readFileImpl = readFile,
    revalidateWebsiteImpl = revalidateWebsitePathname,
  } = {},
) {
  const publications = [
    ...new Map(
      files.map((file) => {
        const pathname = blobPathFor(file);
        return [pathname, { file, localPath: repositoryPath(file), pathname }];
      }),
    ).values(),
  ];
  const pathnames = publications.map(({ pathname }) => pathname);

  if (dryRun) {
    for (const { localPath, pathname } of publications) {
      logger.log(`${localPath} -> ${pathname}`);
    }
    for (const pathname of pathnames) {
      logger.log(
        `Would revalidate website caches: ${JSON.stringify({ pathname })}`,
      );
    }
    logger.log(
      `Would publish ${publications.length} ${plural(publications.length, "file")} and revalidate ${pathnames.length} website cache ${plural(pathnames.length, "pathname")}.`,
    );
    return { publications, pathnames };
  }

  const { token, url, secret } = validateContentPublishingConfig(env);
  const uploadedPublications = [];

  for (const { file, localPath, pathname } of publications) {
    const body = await readFileImpl(file);
    const blob = await putBlob(pathname, body, {
      access: "public",
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: contentTypeFor(file),
      cacheControlMaxAge: CACHE_MAX_AGE,
    });
    logger.log(`${localPath} -> ${blob.url}`);
    uploadedPublications.push({ file, localPath, pathname, url: blob.url });
  }

  for (let index = 0; index < pathnames.length; index++) {
    const pathname = pathnames[index];
    try {
      await revalidateWebsiteImpl(pathname, { url, secret });
    } catch (error) {
      const detail = error instanceof Error ? error.message : error;
      const safeDetail = redactSecret(detail, secret);
      const retryCommands = pathnames
        .slice(index)
        .map(
          (pendingPathname) =>
            `npm run website:revalidate -- --pathname ${shellQuote(pendingPathname)}`,
        );
      throw new Error(
        [
          "Website revalidation failed after all Blob uploads succeeded.",
          safeDetail,
          "Retry revalidation for the failed and remaining pathnames:",
          ...retryCommands,
        ].join("\n"),
      );
    }
    logger.log(`Revalidated website caches for ${pathname}.`);
  }

  logger.log(
    `Published ${publications.length} ${plural(publications.length, "file")} and revalidated ${pathnames.length} website cache ${plural(pathnames.length, "pathname")}.`,
  );
  return { publications: uploadedPublications, pathnames };
}

function validateBlobPathname(pathname) {
  if (
    typeof pathname !== "string" ||
    pathname.length === 0 ||
    pathname.startsWith("/") ||
    pathname.includes("\\") ||
    pathname.split("/").includes("..")
  ) {
    throw new Error(`Invalid Blob pathname: ${pathname}`);
  }
  return pathname;
}

export async function unpublishContentPathnames(
  pathnames,
  { dryRun = false, env = process.env } = {},
  {
    deleteBlobImpl = deleteBlob,
    logger = console,
    revalidateWebsiteImpl = revalidateWebsitePathname,
  } = {},
) {
  const uniquePathnames = [...new Set(pathnames.map(validateBlobPathname))];

  if (uniquePathnames.length === 0) return { pathnames: [] };

  if (dryRun) {
    for (const pathname of uniquePathnames) {
      logger.log(`Would delete Blob object: ${pathname}`);
      logger.log(
        `Would revalidate website caches: ${JSON.stringify({ pathname })}`,
      );
    }
    return { pathnames: uniquePathnames };
  }

  const { token, url, secret } = validateContentPublishingConfig(env);

  try {
    await deleteBlobImpl(uniquePathnames, { token });
  } catch (error) {
    const detail = error instanceof Error ? error.message : error;
    throw new Error(redactSecret(detail, token));
  }

  for (let index = 0; index < uniquePathnames.length; index += 1) {
    const pathname = uniquePathnames[index];
    logger.log(`Deleted ${pathname} from Blob.`);
    try {
      await revalidateWebsiteImpl(pathname, { url, secret });
    } catch (error) {
      const detail = error instanceof Error ? error.message : error;
      const safeDetail = redactSecret(detail, secret);
      const retryCommands = uniquePathnames
        .slice(index)
        .map(
          (pendingPathname) =>
            `npm run website:revalidate -- --pathname ${shellQuote(pendingPathname)}`,
        );
      throw new Error(
        [
          "Website revalidation failed after Blob deletion succeeded.",
          safeDetail,
          "Retry revalidation for the failed and remaining pathnames:",
          ...retryCommands,
        ].join("\n"),
      );
    }
    logger.log(`Revalidated website caches for ${pathname}.`);
  }

  return { pathnames: uniquePathnames };
}

export async function runContentPublisher(
  argv = process.argv.slice(2),
  env = process.env,
  dependencies = {},
) {
  const options = parseArgs(argv);
  const collectFilesImpl = dependencies.collectFilesImpl ?? collectFiles;
  const files = await collectFilesImpl(options);
  return publishContentFiles(files, { dryRun: options.dryRun, env }, dependencies);
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  dotenv.config({ path: resolve(root, ".env.private"), quiet: true });
  runContentPublisher().catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  });
}
