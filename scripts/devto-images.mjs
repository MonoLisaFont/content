import { spawn as nodeSpawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile as nodeReadFile } from "node:fs/promises";
import {
  basename,
  extname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from "node:path";

import {
  DEFAULT_DEVTO_USER_AGENT,
  redactSecrets,
} from "./devto-api.mjs";

export const DEVTO_IMAGE_UPLOAD_PATH = "/image_uploads";
export const DEVTO_SESSION_DATA_PATH = "/async_info/base_data";
export const DEVTO_IMAGE_MAX_BYTES = 25 * 1024 * 1024;
export const DEVTO_IMAGE_MAX_FILENAME_LENGTH = 250;
export const DEVTO_IMAGE_MAX_DIMENSION = 4096;
export const DEVTO_SVG_CONVERSION_POLICY = "rsvg-convert:png:v1";
export const DEVTO_IMAGE_MAX_FRAMES = 500;

export const DEVTO_RASTER_CONTENT_TYPES = Object.freeze({
  ".bmp": "image/bmp",
  ".dng": "image/x-adobe-dng",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".jpe": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
});

const DEFAULT_DEVTO_ORIGIN = "https://dev.to";
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_PROCESS_TIMEOUT_MS = 30_000;
const DEFAULT_PROCESS_STDERR_BYTES = 1024 * 1024;
const PUBLISHING_SECRET_ENV_NAMES = Object.freeze([
  "BLOB_READ_WRITE_TOKEN",
  "DEVTO_API_KEY",
  "DEVTO_SESSION_COOKIE",
  "WEBSITE_REVALIDATION_SECRET",
]);
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/** Run a subprocess without a shell and collect its stdout and stderr. */
export function runSpawn(command, args = [], options = {}) {
  const spawnImpl = options.spawnImpl ?? options.spawn ?? nodeSpawn;
  const input = options.input;
  const timeoutMs = options.timeoutMs ?? DEFAULT_PROCESS_TIMEOUT_MS;
  const maxStdoutBytes = options.maxStdoutBytes ?? DEVTO_IMAGE_MAX_BYTES;
  const maxStderrBytes = options.maxStderrBytes ?? DEFAULT_PROCESS_STDERR_BYTES;

  for (const [name, value] of [
    ["timeoutMs", timeoutMs],
    ["maxStdoutBytes", maxStdoutBytes],
    ["maxStderrBytes", maxStderrBytes],
  ]) {
    if (!Number.isInteger(value) || value < 1) {
      throw new TypeError(`${name} must be a positive integer.`);
    }
  }

  return new Promise((resolvePromise, rejectPromise) => {
    let child;

    try {
      const spawnOptions = {
        shell: false,
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
        ...(options.env ? { env: options.env } : {}),
      };
      child = spawnImpl(command, args, spawnOptions);
    } catch (error) {
      rejectPromise(error);
      return;
    }

    const stdout = [];
    const stderr = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let settled = false;
    let timeout;

    const reject = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      rejectPromise(error);
    };

    const collect = (chunks, kind, maximum) => (chunk) => {
      const data = Buffer.from(chunk);
      if (kind === "stdout") stdoutBytes += data.length;
      else stderrBytes += data.length;
      const total = kind === "stdout" ? stdoutBytes : stderrBytes;
      if (total > maximum) {
        child.kill?.("SIGKILL");
        reject(new Error(`${command} exceeded its ${kind} size limit.`));
        return;
      }
      chunks.push(data);
    };

    child.stdout?.on("data", collect(stdout, "stdout", maxStdoutBytes));
    child.stderr?.on("data", collect(stderr, "stderr", maxStderrBytes));
    child.stdout?.once("error", reject);
    child.stderr?.once("error", reject);
    child.once("error", reject);
    child.once("close", (exitCode, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolvePromise({
        exitCode,
        signal,
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr),
      });
    });

    timeout = setTimeout(() => {
      child.kill?.("SIGKILL");
      reject(new Error(`${command} timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
    timeout.unref?.();

    if (!child.stdin || typeof child.stdin.end !== "function") {
      reject(new Error(`Could not open stdin for ${command}.`));
      return;
    }

    child.stdin.once?.("error", reject);

    try {
      child.stdin.end(input === undefined ? undefined : toBuffer(input));
    } catch (error) {
      reject(error);
    }
  });
}

/** Fail early with an actionable message when librsvg is unavailable. */
export async function preflightRsvgConvert(options = {}, dependencies = {}) {
  const settings = { ...options, ...dependencies };
  const command = settings.rsvgConvertCommand || "rsvg-convert";
  const runner = processRunner(settings);
  let result;

  try {
    result = normalizeProcessResult(await runner(command, ["--version"], {}));
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw missingRsvgConvertError(command);
    }

    throw new Error(
      `Could not run ${command} --version: ${error?.message || error}`,
    );
  }

  if (result.exitCode !== 0) {
    const detail = processErrorDetail(result);
    throw new Error(
      `${command} is not available or failed its preflight${detail}. ` +
        "Install librsvg so rsvg-convert is available on PATH.",
    );
  }

  return result.stdout.toString("utf8").trim();
}

/** Convert SVG bytes to PNG bytes entirely through stdin/stdout. */
export async function convertSvgToPng(
  svgData,
  options = {},
  dependencies = {},
) {
  const settings = { ...options, ...dependencies };
  const command = settings.rsvgConvertCommand || "rsvg-convert";
  const runner = processRunner(settings);
  const input = toBuffer(svgData);

  if (!input.length) {
    throw new Error("Cannot convert an empty SVG image.");
  }
  if (input.length > DEVTO_IMAGE_MAX_BYTES) {
    throw new Error("SVG input exceeds DEV's 25 MB image limit.");
  }

  if (settings.preflight !== false) {
    await preflightRsvgConvert(settings);
  }

  let result;

  try {
    result = normalizeProcessResult(
      await runner(command, ["--format", "png"], { input }),
    );
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw missingRsvgConvertError(command);
    }

    throw new Error(`SVG conversion failed: ${error?.message || error}`);
  }

  if (result.exitCode !== 0) {
    throw new Error(`SVG conversion failed${processErrorDetail(result)}.`);
  }

  validateGeneratedPng(result.stdout);

  return result.stdout;
}

/** Extract a Rails CSRF token from DEV's signed-in editor page. */
export function extractDevToCsrfToken(html) {
  for (const match of String(html).matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = parseHtmlAttributes(match[0]);

    if (
      attributes.name?.toLowerCase() === "csrf-token" &&
      attributes.content
    ) {
      return decodeHtmlEntities(attributes.content).trim() || undefined;
    }
  }

  return undefined;
}

/**
 * Resolve both DEV's CSRF token and the identity attached to a session cookie.
 * Callers can compare sessionUser with GET /api/users/me before uploading.
 */
export async function resolveDevToSession(
  options = {},
  dependencies = {},
) {
  const settings = { ...options, ...dependencies };
  const sessionCookie = validateHeaderSecret(
    settings.sessionCookie,
    "sessionCookie",
  );
  const origin = validateOrigin(settings.origin || DEFAULT_DEVTO_ORIGIN);
  const fetchImpl = settings.fetchImpl ?? settings.fetch ?? globalThis.fetch;
  const userAgent = settings.userAgent || DEFAULT_DEVTO_USER_AGENT;
  const secrets = sessionSecrets(sessionCookie);
  let response;

  if (typeof fetchImpl !== "function") {
    throw new TypeError("A fetch implementation is required.");
  }

  try {
    response = await fetchImpl(`${origin}${DEVTO_SESSION_DATA_PATH}`, {
      method: "GET",
      redirect: "manual",
      headers: {
        Accept: "application/json",
        Cookie: sessionCookie,
        "User-Agent": userAgent,
      },
    });
  } catch (error) {
    throw redactedError(
      `Could not resolve the signed-in DEV session: ${error?.message || error}`,
      secrets,
    );
  }

  const status = responseStatus(response);
  assertSameOriginResponse(response, origin, "DEV session-data request");

  if (isRedirectResponse(response, status)) {
    throw new Error(
      "DEV redirected the session-data request; the signed-in session cookie is missing or expired.",
    );
  }

  if (!responseIsOk(response, status)) {
    throw new Error(
      `DEV session-data request failed with HTTP ${status}; ` +
        "the signed-in session cookie may be expired.",
    );
  }

  const payload = await readJsonResponse(response, secrets);
  const csrfToken =
    payload && typeof payload === "object" ? payload.token : undefined;
  const sessionUser = parseSessionUser(payload?.user);

  if (!csrfToken) {
    throw new Error(
      "DEV session data did not contain a CSRF token.",
    );
  }

  validateHeaderSecret(csrfToken, "DEV session CSRF token");

  if (!sessionUser) {
    throw new Error(
      "DEV session data did not contain a signed-in user; the session cookie is missing or expired.",
    );
  }

  return { csrfToken, sessionUser };
}

/** Fetch the CSRF meta tag from DEV's signed-in /new editor page. */
export async function fetchDevToEditorCsrfToken(
  options = {},
  dependencies = {},
) {
  const settings = { ...options, ...dependencies };
  const sessionCookie = validateHeaderSecret(
    settings.sessionCookie,
    "sessionCookie",
  );
  const origin = validateOrigin(settings.origin || DEFAULT_DEVTO_ORIGIN);
  const fetchImpl = settings.fetchImpl ?? settings.fetch ?? globalThis.fetch;
  const userAgent = settings.userAgent || DEFAULT_DEVTO_USER_AGENT;
  const secrets = sessionSecrets(sessionCookie);
  let response;

  if (typeof fetchImpl !== "function") {
    throw new TypeError("A fetch implementation is required.");
  }

  try {
    response = await fetchImpl(`${origin}/new`, {
      method: "GET",
      redirect: "manual",
      headers: {
        Accept: "text/html",
        Cookie: sessionCookie,
        "User-Agent": userAgent,
      },
    });
  } catch (error) {
    throw redactedError(
      `Could not fetch DEV's editor page: ${error?.message || error}`,
      secrets,
    );
  }

  const status = responseStatus(response);
  assertSameOriginResponse(response, origin, "DEV editor request");

  if (isRedirectResponse(response, status)) {
    throw new Error(
      "DEV redirected the editor request; the signed-in session cookie is missing or expired.",
    );
  }

  if (!responseIsOk(response, status)) {
    throw new Error(
      `DEV editor request failed with HTTP ${status}; ` +
        "the signed-in session cookie may be expired.",
    );
  }

  let html;

  try {
    html = await response.text();
  } catch (error) {
    throw redactedError(
      `Could not read DEV's editor page: ${error?.message || error}`,
      secrets,
    );
  }

  const csrfToken = extractDevToCsrfToken(html);

  if (!csrfToken) {
    throw new Error(
      "The signed-in DEV editor page did not contain a CSRF token; " +
        "the session cookie may be expired.",
    );
  }

  return validateHeaderSecret(csrfToken, "DEV editor CSRF token");
}

/** Compatibility helper returning only the token. Base data is preferred. */
export async function fetchDevToCsrfToken(
  options = {},
  dependencies = {},
) {
  const settings = { ...options, ...dependencies };

  if (settings.preferBaseData === false) {
    return fetchDevToEditorCsrfToken(options, dependencies);
  }

  const { csrfToken } = await resolveDevToSession(options, dependencies);
  return csrfToken;
}

/**
 * Read and hash original files without invoking image conversion. This lets a
 * caller check its DEV URL cache before paying the SVG conversion cost.
 */
export async function readDevToAssetSources(
  localPaths,
  options = {},
  dependencies = {},
) {
  if (!Array.isArray(localPaths)) {
    throw new TypeError("localPaths must be an array.");
  }

  const settings = { ...options, ...dependencies };
  const rootDir = resolve(settings.rootDir || process.cwd());
  const readFile = settings.readFileImpl ?? settings.readFile ?? nodeReadFile;
  const descriptors = [];
  const seen = new Set();

  if (typeof readFile !== "function") {
    throw new TypeError("readFile must be a function.");
  }

  for (const inputPath of localPaths) {
    if (typeof inputPath !== "string" || !inputPath.trim()) {
      throw new TypeError("Every local image path must be a non-empty string.");
    }

    const absolutePath = resolve(rootDir, inputPath);
    const repositoryPath = relative(rootDir, absolutePath);

    if (
      !repositoryPath ||
      repositoryPath === ".." ||
      repositoryPath.startsWith(`..${sep}`) ||
      isAbsolute(repositoryPath)
    ) {
      throw new Error(`Image path escapes the repository: ${inputPath}`);
    }

    const localPath = repositoryPath.split(sep).join("/");
    if (seen.has(localPath)) continue;
    seen.add(localPath);

    const extension = extname(localPath).toLowerCase();
    if (extension !== ".svg" && !DEVTO_RASTER_CONTENT_TYPES[extension]) {
      throw new Error(
        `Unsupported DEV image type for ${localPath}: ${extension || "no extension"}.`,
      );
    }

    descriptors.push({ absolutePath, extension, localPath });
  }

  const sources = [];

  for (const descriptor of descriptors) {
    const sourceData = toBuffer(await readFile(descriptor.absolutePath));

    if (!sourceData.length) {
      throw new Error(`${descriptor.localPath} is empty.`);
    }
    if (sourceData.length > DEVTO_IMAGE_MAX_BYTES) {
      throw new Error(`${descriptor.localPath} exceeds DEV's 25 MB image limit.`);
    }

    const requiresConversion = descriptor.extension === ".svg";
    const conversionPolicy = requiresConversion
      ? DEVTO_SVG_CONVERSION_POLICY
      : undefined;
    const sourceName = basename(descriptor.localPath);
    const filename = requiresConversion
      ? `${sourceName.slice(0, -descriptor.extension.length)}.png`
      : sourceName;
    const contentType = requiresConversion
      ? "image/png"
      : DEVTO_RASTER_CONTENT_TYPES[descriptor.extension];

    if (!requiresConversion) {
      validateRasterDimensions(
        sourceData,
        descriptor.extension,
        descriptor.localPath,
      );
      validateUploadAsset(
        { data: sourceData, filename, contentType },
        descriptor.localPath,
      );
    }

    sources.push({
      localPath: descriptor.localPath,
      filename,
      contentType,
      sourceContentType: requiresConversion
        ? "image/svg+xml"
        : contentType,
      sourceData,
      sourceHash: hashSource(sourceData, conversionPolicy),
      ...(conversionPolicy ? { conversionPolicy } : {}),
      requiresConversion,
    });
  }

  return sources;
}

/**
 * Prepare uploadable assets without writing intermediate files. Callers may
 * pass the output of readDevToAssetSources to avoid rereading cached misses.
 */
export async function prepareDevToAssets(
  localPathsOrSources,
  options = {},
  dependencies = {},
) {
  const settings = { ...options, ...dependencies };
  const sources = isPreparedSourceList(localPathsOrSources)
    ? localPathsOrSources
    : await readDevToAssetSources(localPathsOrSources, options, dependencies);

  if (sources.some(({ requiresConversion }) => requiresConversion)) {
    await preflightRsvgConvert(settings);
  }

  const assets = [];

  for (const source of sources) {
    let data;

    if (source.requiresConversion) {
      data = await convertSvgToPng(
        source.sourceData,
        { ...settings, preflight: false },
      );
    } else {
      data = toBuffer(source.sourceData);
    }

    validateUploadAsset(
      { data, filename: source.filename, contentType: source.contentType },
      source.localPath,
    );
    assets.push({
      localPath: source.localPath,
      filename: source.filename,
      contentType: source.contentType,
      data,
      sourceHash: source.sourceHash,
      ...(source.conversionPolicy
        ? { conversionPolicy: source.conversionPolicy }
        : {}),
      contentHash: createHash("sha256").update(data).digest("hex"),
    });
  }

  return assets;
}

/** Create a reusable session-authenticated DEV image uploader. */
export function createDevToImageUploader(options = {}, dependencies = {}) {
  const settings = { ...options, ...dependencies };
  const sessionCookie = validateHeaderSecret(
    settings.sessionCookie,
    "sessionCookie",
  );
  const providedCsrfToken = settings.csrfToken
    ? validateHeaderSecret(settings.csrfToken, "csrfToken")
    : undefined;
  const origin = validateOrigin(settings.origin || DEFAULT_DEVTO_ORIGIN);
  const fetchImpl = settings.fetchImpl ?? settings.fetch ?? globalThis.fetch;
  const sleepImpl = settings.sleepImpl ?? settings.sleep ?? defaultSleep;
  const logger = settings.logger ?? console;
  const userAgent = settings.userAgent || DEFAULT_DEVTO_USER_AGENT;
  const maxAttempts = settings.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const formDataFactory =
    settings.formDataFactory ??
    settings.createFormData ??
    (() => new FormData());
  const blobFactory =
    settings.blobFactory ??
    settings.createBlob ??
    ((data, { type }) => new Blob([data], { type }));
  const now = settings.now ?? Date.now;
  let sessionPromise;

  if (typeof fetchImpl !== "function") {
    throw new TypeError("A fetch implementation is required.");
  }

  if (typeof sleepImpl !== "function") {
    throw new TypeError("sleep must be a function.");
  }

  if (typeof formDataFactory !== "function" || typeof blobFactory !== "function") {
    throw new TypeError("FormData and Blob factories must be functions.");
  }

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new TypeError("maxAttempts must be a positive integer.");
  }

  const resolveSession = () => {
    if (!sessionPromise) {
      sessionPromise = providedCsrfToken
        ? Promise.resolve({
            csrfToken: providedCsrfToken,
            sessionUser: settings.sessionUser,
          })
        : resolveDevToSession(
            { sessionCookie, origin, userAgent },
            { fetchImpl },
          );
    }

    return sessionPromise;
  };

  return async function uploadDevToImageAsset(asset) {
    const normalizedAsset = validateUploadAsset(asset);
    const { csrfToken, sessionUser } = await resolveSession();
    const secrets = [...sessionSecrets(sessionCookie), csrfToken];

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      let formData;

      try {
        formData = formDataFactory();
        const blob = blobFactory(normalizedAsset.data, {
          type: normalizedAsset.contentType,
        });
        formData.append("authenticity_token", csrfToken);
        formData.append("image[]", blob, normalizedAsset.filename);
      } catch (error) {
        throw redactedError(
          `Could not build the DEV image upload: ${error?.message || error}`,
          secrets,
        );
      }

      let response;

      try {
        response = await fetchImpl(`${origin}${DEVTO_IMAGE_UPLOAD_PATH}`, {
          method: "POST",
          redirect: "manual",
          headers: {
            Accept: "application/json",
            Cookie: sessionCookie,
            "User-Agent": userAgent,
            "X-CSRF-Token": csrfToken,
          },
          body: formData,
        });
      } catch (error) {
        throw redactedError(
          `DEV image upload failed: ${error?.message || error}`,
          secrets,
        );
      }

      const status = responseStatus(response);
      assertSameOriginResponse(response, origin, "DEV image upload");
      const payload = await readJsonResponse(response, secrets);

      if (isRedirectResponse(response, status) || status === 401 || status === 403) {
        throw new Error(
          "DEV rejected the image-upload session; refresh the session cookie and CSRF token.",
        );
      }

      if (responseIsOk(response, status)) {
        const links = payload?.links;

        if (!Array.isArray(links) || links.length !== 1) {
          throw new Error(
            "DEV image upload returned an unexpected response; expected exactly one link.",
          );
        }

        return {
          url: validateUploadedUrl(links[0], origin),
          response: payload,
          ...(sessionUser ? { sessionUser } : {}),
        };
      }

      const message = redactSecrets(responseMessage(payload), secrets);
      const retryAfterMs =
        status === 429 ? retryAfterDelay(response, currentTime(now)) : undefined;

      if (
        status === 429 &&
        retryAfterMs !== undefined &&
        attempt < maxAttempts
      ) {
        log(
          logger,
          "warn",
          `DEV image upload 429: ${message}. Retrying in ${retryAfterMs}ms...`,
        );
        await sleepImpl(retryAfterMs);
        continue;
      }

      throw new Error(`DEV image upload ${status}: ${message}`);
    }

    throw new Error("DEV image upload exhausted its retry attempts.");
  };
}

/** Convenience wrapper when only one image is uploaded. */
export async function uploadDevToImage(
  asset,
  options = {},
  dependencies = {},
) {
  return createDevToImageUploader(options, dependencies)(asset);
}

function processRunner(settings) {
  const runner = settings.runnerImpl ?? settings.runner;

  if (runner !== undefined) {
    if (typeof runner !== "function") {
      throw new TypeError("runner must be a function.");
    }

    return runner;
  }

  return (command, args, options) =>
    runSpawn(command, args, {
      ...options,
      env: sanitizedConverterEnvironment(settings.processEnv ?? process.env),
      maxStderrBytes: settings.maxProcessStderrBytes,
      maxStdoutBytes: settings.maxProcessOutputBytes,
      spawnImpl: settings.spawnImpl ?? settings.spawn,
      timeoutMs: settings.processTimeoutMs,
    });
}

function sanitizedConverterEnvironment(environment) {
  const sanitized = { ...environment };
  for (const name of PUBLISHING_SECRET_ENV_NAMES) delete sanitized[name];
  return sanitized;
}

function validateGeneratedPng(data) {
  if (
    data.length < 33 ||
    !data.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE) ||
    data.readUInt32BE(8) !== 13 ||
    data.subarray(12, 16).toString("ascii") !== "IHDR"
  ) {
    throw new Error("SVG conversion did not produce a valid PNG image.");
  }

  validateImageDimensions(
    data.readUInt32BE(16),
    data.readUInt32BE(20),
    "Converted PNG",
  );

  if (data.length > DEVTO_IMAGE_MAX_BYTES) {
    throw new Error("Converted PNG exceeds DEV's 25 MB image limit.");
  }
}

function validateRasterDimensions(data, extension, label) {
  let dimensions;

  if (extension === ".png") {
    if (
      data.length < 24 ||
      !data.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE) ||
      data.readUInt32BE(8) !== 13 ||
      data.subarray(12, 16).toString("ascii") !== "IHDR"
    ) {
      throw new Error(`${label} is not a valid PNG image.`);
    }
    dimensions = [data.readUInt32BE(16), data.readUInt32BE(20)];
  } else if (extension === ".gif") {
    const signature = data.subarray(0, 6).toString("ascii");
    if (data.length < 10 || !["GIF87a", "GIF89a"].includes(signature)) {
      throw new Error(`${label} is not a valid GIF image.`);
    }
    dimensions = [data.readUInt16LE(6), data.readUInt16LE(8)];
    validateImageFrameCount(gifFrameCount(data), label);
  } else if ([".jpg", ".jpeg", ".jpe"].includes(extension)) {
    dimensions = jpegDimensions(data);
    if (!dimensions) throw new Error(`${label} is not a valid JPEG image.`);
  } else if (extension === ".webp") {
    dimensions = webpDimensions(data);
    if (!dimensions) throw new Error(`${label} is not a supported WebP image.`);
    validateImageFrameCount(webpFrameCount(data), label);
  } else if (extension === ".bmp") {
    if (data.length < 26 || data.subarray(0, 2).toString("ascii") !== "BM") {
      throw new Error(`${label} is not a valid BMP image.`);
    }
    dimensions = [Math.abs(data.readInt32LE(18)), Math.abs(data.readInt32LE(22))];
  } else if (extension === ".ico") {
    if (
      data.length < 8 ||
      data.readUInt16LE(0) !== 0 ||
      data.readUInt16LE(2) !== 1 ||
      data.readUInt16LE(4) < 1
    ) {
      throw new Error(`${label} is not a valid ICO image.`);
    }
    dimensions = [data[6] || 256, data[7] || 256];
  }

  if (dimensions) validateImageDimensions(...dimensions, label);
}

function validateImageFrameCount(frames, label) {
  if (frames > DEVTO_IMAGE_MAX_FRAMES) {
    throw new Error(
      `${label} contains ${frames} frames; DEV accepts at most ` +
        `${DEVTO_IMAGE_MAX_FRAMES}.`,
    );
  }
}

function skipGifSubBlocks(data, index) {
  while (index < data.length) {
    const size = data[index];
    index += 1;
    if (size === 0) return index;
    if (index + size > data.length) return -1;
    index += size;
  }
  return -1;
}

function gifFrameCount(data) {
  const globalColorTable = Boolean(data[10] & 0x80);
  const globalColorTableBytes = globalColorTable
    ? 3 * 2 ** ((data[10] & 0x07) + 1)
    : 0;
  let index = 13 + globalColorTableBytes;
  let frames = 0;

  while (index < data.length) {
    const marker = data[index];
    index += 1;
    if (marker === 0x3b) return frames;
    if (marker === 0x21) {
      if (index >= data.length) break;
      index += 1;
      index = skipGifSubBlocks(data, index);
      if (index === -1) break;
      continue;
    }
    if (marker !== 0x2c || index + 9 > data.length) break;

    frames += 1;
    const packed = data[index + 8];
    index += 9;
    if (packed & 0x80) {
      index += 3 * 2 ** ((packed & 0x07) + 1);
    }
    if (index >= data.length) break;
    index += 1;
    index = skipGifSubBlocks(data, index);
    if (index === -1) break;
  }

  throw new Error("GIF image data is truncated or invalid.");
}

function webpFrameCount(data) {
  let index = 12;
  let frames = 0;
  while (index + 8 <= data.length) {
    const type = data.subarray(index, index + 4).toString("ascii");
    const size = data.readUInt32LE(index + 4);
    if (type === "ANMF") frames += 1;
    index += 8 + size + (size % 2);
    if (index > data.length) break;
  }
  return frames || 1;
}

function validateImageDimensions(width, height, label) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > DEVTO_IMAGE_MAX_DIMENSION ||
    height > DEVTO_IMAGE_MAX_DIMENSION
  ) {
    throw new Error(
      `${label} dimensions ${width}x${height} exceed DEV's ` +
        `${DEVTO_IMAGE_MAX_DIMENSION}x${DEVTO_IMAGE_MAX_DIMENSION} limit.`,
    );
  }
}

function jpegDimensions(data) {
  if (data.length < 4 || data.readUInt16BE(0) !== 0xffd8) return undefined;
  const startOfFrame = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ]);
  let index = 2;

  while (index + 3 < data.length) {
    if (data[index] !== 0xff) {
      index += 1;
      continue;
    }
    while (data[index] === 0xff) index += 1;
    const marker = data[index];
    index += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (index + 2 > data.length) return undefined;
    const length = data.readUInt16BE(index);
    if (length < 2 || index + length > data.length) return undefined;
    if (startOfFrame.has(marker) && length >= 7) {
      return [data.readUInt16BE(index + 5), data.readUInt16BE(index + 3)];
    }
    index += length;
  }
  return undefined;
}

function webpDimensions(data) {
  if (
    data.length < 30 ||
    data.subarray(0, 4).toString("ascii") !== "RIFF" ||
    data.subarray(8, 12).toString("ascii") !== "WEBP"
  ) {
    return undefined;
  }

  const chunk = data.subarray(12, 16).toString("ascii");
  if (chunk === "VP8X") {
    return [1 + data.readUIntLE(24, 3), 1 + data.readUIntLE(27, 3)];
  }
  if (
    chunk === "VP8 " &&
    data.length >= 30 &&
    data[23] === 0x9d &&
    data[24] === 0x01 &&
    data[25] === 0x2a
  ) {
    return [data.readUInt16LE(26) & 0x3fff, data.readUInt16LE(28) & 0x3fff];
  }
  if (chunk === "VP8L" && data.length >= 25 && data[20] === 0x2f) {
    const bits = data.readUInt32LE(21);
    return [1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff)];
  }
  return undefined;
}

function normalizeProcessResult(result) {
  if (!result || typeof result !== "object") {
    throw new TypeError("The process runner returned an invalid result.");
  }

  return {
    exitCode:
      result.exitCode !== undefined
        ? result.exitCode
        : (result.code ?? 0),
    signal: result.signal,
    stdout: toBuffer(result.stdout ?? Buffer.alloc(0)),
    stderr: toBuffer(result.stderr ?? Buffer.alloc(0)),
  };
}

function processErrorDetail(result) {
  const stderr = result.stderr.toString("utf8").trim();
  const signal = result.signal ? ` (signal ${result.signal})` : "";
  const message = stderr ? `: ${stderr}` : ` with exit code ${result.exitCode}${signal}`;
  return message;
}

function missingRsvgConvertError(command) {
  return new Error(
    `${command} was not found. Install librsvg so rsvg-convert is available on PATH.`,
  );
}

function parseHtmlAttributes(tag) {
  const attributes = {};
  const pattern = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;

  for (const match of tag.matchAll(pattern)) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }

  return attributes;
}

function decodeHtmlEntities(value) {
  return value.replace(
    /&(?:amp|quot|apos|lt|gt|#39|#x([0-9a-f]+)|#(\d+));/gi,
    (entity, hexadecimal, decimal) => {
      const named = {
        "&amp;": "&",
        "&apos;": "'",
        "&gt;": ">",
        "&lt;": "<",
        "&quot;": '"',
        "&#39;": "'",
      };
      const lower = entity.toLowerCase();
      if (named[lower]) return named[lower];
      const codePoint = Number.parseInt(hexadecimal ?? decimal, hexadecimal ? 16 : 10);
      return Number.isNaN(codePoint) ? entity : String.fromCodePoint(codePoint);
    },
  );
}

function parseSessionUser(value) {
  if (!value) return undefined;

  let user = value;
  if (typeof value === "string") {
    try {
      user = JSON.parse(value);
    } catch {
      throw new Error("DEV session data contained invalid signed-in user JSON.");
    }
  }

  if (!user || Array.isArray(user) || typeof user !== "object") {
    throw new Error("DEV session data contained an invalid signed-in user.");
  }

  if (user.id === undefined && !user.username) {
    throw new Error(
      "DEV session data did not identify the signed-in user by id or username.",
    );
  }

  return user;
}

function validateHeaderSecret(value, name) {
  if (!value || typeof value !== "string") {
    throw new Error(`${name} is required.`);
  }

  if (/[\r\n]/.test(value)) {
    throw new Error(`${name} contains invalid header characters.`);
  }

  return value;
}

function validateOrigin(value) {
  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error("DEV origin must be an absolute HTTPS origin.");
  }

  if (
    parsed.protocol !== "https:" ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("DEV origin must be an absolute HTTPS origin.");
  }

  return parsed.origin;
}

function sessionSecrets(sessionCookie) {
  const secrets = [sessionCookie];

  for (const part of sessionCookie.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const value = part.slice(separator + 1).trim();
    if (value) secrets.push(value);
  }

  return [...new Set(secrets)];
}

function hashSource(sourceData, conversionPolicy) {
  const hash = createHash("sha256");
  if (conversionPolicy) hash.update(`${conversionPolicy}\0`);
  return hash.update(sourceData).digest("hex");
}

function isPreparedSourceList(value) {
  if (!Array.isArray(value)) {
    throw new TypeError("localPaths or prepared sources must be an array.");
  }

  return value.length > 0 && value.every(
    (source) =>
      source &&
      typeof source === "object" &&
      typeof source.localPath === "string" &&
      source.sourceData !== undefined &&
      typeof source.sourceHash === "string",
  );
}

function validateUploadAsset(asset, label = "image") {
  if (!asset || typeof asset !== "object") {
    throw new TypeError("An image asset is required.");
  }

  const data = toBuffer(asset.data);
  const filename = asset.filename;
  const contentType = asset.contentType;

  if (!data.length) {
    throw new Error(`${label} is empty.`);
  }

  if (data.length > DEVTO_IMAGE_MAX_BYTES) {
    throw new Error(`${label} exceeds DEV's 25 MB image limit.`);
  }

  if (!filename || typeof filename !== "string") {
    throw new Error(`${label} needs a filename.`);
  }

  if (filename.length > DEVTO_IMAGE_MAX_FILENAME_LENGTH) {
    throw new Error(`${label} has a filename longer than 250 characters.`);
  }

  if (basename(filename) !== filename || /[\0\r\n]/.test(filename)) {
    throw new Error(`${label} has an invalid filename.`);
  }

  if (contentType === "image/svg+xml" || extname(filename).toLowerCase() === ".svg") {
    throw new Error(`${label} is SVG; convert it to PNG before uploading to DEV.`);
  }

  if (!Object.values(DEVTO_RASTER_CONTENT_TYPES).includes(contentType)) {
    throw new Error(`${label} has unsupported content type ${contentType || "(missing)"}.`);
  }

  return { ...asset, data, filename, contentType };
}

async function readJsonResponse(response, secrets) {
  let text;

  try {
    text = typeof response?.text === "function" ? await response.text() : "";
  } catch (error) {
    throw redactedError(
      `Could not read the DEV image-upload response: ${error?.message || error}`,
      secrets,
    );
  }

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text.trim();
  }
}

function responseMessage(payload) {
  if (payload === null || payload === undefined || payload === "") {
    return "Empty response";
  }

  if (typeof payload === "string") return payload;
  if (payload.error) return String(payload.error);
  if (payload.message) {
    return Array.isArray(payload.message)
      ? payload.message.join(", ")
      : String(payload.message);
  }
  return JSON.stringify(payload);
}

function responseStatus(response) {
  return Number(response?.status ?? 0);
}

function responseIsOk(response, status) {
  return typeof response?.ok === "boolean"
    ? response.ok
    : status >= 200 && status < 300;
}

function isRedirectResponse(response, status) {
  return Boolean(response?.redirected) || (status >= 300 && status < 400);
}

function assertSameOriginResponse(response, origin, label) {
  if (!response?.url) return;

  let responseUrl;
  try {
    responseUrl = new URL(response.url);
  } catch {
    throw new Error(`${label} returned an invalid response URL.`);
  }

  if (responseUrl.origin !== origin) {
    throw new Error(`${label} crossed origins and was rejected.`);
  }
}

function retryAfterDelay(response, now) {
  const value = response?.headers?.get?.("retry-after");
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;

  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - now);
}

function currentTime(now) {
  return typeof now === "function" ? now() : Number(now);
}

function validateUploadedUrl(value, origin) {
  let url;

  try {
    url = new URL(value, origin);
  } catch {
    throw new Error("DEV image upload returned an invalid image URL.");
  }

  if (url.protocol !== "https:" || !url.hostname) {
    throw new Error("DEV image upload returned an invalid image URL.");
  }

  return url.href;
}

function redactedError(message, secrets) {
  return new Error(redactSecrets(message, secrets));
}

function log(logger, level, message) {
  if (!logger) return;
  const method = logger[level] ?? logger.log;
  method?.call(logger, message);
}

function toBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  if (ArrayBuffer.isView(value)) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  }
  if (typeof value === "string") return Buffer.from(value);
  throw new TypeError("Image/process data must be a Buffer or Uint8Array.");
}

function defaultSleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}
