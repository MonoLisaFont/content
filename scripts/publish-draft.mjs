#!/usr/bin/env node

import { lstat, readFile, realpath, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import dotenv from "dotenv";
import {
  localImagePathForReference,
  referencedImagePaths,
  runContentPublisher,
  transformHtmlImageAttributes,
  transformHtmlImageElements,
  transformInlineMarkdownImageDestinations,
  transformLocalSrcsetReferences,
  transformMarkdownOutsideCode,
  transformReferencedImageDefinitions,
  unpublishContentPathnames,
  validateContentPublishingConfig,
} from "./publish-content-to-blob.mjs";
import {
  createDevToRequest,
  parseMarkdownPost,
  publishDevToArticle,
  readDevToState,
  withDevToStateLock,
  writeDevToState,
} from "./devto-api.mjs";
import {
  createDevToImageUploader,
  prepareDevToAssets,
  readDevToAssetSources,
  resolveDevToSession,
} from "./devto-images.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DRAFT_DIRECTORY = "02_drafts";
const POST_DIRECTORY = "03_posts";
const DEFAULT_DEVTO_STATE = ".devto-state.json";

function usage() {
  return `Promote a MonoLisa draft, publish it to Blob, and optionally publish it to DEV.

Usage:
  npm run publish:draft -- 02_drafts/my-post.md [options]

Options:
  --devto              Also create or update the published article on dev.to
  --canonical-base URL Base for canonical post URLs (or MONOLISA_POST_BASE)
  --tags "tag1,tag2"   Override DEV tags (maximum four)
  --series NAME        Add the DEV article to a series
  --state PATH         DEV article state file (default: .devto-state.json)
  --date YYYY-MM-DD    Override today's local publication date
  --env-file PATH      Credentials file (default: .env.private)
  --dry-run            Validate and preview without writes or network requests
  --help               Show this help

The command updates published (and updated when present), removes draft metadata,
moves the file from 02_drafts to 03_posts, publishes the post and its referenced
images to Vercel Blob, and deletes the obsolete drafts/<filename> Blob object.
Passing --devto publishes with a canonical MonoLisa URL and DEV-hosted image
copies. SVG images are converted to PNG before they are uploaded to DEV.`;
}

function requireOptionValue(argv, index, option) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${option}`);
  }
  return value;
}

export function parsePublishDraftArgs(argv) {
  const options = {
    devto: false,
    dryRun: false,
    help: false,
  };
  const inputs = [];
  const valueOptions = new Map([
    ["--canonical-base", "canonicalBase"],
    ["--date", "date"],
    ["--env-file", "envFile"],
    ["--series", "series"],
    ["--state", "state"],
    ["--tags", "tags"],
  ]);

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--devto") options.devto = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else if (valueOptions.has(arg)) {
      options[valueOptions.get(arg)] = requireOptionValue(argv, index, arg);
      index += 1;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      inputs.push(arg);
    }
  }

  if (!options.help && inputs.length !== 1) {
    throw new Error(`Pass exactly one draft path.\n\n${usage()}`);
  }

  if (options.date) validateDate(options.date);
  if (typeof options.tags === "string") {
    options.tags = options.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (options.tags.length > 4) {
      throw new Error("DEV accepts at most four tags.");
    }
  }

  options.input = inputs[0];
  return options;
}

function validateDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid publication date: ${value}. Expected YYYY-MM-DD.`);
  }
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`Invalid publication date: ${value}.`);
  }
  return value;
}

export function localPublicationDate(now = new Date(), timeZone) {
  const parts = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(timeZone ? { timeZone } : {}),
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function frontmatterKeyIndexes(lines, key) {
  const pattern = new RegExp(`^${key}:\\s*`);
  return lines.flatMap((line, index) => (pattern.test(line) ? [index] : []));
}

export function updatePublicationFrontmatter(markdown, date) {
  validateDate(date);
  const bom = markdown.startsWith("\uFEFF") ? "\uFEFF" : "";
  const source = markdown.slice(bom.length);
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?=\r?\n|$)/);
  if (!match) {
    throw new Error("Post must begin with closed YAML frontmatter.");
  }

  const newline = source.startsWith("---\r\n") ? "\r\n" : "\n";
  let lines = match[1].split(/\r?\n/);
  const titleIndexes = frontmatterKeyIndexes(lines, "title");
  if (titleIndexes.length !== 1 || !lines[titleIndexes[0]].replace(/^title:\s*/, "").trim()) {
    throw new Error("Post frontmatter must contain exactly one non-empty title.");
  }

  const publishedIndexes = frontmatterKeyIndexes(lines, "published");
  if (publishedIndexes.length > 1) {
    throw new Error("Post frontmatter contains duplicate published fields.");
  }
  if (publishedIndexes.length === 1) {
    lines[publishedIndexes[0]] = `published: ${date}`;
  } else {
    lines.splice(titleIndexes[0] + 1, 0, `published: ${date}`);
  }

  const updatedIndexes = frontmatterKeyIndexes(lines, "updated");
  if (updatedIndexes.length > 1) {
    throw new Error("Post frontmatter contains duplicate updated fields.");
  }
  if (updatedIndexes.length === 1) {
    lines[updatedIndexes[0]] = `updated: ${date}`;
  }

  lines = lines.filter((line) => !/^draft:\s*/.test(line));
  const replacement = `---${newline}${lines.join(newline)}${newline}---`;
  return bom + replacement + source.slice(match[0].length);
}

function normalizedFilename(input, rootDir) {
  if (!input || typeof input !== "string") {
    throw new Error("A draft path is required.");
  }
  if (input.includes("\\")) {
    throw new Error("Draft paths must use forward slashes.");
  }

  const draftDir = resolve(rootDir, DRAFT_DIRECTORY);
  const postDir = resolve(rootDir, POST_DIRECTORY);
  const resolvedInput = resolve(rootDir, input);
  const inputDirectory = dirname(resolvedInput);
  let filename;

  if (inputDirectory === draftDir || inputDirectory === postDir) {
    filename = basename(resolvedInput);
  } else if (inputDirectory === rootDir && !input.includes("/")) {
    filename = basename(input);
  } else {
    throw new Error(
      `Draft must be a Markdown file directly inside ${DRAFT_DIRECTORY}.`,
    );
  }

  if (!extname(filename)) filename += ".md";
  if (extname(filename) !== ".md" || filename === ".md") {
    throw new Error("Draft filename must end in .md.");
  }
  return filename;
}

export function publicationPaths(input, rootDir = root) {
  const filename = normalizedFilename(input, rootDir);
  return {
    filename,
    slug: filename.slice(0, -3),
    sourcePath: resolve(rootDir, DRAFT_DIRECTORY, filename),
    targetPath: resolve(rootDir, POST_DIRECTORY, filename),
  };
}

async function fileState(path, lstatImpl) {
  try {
    const metadata = await lstatImpl(path);
    if (metadata.isSymbolicLink()) return "symlink";
    if (metadata.isFile()) return "file";
    return "other";
  } catch (error) {
    if (error.code === "ENOENT") return "missing";
    throw error;
  }
}

async function resolvePublicationState(paths, lstatImpl) {
  const [sourceState, targetState] = await Promise.all([
    fileState(paths.sourcePath, lstatImpl),
    fileState(paths.targetPath, lstatImpl),
  ]);

  if (sourceState === "symlink" || targetState === "symlink") {
    throw new Error("Draft and post paths cannot be symbolic links.");
  }
  if (sourceState === "other" || targetState === "other") {
    throw new Error("Draft and post paths must be regular files.");
  }
  if (sourceState === "file" && targetState === "file") {
    throw new Error(`Both draft and published post exist for ${paths.filename}.`);
  }
  if (sourceState === "missing" && targetState === "missing") {
    throw new Error(`Draft does not exist: ${DRAFT_DIRECTORY}/${paths.filename}`);
  }

  return sourceState === "file"
    ? { mode: "promote", activePath: paths.sourcePath }
    : { mode: "resume", activePath: paths.targetPath };
}

async function validatePublicationDirectories(
  rootDir,
  { lstatImpl, realpathImpl },
) {
  const rootRealPath = await realpathImpl(rootDir);
  for (const directory of [DRAFT_DIRECTORY, POST_DIRECTORY, "images"]) {
    const directoryPath = resolve(rootDir, directory);
    let metadata;
    try {
      metadata = await lstatImpl(directoryPath);
    } catch (error) {
      if (error?.code === "ENOENT") {
        throw new Error(`Required directory does not exist: ${directory}`);
      }
      throw error;
    }
    if (metadata.isSymbolicLink()) {
      throw new Error(`Publication directory cannot be a symbolic link: ${directory}`);
    }
    if (!metadata.isDirectory()) {
      throw new Error(`Publication path must be a directory: ${directory}`);
    }
    if (dirname(await realpathImpl(directoryPath)) !== rootRealPath) {
      throw new Error(`Publication directory escapes the repository: ${directory}`);
    }
  }
}

async function validateReferencedImages(markdown, rootDir, lstatImpl) {
  const localPaths = [...new Set(referencedImagePaths(markdown))];
  for (const localPath of localPaths) {
    const imagePath = resolve(rootDir, localPath);
    const state = await fileState(imagePath, lstatImpl);
    if (state !== "file") {
      throw new Error(`${localPath} is missing or is not a regular file.`);
    }
  }
  return localPaths;
}

function mappedImageUrl(
  reference,
  imageUrls,
  { preserveReferenceSuffix = true } = {},
) {
  const localPath = localImagePathForReference(reference);
  if (!localPath) return reference;
  const url = imageUrls.get(localPath);
  if (!url) throw new Error(`No hosted image URL is available for ${localPath}.`);

  if (!preserveReferenceSuffix) return url;

  const originalUrl = reference.startsWith("/")
    ? new URL(reference, "https://local.invalid")
    : new URL(reference);
  if (!originalUrl.search && !originalUrl.hash) return url;

  const blobUrl = new URL(url);
  if (originalUrl.search) {
    blobUrl.search = blobUrl.search
      ? `${blobUrl.search}&${originalUrl.search.slice(1)}`
      : originalUrl.search;
  }
  if (originalUrl.hash) blobUrl.hash = originalUrl.hash;
  return blobUrl.href;
}

export function rewriteDevToImages(
  markdown,
  imageUrls,
  { preserveReferenceSuffix = true } = {},
) {
  const rewritten = transformMarkdownOutsideCode(markdown, (prose) =>
    transformHtmlImageElements(
      transformInlineMarkdownImageDestinations(
        prose,
        (reference) =>
          mappedImageUrl(reference, imageUrls, {
            preserveReferenceSuffix,
          }),
      ),
      (element) =>
        transformHtmlImageAttributes(element, (name, value) =>
          name === "srcset"
            ? transformLocalSrcsetReferences(value, (reference) =>
                mappedImageUrl(reference, imageUrls, {
                  preserveReferenceSuffix,
                }),
              )
            : mappedImageUrl(value, imageUrls, {
                preserveReferenceSuffix,
              }),
        ),
    ),
  );

  return transformReferencedImageDefinitions(rewritten, (reference) =>
    mappedImageUrl(reference, imageUrls, { preserveReferenceSuffix }),
  );
}

export function rewriteDevToLinks(markdown, canonicalBase) {
  const base = canonicalBase.replace(/\/+$/, "");
  const origin = new URL(base).origin;
  const markdownLinkPattern = /(?<!!)\[([^\]]+)\]\(\s*<?((?:\/|\.\.\/)[^\s)>]+)(>?[^)]*\))/g;

  return transformMarkdownOutsideCode(markdown, (prose) =>
    prose.replace(
      markdownLinkPattern,
      (_match, label, reference, suffix) => {
        const url = reference.startsWith("../")
          ? `${base}/${reference.slice(3)}`
          : `${origin}${reference}`;
        return `[${label}](${url}${suffix}`;
      },
    ),
  );
}

function canonicalPostUrl(canonicalBase, slug) {
  let url;
  try {
    url = new URL(canonicalBase);
  } catch {
    throw new Error(`Invalid DEV canonical base URL: ${canonicalBase}`);
  }
  if (!["http:", "https:"].includes(url.protocol) || url.search || url.hash) {
    throw new Error(`Invalid DEV canonical base URL: ${canonicalBase}`);
  }
  return `${canonicalBase.replace(/\/+$/, "")}/${encodeURIComponent(slug)}`;
}

function canonicalUrlsMatch(left, right) {
  return (
    typeof left === "string" &&
    typeof right === "string" &&
    left.replace(/\/+$/, "") === right.replace(/\/+$/, "")
  );
}

function validateDevToStateCanonical(state, slug, canonicalUrl) {
  const entry = state?.[slug];
  if (
    entry?.canonical_url &&
    !canonicalUrlsMatch(entry.canonical_url, canonicalUrl)
  ) {
    throw new Error(
      `DEV state for ${slug} points to a different canonical URL. ` +
        "Inspect or remove that state entry before publishing.",
    );
  }
  return entry && typeof entry === "object" ? entry : {};
}

function validatedDevToMediaUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  if (
    url.protocol !== "https:" ||
    !url.hostname ||
    url.hostname === "blob.vercel-storage.com" ||
    url.hostname.endsWith(".blob.vercel-storage.com")
  ) {
    return undefined;
  }
  return url.href;
}

function cachedDevToImage(entry, asset) {
  if (
    !entry ||
    entry.source_sha256 !== asset.sourceHash ||
    entry.filename !== asset.filename ||
    entry.content_type !== asset.contentType
  ) {
    return undefined;
  }
  return validatedDevToMediaUrl(entry.url);
}

function assertMatchingDevToUsers(sessionUser, apiUser) {
  const sessionId = sessionUser?.id;
  const apiId = apiUser?.id;
  const sessionUsername = sessionUser?.username;
  const apiUsername = apiUser?.username;
  const usernamesMatch =
    typeof sessionUsername === "string" &&
    typeof apiUsername === "string" &&
    sessionUsername.toLowerCase() === apiUsername.toLowerCase();

  const idsArePresent = sessionId !== undefined && apiId !== undefined;
  const identitiesMatch = idsArePresent
    ? String(sessionId) === String(apiId)
    : usernamesMatch;

  if (!identitiesMatch) {
    throw new Error(
      "DEVTO_API_KEY and DEVTO_SESSION_COOKIE belong to different DEV accounts.",
    );
  }
}

async function fetchDevToApiUser({ apiKey, logger }) {
  const request = createDevToRequest({ apiKey, logger });
  const user = await request("/users/me", { method: "GET" });
  if (
    !user ||
    Array.isArray(user) ||
    typeof user !== "object" ||
    (user.id === undefined &&
      !(typeof user.username === "string" && user.username.trim()))
  ) {
    throw new Error("DEV /users/me returned an unexpected response.");
  }
  return user;
}

export async function publishDevToWithImages(
  {
    apiKey,
    assets,
    canonicalBase,
    canonicalUrl,
    csrfToken,
    logger = console,
    lock = true,
    post,
    series,
    sessionCookie,
    sessionUser,
    statePath,
    tags,
  },
  {
    createImageUploaderImpl = createDevToImageUploader,
    publishDevToImpl = publishDevToArticle,
    readStateImpl = readDevToState,
    withStateLockImpl = withDevToStateLock,
    writeStateImpl = writeDevToState,
  } = {},
) {
  const publish = async () => {
    let state = await readStateImpl(statePath);
    const stateEntry = validateDevToStateCanonical(
      state,
      post.slug,
      canonicalUrl,
    );
    const imageState = { ...(stateEntry.devto_images ?? {}) };
    const imageUrls = new Map();
    let uploader;

    for (const asset of assets) {
      let url = cachedDevToImage(imageState[asset.localPath], asset);
      if (url) {
        logger.log(`Reusing DEV image for ${asset.localPath}: ${url}`);
      } else {
        uploader ??= createImageUploaderImpl({
          csrfToken,
          logger,
          sessionCookie,
          sessionUser,
        });
        const uploaded = await uploader(asset);
        url = validatedDevToMediaUrl(uploaded?.url);
        if (!url) {
          throw new Error(
            `DEV returned an invalid hosted image URL for ${asset.localPath}.`,
          );
        }
        imageState[asset.localPath] = {
          content_sha256: asset.contentHash,
          content_type: asset.contentType,
          filename: asset.filename,
          source_sha256: asset.sourceHash,
          url,
        };
        state = {
          ...state,
          [post.slug]: {
            ...stateEntry,
            canonical_url: canonicalUrl,
            devto_images: { ...imageState },
          },
        };
        await writeStateImpl(statePath, state);
        logger.log(`Uploaded ${asset.localPath} to DEV: ${url}`);
      }
      imageUrls.set(asset.localPath, url);
    }

    const bodyMarkdown = rewriteDevToLinks(
      rewriteDevToImages(post.body, imageUrls, {
        preserveReferenceSuffix: false,
      }),
      canonicalBase,
    );
    const unresolvedImages = [...new Set(referencedImagePaths(bodyMarkdown))];
    if (unresolvedImages.length > 0) {
      throw new Error(
        `DEV Markdown still contains local images: ${unresolvedImages.join(", ")}`,
      );
    }
    if (
      /https?:\/\/(?:[a-z0-9-]+\.)*blob\.vercel-storage\.com\b/i.test(
        bodyMarkdown,
      )
    ) {
      throw new Error("DEV Markdown still contains a Vercel Blob URL.");
    }

    const articleResult = await publishDevToImpl({
      apiKey,
      canonicalUrl,
      lock: false,
      post: { ...post, bodyMarkdown },
      series,
      statePath,
      tags,
    });
    return { ...articleResult, imageUrls };
  };

  return lock ? withStateLockImpl(statePath, publish) : publish();
}

function validatePublishedPost(post, path) {
  if (Object.hasOwn(post.frontmatter, "draft")) {
    throw new Error(`${path} still contains draft metadata.`);
  }

  const published = post.frontmatter.published;
  const dateOnly = typeof published === "string" && /^\d{4}-\d{2}-\d{2}$/.test(published);
  const dateTime =
    typeof published === "string" &&
    /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(published);
  let valid = false;

  if (dateOnly) {
    try {
      validateDate(published);
      valid = true;
    } catch {
      valid = false;
    }
  } else if (dateTime) {
    valid = !Number.isNaN(Date.parse(published));
  }

  if (!valid) {
    throw new Error(
      `${path} must contain a concrete published date before publication.`,
    );
  }
}

async function movePromotedPost(
  sourcePath,
  targetPath,
  markdown,
  { writeFileImpl, unlinkImpl },
) {
  try {
    await writeFileImpl(targetPath, markdown, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if (error?.code !== "EEXIST") {
      try {
        await unlinkImpl(targetPath);
      } catch {
        // A failed write may not have created the destination.
      }
    }
    throw error;
  }
  try {
    await unlinkImpl(sourcePath);
  } catch (error) {
    try {
      await unlinkImpl(targetPath);
    } catch {
      // Keep the original error: the source remains the authoritative copy.
    }
    throw error;
  }
}

function repositoryPath(rootDir, path) {
  return relative(rootDir, path).split(sep).join("/");
}

export async function publishDraft(
  options,
  {
    rootDir = root,
    logger = console,
    now = () => new Date(),
    lstatImpl = lstat,
    readFileImpl = readFile,
    realpathImpl = realpath,
    writeFileImpl = writeFile,
    unlinkImpl = unlink,
    validateContentConfigImpl = validateContentPublishingConfig,
    publishContentImpl = (input, env) => runContentPublisher([input], env),
    unpublishContentImpl = (pathnames, env) =>
      unpublishContentPathnames(pathnames, { env }),
    fetchDevToApiUserImpl = fetchDevToApiUser,
    prepareDevToAssetsImpl = prepareDevToAssets,
    publishDevToImpl = publishDevToArticle,
    publishDevToWithImagesImpl = publishDevToWithImages,
    readDevToAssetSourcesImpl = readDevToAssetSources,
    readDevToStateImpl = readDevToState,
    resolveDevToSessionImpl = resolveDevToSession,
    withDevToStateLockImpl = withDevToStateLock,
  } = {},
) {
  const env = options.env ?? process.env;
  const paths = publicationPaths(options.input, rootDir);
  await validatePublicationDirectories(rootDir, { lstatImpl, realpathImpl });
  const state = await resolvePublicationState(paths, lstatImpl);
  const originalMarkdown = await readFileImpl(state.activePath, "utf8");
  const promotionDate =
    state.mode === "promote"
      ? options.date ?? localPublicationDate(now())
      : undefined;
  const publishedMarkdown =
    state.mode === "promote"
      ? updatePublicationFrontmatter(originalMarkdown, promotionDate)
      : originalMarkdown;
  const post = parseMarkdownPost(publishedMarkdown, {
    path: paths.targetPath,
    slug: paths.slug,
  });
  validatePublishedPost(post, repositoryPath(rootDir, paths.targetPath));
  const date = post.frontmatter.published;
  const imagePaths = await validateReferencedImages(
    publishedMarkdown,
    rootDir,
    lstatImpl,
  );
  const canonicalBase = (
    options.canonicalBase ??
    env.MONOLISA_POST_BASE ??
    ""
  ).replace(/\/+$/, "");
  const staleDraftPathname = `drafts/${paths.filename}`;
  const targetRepositoryPath = repositoryPath(rootDir, paths.targetPath);
  const statePath = resolve(rootDir, options.state ?? DEFAULT_DEVTO_STATE);

  if (options.devto && !canonicalBase) {
    throw new Error(
      "Pass --canonical-base or set MONOLISA_POST_BASE before publishing to DEV.",
    );
  }
  const canonicalUrl = options.devto
    ? canonicalPostUrl(canonicalBase, paths.slug)
    : undefined;

  if (options.dryRun) {
    let devToStateEntry = {};
    let devToSources = [];
    if (options.devto) {
      const devToState = await readDevToStateImpl(statePath, {
        readFile: readFileImpl,
      });
      devToStateEntry = validateDevToStateCanonical(
        devToState,
        paths.slug,
        canonicalUrl,
      );
      devToSources = await readDevToAssetSourcesImpl(imagePaths, {
        rootDir,
        readFile: readFileImpl,
      });
    }

    if (state.mode === "promote") {
      logger.log(
        `Would move ${DRAFT_DIRECTORY}/${paths.filename} -> ${POST_DIRECTORY}/${paths.filename}`,
      );
      const updatedLabel = /\nupdated:\s*/.test(originalMarkdown)
        ? " and updated"
        : "";
      logger.log(`Would set published${updatedLabel} to ${date}.`);
    } else {
      logger.log(`Would resume publication of ${POST_DIRECTORY}/${paths.filename}.`);
    }
    for (const imagePath of imagePaths) logger.log(`Would publish ${imagePath}.`);
    logger.log(`Would publish ${targetRepositoryPath}.`);
    logger.log(`Would delete Blob object: ${staleDraftPathname}.`);
    if (options.devto) {
      for (const source of devToSources) {
        const cachedUrl = cachedDevToImage(
          devToStateEntry.devto_images?.[source.localPath],
          source,
        );
        if (cachedUrl) {
          logger.log(`Would reuse DEV image for ${source.localPath}: ${cachedUrl}`);
          continue;
        }
        if (source.requiresConversion) {
          logger.log(`Would convert ${source.localPath} to PNG for DEV.`);
        }
        logger.log(`Would upload ${source.localPath} to DEV image storage.`);
      }
      logger.log(`Would publish to DEV with canonical URL ${canonicalUrl}.`);
    }
    return {
      date,
      imagePaths,
      mode: state.mode,
      paths,
      publishedMarkdown,
    };
  }

  validateContentConfigImpl(env);
  if (options.devto && !env.DEVTO_API_KEY) {
    throw new Error("DEVTO_API_KEY is missing from .env.private");
  }

  const publishStages = async ({ devToAssets = [], devToSession } = {}) => {
    if (state.mode === "promote") {
      await movePromotedPost(
        paths.sourcePath,
        paths.targetPath,
        publishedMarkdown,
        { writeFileImpl, unlinkImpl },
      );
      logger.log(
        `Promoted ${DRAFT_DIRECTORY}/${paths.filename} -> ` +
          `${POST_DIRECTORY}/${paths.filename} (${date}).`,
      );
    } else {
      logger.log(`Resuming publication of ${POST_DIRECTORY}/${paths.filename}.`);
    }

    let contentResult;
    let devToResult;
    try {
      contentResult = await publishContentImpl(targetRepositoryPath, env);
      await unpublishContentImpl([staleDraftPathname], env);

      if (options.devto) {
        devToResult = await publishDevToWithImagesImpl({
          apiKey: env.DEVTO_API_KEY,
          assets: devToAssets,
          canonicalBase,
          canonicalUrl,
          csrfToken: devToSession?.csrfToken,
          lock: false,
          logger,
          post,
          series: options.series,
          sessionCookie: env.DEVTO_SESSION_COOKIE,
          sessionUser: devToSession?.sessionUser,
          statePath,
          tags: options.tags,
        }, {
          publishDevToImpl,
        });
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(
        `${detail}\nAfter completing any retry steps above, rerun the same ` +
          "publish:draft command; it will resume the remaining stages.",
      );
    }

    return {
      contentResult,
      date,
      devToResult,
      imagePaths,
      mode: state.mode,
      paths,
    };
  };

  if (!options.devto) return publishStages();

  return withDevToStateLockImpl(statePath, async () => {
    const devToState = await readDevToStateImpl(statePath, {
      readFile: readFileImpl,
    });
    const devToStateEntry = validateDevToStateCanonical(
      devToState,
      paths.slug,
      canonicalUrl,
    );
    const devToSources = await readDevToAssetSourcesImpl(imagePaths, {
      rootDir,
      readFile: readFileImpl,
    });
    const missingSources = devToSources.filter(
      (source) =>
        !cachedDevToImage(
          devToStateEntry.devto_images?.[source.localPath],
          source,
        ),
    );

    if (missingSources.length > 0 && !env.DEVTO_SESSION_COOKIE) {
      throw new Error("DEVTO_SESSION_COOKIE is missing from .env.private");
    }

    const preparedAssets = missingSources.length
      ? await prepareDevToAssetsImpl(missingSources, { rootDir })
      : [];
    let devToSession;
    if (missingSources.length > 0) {
      devToSession = await resolveDevToSessionImpl({
        sessionCookie: env.DEVTO_SESSION_COOKIE,
      });
    }
    const apiUser = await fetchDevToApiUserImpl({
      apiKey: env.DEVTO_API_KEY,
      logger,
    });
    if (devToSession) {
      assertMatchingDevToUsers(devToSession.sessionUser, apiUser);
    }

    const preparedByPath = new Map(
      preparedAssets.map((asset) => [asset.localPath, asset]),
    );
    const devToAssets = devToSources.map(
      (source) => preparedByPath.get(source.localPath) ?? source,
    );
    return publishStages({ devToAssets, devToSession });
  });
}

export async function runPublishDraft(argv = process.argv.slice(2)) {
  const options = parsePublishDraftArgs(argv);
  if (options.help) {
    console.log(usage());
    return;
  }

  dotenv.config({
    path: resolve(root, options.envFile ?? ".env.private"),
    quiet: true,
  });
  return publishDraft({ ...options, env: process.env });
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  runPublishDraft().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
