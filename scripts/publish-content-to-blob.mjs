#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { put } from "@vercel/blob";
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

export function referencedImagePaths(markdown) {
  const references = [];
  const markdownImagePattern = /!\[[^\]]*\]\(\s*<?([^\s)>]+)>?(?:\s+[^)]*)?\)/g;
  const htmlElementPattern = /<(?:img|source)\b[^>]*>/gi;
  const htmlAttributePattern = /\b(?:src|srcset)\s*=\s*["']([^"']+)["']/gi;

  for (const match of markdown.matchAll(markdownImagePattern)) {
    references.push(match[1]);
  }

  for (const elementMatch of markdown.matchAll(htmlElementPattern)) {
    for (const attributeMatch of elementMatch[0].matchAll(htmlAttributePattern)) {
      for (const candidate of attributeMatch[1].split(/,\s+/)) {
        const [url] = candidate.trim().split(/\s+/);
        if (url) references.push(url);
      }
    }
  }

  return references
    .map(localImagePathForReference)
    .filter((path) => path !== null);
}

function localImagePathForReference(reference) {
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

  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is missing from .env.private");
  }
  const { url, secret } = getWebsiteRevalidationConfig(env);

  for (const { file, localPath, pathname } of publications) {
    const body = await readFileImpl(file);
    const blob = await putBlob(pathname, body, {
      access: "public",
      token: env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: contentTypeFor(file),
      cacheControlMaxAge: CACHE_MAX_AGE,
    });
    logger.log(`${localPath} -> ${blob.url}`);
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
  return { publications, pathnames };
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
