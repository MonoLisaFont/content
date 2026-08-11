import { randomUUID } from "node:crypto";
import {
  open as nodeOpen,
  readFile as nodeReadFile,
  rename as nodeRename,
  unlink as nodeUnlink,
  writeFile as nodeWriteFile,
} from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";

export const DEVTO_API_BASE_URL = "https://dev.to/api";
export const DEVTO_V1_ACCEPT = "application/vnd.forem.api-v1+json";
export const DEFAULT_DEVTO_USER_AGENT = "@monolisa/content dev.to publisher";

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_RETRY_DELAY_MS = 1_000;
const DEFAULT_MAX_RETRY_DELAY_MS = 30_000;
const DEVTO_MAX_TAGS = 4;
const DEVTO_MAX_TAG_LENGTH = 30;

/**
 * Parse the small YAML subset used by the posts in this repository.
 *
 * In addition to scalar values, this supports comma-separated arrays on one
 * line, bracketed arrays spread over multiple lines, and YAML-style dash
 * arrays. It deliberately does not pretend to be a complete YAML parser.
 */
export function parseFrontmatter(raw) {
  const data = {};
  const lines = String(raw).split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);

    if (!match) {
      continue;
    }

    const [, key, initialValue] = match;
    let value = initialValue.trim();

    if (value.startsWith("[") && !hasClosingArrayBracket(value)) {
      while (index + 1 < lines.length) {
        index += 1;
        value += `\n${lines[index].trim()}`;

        if (hasClosingArrayBracket(value)) {
          break;
        }
      }
    } else if (!value && lines[index + 1]?.trim().startsWith("[")) {
      index += 1;
      value = lines[index].trim();

      while (!hasClosingArrayBracket(value) && index + 1 < lines.length) {
        index += 1;
        value += `\n${lines[index].trim()}`;
      }
    } else if (!value && /^\s*-\s+/.test(lines[index + 1] || "")) {
      const values = [];

      while (/^\s*-\s+/.test(lines[index + 1] || "")) {
        index += 1;
        values.push(parseFrontmatterScalar(lines[index].replace(/^\s*-\s+/, "")));
      }

      data[key] = values;
      continue;
    }

    data[key] = value.startsWith("[")
      ? parseFrontmatterArray(value)
      : parseFrontmatterScalar(value);
  }

  return data;
}

/** Parse a Markdown post without performing any filesystem or process work. */
export function parseMarkdownPost(markdown, options = {}) {
  const settings = typeof options === "string" ? { path: options } : options;
  const path = settings.path || "<markdown>";
  const lines = String(markdown).replace(/^\uFEFF/, "").split(/\r?\n/);

  if (lines[0]?.trim() !== "---") {
    throw new Error(`Missing front matter in ${path}.`);
  }

  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === "---",
  );

  if (closingIndex === -1) {
    throw new Error(`Unclosed front matter in ${path}.`);
  }

  const frontmatter = parseFrontmatter(lines.slice(1, closingIndex).join("\n"));
  const title = typeof frontmatter.title === "string" ? frontmatter.title.trim() : "";

  if (!title) {
    throw new Error(`Missing title in ${path}.`);
  }

  const body = lines.slice(closingIndex + 1).join("\n").trim();
  const slug = settings.slug || slugFromPath(settings.path);
  const keywords = normalizeStringArray(frontmatter.keywords);

  return {
    ...(slug ? { slug } : {}),
    ...(settings.path ? { path: settings.path } : {}),
    frontmatter,
    title,
    keywords,
    body,
  };
}

// A concise alias is useful to callers migrating from the older one-off script.
export const parseMarkdown = parseMarkdownPost;

/** Extract the first prose paragraph and turn it into a DEV description. */
export function descriptionFromBody(body, options = {}) {
  const maxLength =
    typeof options === "number" ? options : (options.maxLength ?? 200);

  if (!Number.isInteger(maxLength) || maxLength < 0) {
    throw new TypeError("maxLength must be a non-negative integer.");
  }

  const blocks = String(body).split(/\n\s*\n/);

  for (const block of blocks) {
    const trimmed = block.trim();

    if (
      !trimmed ||
      /^(?:#{1,6}\s|```|~~~|!\[|<(?:figure|img|picture)\b)/i.test(trimmed)
    ) {
      continue;
    }

    const description = trimmed
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/<[^>]+>/g, " ")
      .replace(/[`*_>#~]/g, "")
      .replace(/^\s*[-+]\s+/gm, "")
      .replace(/\s+/g, " ")
      .trim();

    if (description) {
      return description.slice(0, maxLength);
    }
  }

  return "";
}

/**
 * Convert human-facing post keywords into DEV-compatible tags.
 *
 * DEV accepts at most four tags, each no longer than 30 characters. Its tag
 * input is intentionally much narrower than this repository's keyword field,
 * so spaces, punctuation, and diacritics are removed deterministically.
 */
export function normalizeDevToTags(tags) {
  const normalized = [];

  for (const value of normalizeStringArray(tags)) {
    const tag = value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, DEVTO_MAX_TAG_LENGTH);

    if (tag && !normalized.includes(tag)) {
      normalized.push(tag);
    }

    if (normalized.length === DEVTO_MAX_TAGS) {
      break;
    }
  }

  return normalized;
}

/** Build the v1 DEV article envelope accepted by POST and PUT /articles. */
export function buildDevToPayload(post, options = {}) {
  if (!post || typeof post !== "object") {
    throw new TypeError("post is required.");
  }

  const title = String(post.title ?? post.frontmatter?.title ?? "").trim();
  const bodyMarkdown = post.bodyMarkdown ?? post.body;
  const canonicalUrl = validateCanonicalUrl(
    options.canonicalUrl ?? options.canonical_url ?? post.canonicalUrl,
  );

  if (!title) {
    throw new Error("The DEV article needs a title.");
  }

  if (typeof bodyMarkdown !== "string") {
    throw new Error("The DEV article needs a Markdown body.");
  }

  const tags = normalizeDevToTags(options.tags ?? post.keywords);
  const article = {
    title,
    body_markdown: bodyMarkdown,
    published: Boolean(options.published),
    canonical_url: canonicalUrl,
    description:
      options.description ?? descriptionFromBody(post.body ?? bodyMarkdown),
    tags,
  };

  if (typeof options.series === "string" && options.series.trim()) {
    article.series = options.series.trim();
  }

  return { article };
}

/**
 * Create an authenticated DEV request function with retry/backoff behavior.
 * No request is made until the returned function is called.
 */
export function createDevToRequest(options = {}) {
  const apiKey = options.apiKey;
  const fetchImpl = options.fetchImpl ?? options.fetch ?? globalThis.fetch;
  const sleepImpl = options.sleepImpl ?? options.sleep ?? defaultSleep;
  const logger = options.logger ?? console;
  const apiBaseUrl = stripTrailingSlash(
    options.apiBaseUrl || DEVTO_API_BASE_URL,
  );
  let apiOrigin;
  try {
    const parsedApiBase = new URL(apiBaseUrl);
    if (
      parsedApiBase.protocol !== "https:" ||
      !parsedApiBase.hostname ||
      parsedApiBase.username ||
      parsedApiBase.password
    ) {
      throw new Error();
    }
    apiOrigin = parsedApiBase.origin;
  } catch {
    throw new Error("DEV API base URL must be an absolute HTTPS URL.");
  }
  const userAgent = options.userAgent || DEFAULT_DEVTO_USER_AGENT;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const maxRetryDelayMs =
    options.maxRetryDelayMs ?? DEFAULT_MAX_RETRY_DELAY_MS;

  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("DEVTO_API_KEY is required to call the DEV API.");
  }

  if (typeof fetchImpl !== "function") {
    throw new TypeError("A fetch implementation is required.");
  }

  if (typeof sleepImpl !== "function") {
    throw new TypeError("sleep must be a function.");
  }

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new TypeError("maxAttempts must be a positive integer.");
  }

  if (retryDelayMs < 0 || maxRetryDelayMs < 0) {
    throw new TypeError("Retry delays must be non-negative.");
  }

  return async function request(path, init = {}) {
    const url = `${apiBaseUrl}/${String(path).replace(/^\/+/, "")}`;
    const requestBody = normalizeRequestBody(init.body);
    const headers = mergeRequestHeaders(init.headers, {
      apiKey,
      userAgent,
      hasBody: requestBody !== undefined,
    });
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      let response;
      let payload;

      try {
        response = await fetchImpl(url, {
          ...init,
          ...(requestBody === undefined ? {} : { body: requestBody }),
          redirect: "manual",
          headers,
        });
        if (response?.url) {
          const responseOrigin = new URL(response.url).origin;
          if (responseOrigin !== apiOrigin) {
            throw new Error("DEV API response crossed origins and was rejected.");
          }
        }
        payload = await readResponsePayload(response);
      } catch (error) {
        const safeError = redactError(error, [apiKey]);
        lastError = safeError;

        if (attempt >= maxAttempts || !isRetryableError(error)) {
          throw safeError;
        }

        const waitMs = exponentialDelay(
          attempt,
          retryDelayMs,
          maxRetryDelayMs,
        );
        log(logger, "warn", `${safeError.message}. Retrying in ${waitMs}ms...`);
        await sleepImpl(waitMs);
        continue;
      }

      const status = Number(response?.status ?? 0);
      const ok =
        typeof response?.ok === "boolean"
          ? response.ok
          : status >= 200 && status < 300;

      if (ok) {
        return payload;
      }

      const message = redactSecrets(responseMessage(payload), [apiKey]);
      const error = new Error(`DEV API ${status}: ${message}`);
      lastError = error;

      if (attempt >= maxAttempts || !isRetryableResponse(status, message)) {
        throw error;
      }

      const waitMs = retryAfterDelay(response, Date.now()) ??
        exponentialDelay(attempt, retryDelayMs, maxRetryDelayMs);
      log(
        logger,
        "warn",
        `DEV API ${status}: ${message}. Retrying in ${waitMs}ms...`,
      );
      await sleepImpl(waitMs);
    }

    throw lastError;
  };
}

/** Convenience wrapper for callers that do not need to retain a client. */
export async function devToRequest(path, init, options) {
  return createDevToRequest(options)(path, init);
}

export async function readDevToState(path, options = {}) {
  const readFile = options.readFileImpl ?? options.readFile ?? nodeReadFile;

  try {
    const state = JSON.parse(await readFile(path, "utf8"));

    if (!state || Array.isArray(state) || typeof state !== "object") {
      throw new Error(`DEV state in ${path} must be a JSON object.`);
    }

    return state;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

export async function writeDevToState(path, state, options = {}) {
  const customWriteFile = options.writeFileImpl ?? options.writeFile;
  const customRename = options.renameImpl ?? options.rename;
  const writeFile = customWriteFile ?? nodeWriteFile;
  const serialized = `${JSON.stringify(state, null, 2)}\n`;

  // Preserve the lightweight in-memory seam used by callers that inject only
  // writeFile. Normal filesystem writes always use a same-directory temp file.
  if (customWriteFile && !customRename) {
    await writeFile(path, serialized, "utf8");
    return;
  }

  const rename = customRename ?? nodeRename;
  const unlink = options.unlinkImpl ?? options.unlink ?? nodeUnlink;
  const suffix = options.randomSuffix?.() ?? randomUUID();
  const temporaryName = `.${basename(path).replace(/^\./, "")}`;
  const temporaryPath = join(
    dirname(path),
    `${temporaryName}.${process.pid}.${suffix}.tmp`,
  );

  try {
    await writeFile(temporaryPath, serialized, {
      encoding: "utf8",
      flag: "wx",
    });
    await rename(temporaryPath, path);
  } catch (error) {
    try {
      await unlink(temporaryPath);
    } catch {
      // Preserve the write/rename failure; a leftover temp file is harmless.
    }
    throw error;
  }
}

export async function withDevToStateLock(statePath, callback, options = {}) {
  const open = options.openImpl ?? options.open ?? nodeOpen;
  const unlink = options.unlinkImpl ?? options.unlink ?? nodeUnlink;
  const lockPath = `${statePath}.lock`;
  let handle;

  try {
    handle = await open(lockPath, "wx");
  } catch (error) {
    if (error?.code === "EEXIST") {
      throw new Error(
        `Another DEV publication is using ${lockPath}. ` +
          "If no publisher is running, remove the stale lock and retry.",
      );
    }
    throw error;
  }

  try {
    await handle.writeFile(
      `${JSON.stringify({ pid: process.pid, started: new Date().toISOString() })}\n`,
      "utf8",
    );
    return await callback();
  } finally {
    try {
      await handle.close();
    } finally {
      try {
        await unlink(lockPath);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }
  }
}

/**
 * Publish one local post idempotently.
 *
 * Discovery by canonical URL happens before creation, so a lost or deleted
 * local state file cannot cause a duplicate article. A newly-created draft is
 * checkpointed before the subsequent publish request.
 */
export async function publishDevToArticle(options = {}, dependencies = {}) {
  const settings = { ...options, ...dependencies };
  const post = settings.post;
  const localSlug = settings.localSlug ?? settings.slug ?? post?.slug;
  const canonicalUrl = validateCanonicalUrl(
    settings.canonicalUrl ?? settings.canonical_url,
  );
  const statePath = settings.statePath;
  const logger = settings.logger ?? console;
  const readFile =
    settings.readFileImpl ?? settings.readFile ?? nodeReadFile;
  const writeState =
    settings.writeStateImpl ??
    ((path, state) =>
      writeDevToState(path, state, {
        writeFileImpl: settings.writeFileImpl ?? settings.writeFile,
        renameImpl: settings.renameImpl ?? settings.rename,
        unlinkImpl: settings.unlinkImpl ?? settings.unlink,
        randomSuffix: settings.randomSuffix,
      }));

  if (!post || typeof post !== "object") {
    throw new TypeError("post is required.");
  }

  if (!localSlug || typeof localSlug !== "string") {
    throw new Error("A local post slug is required.");
  }

  if (!statePath || typeof statePath !== "string") {
    throw new Error("statePath is required.");
  }

  const injectedOperation =
    settings.request ||
    settings.fetchImpl ||
    settings.fetch ||
    settings.readFileImpl ||
    settings.readFile ||
    settings.writeFileImpl ||
    settings.writeFile ||
    settings.writeStateImpl;
  const shouldLock =
    settings.lock === true || (settings.lock !== false && !injectedOperation);
  if (shouldLock) {
    const withLock = settings.withLockImpl ?? withDevToStateLock;
    return withLock(
      statePath,
      () =>
        publishDevToArticle(
          { ...options, lock: false },
          { ...dependencies, lock: false },
        ),
      settings,
    );
  }

  const request = settings.request ?? createDevToRequest(settings);
  // A timed-out POST may still have created the draft. Do not retry it in the
  // same run: the next invocation discovers the canonical URL before creating.
  const createRequest =
    settings.request ?? createDevToRequest({ ...settings, maxAttempts: 1 });
  const state = await readDevToState(statePath, { readFile });
  const nextState = { ...state };
  const payloadOptions = {
    canonicalUrl,
    tags: settings.tags ?? post.keywords,
    ...(settings.series === undefined ? {} : { series: settings.series }),
    ...(settings.description === undefined
      ? {}
      : { description: settings.description }),
  };
  const savedStateEntry = nextState[localSlug]?.id
    ? nextState[localSlug]
    : undefined;
  if (
    savedStateEntry &&
    !canonicalUrlsMatch(savedStateEntry.canonical_url, canonicalUrl)
  ) {
    throw new Error(
      `DEV state for ${localSlug} points to a different canonical URL. ` +
        "Inspect or remove that state entry before publishing.",
    );
  }
  const savedArticle = savedStateEntry;
  let discoveredArticle;

  if (!savedArticle) {
    const discoveredPayload = await request(
      "/articles/me/all?per_page=1000",
      { method: "GET" },
    );
    const articles = Array.isArray(discoveredPayload)
      ? discoveredPayload
      : discoveredPayload?.articles;

    if (!Array.isArray(articles)) {
      throw new Error("DEV article discovery returned an unexpected response.");
    }

    const matches = articles.filter(
      (article) =>
        canonicalUrlsMatch(article?.canonical_url, canonicalUrl) && article?.id,
    );
    if (matches.length > 1) {
      throw new Error(
        `Multiple DEV articles use canonical URL ${canonicalUrl}; ` +
          "resolve the duplicates before publishing.",
      );
    }
    [discoveredArticle] = matches;
  }

  let draftArticle = discoveredArticle ?? savedArticle;
  let source = discoveredArticle ? "discovered" : savedArticle ? "state" : "created";

  if (!draftArticle) {
    draftArticle = await createRequest("/articles", {
      method: "POST",
      body: JSON.stringify(
        buildDevToPayload(post, { ...payloadOptions, published: false }),
      ),
    });

    assertArticleId(draftArticle, "create");
    nextState[localSlug] = articleStateEntry(
      draftArticle,
      canonicalUrl,
      false,
      nextState[localSlug],
    );
    await writeState(statePath, nextState);
    log(logger, "log", `Created DEV draft for ${localSlug}: ${draftArticle.id}`);
  } else if (discoveredArticle) {
    nextState[localSlug] = articleStateEntry(
      discoveredArticle,
      canonicalUrl,
      Boolean(discoveredArticle.published),
      nextState[localSlug],
    );
    await writeState(statePath, nextState);
    log(
      logger,
      "log",
      `Found existing DEV article for ${localSlug}: ${discoveredArticle.id}`,
    );
  }

  assertArticleId(draftArticle, "publish");
  const article = await request(`/articles/${draftArticle.id}`, {
    method: "PUT",
    body: JSON.stringify(
      buildDevToPayload(post, { ...payloadOptions, published: true }),
    ),
  });

  assertArticleId(article, "publish response");
  nextState[localSlug] = articleStateEntry(
    article,
    canonicalUrl,
    true,
    nextState[localSlug],
  );
  await writeState(statePath, nextState);
  log(logger, "log", `Published ${localSlug} to DEV: ${article.url || article.id}`);

  return {
    article,
    state: nextState,
    created: source === "created",
    source,
  };
}

function parseFrontmatterArray(value) {
  const trimmed = value.trim();

  if (!trimmed.endsWith("]")) {
    throw new Error("Unclosed front matter array.");
  }

  const source = trimmed.slice(1, -1);
  const values = [];
  let token = "";
  let quote = "";
  let escaped = false;

  for (const character of source) {
    if (escaped) {
      token += character;
      escaped = false;
      continue;
    }

    if (character === "\\" && quote) {
      token += character;
      escaped = true;
      continue;
    }

    if (quote) {
      token += character;

      if (character === quote) {
        quote = "";
      }

      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      token += character;
      continue;
    }

    if (character === ",") {
      if (token.trim()) {
        values.push(parseFrontmatterScalar(token));
      }

      token = "";
      continue;
    }

    token += character;
  }

  if (quote) {
    throw new Error("Unclosed quote in front matter array.");
  }

  if (token.trim()) {
    values.push(parseFrontmatterScalar(token));
  }

  return values;
}

function parseFrontmatterScalar(value) {
  const trimmed = String(value).trim();

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }

  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  if (trimmed === "null") {
    return null;
  }

  return trimmed;
}

function hasClosingArrayBracket(value) {
  let quote = "";
  let escaped = false;

  for (const character of value) {
    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === "\\" && quote) {
      escaped = true;
      continue;
    }

    if (quote) {
      if (character === quote) {
        quote = "";
      }

      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === "]") {
      return true;
    }
  }

  return false;
}

function slugFromPath(path) {
  if (!path) {
    return undefined;
  }

  const filename = basename(path);
  return filename.slice(0, filename.length - extname(filename).length);
}

function normalizeStringArray(value) {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];
  return values
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function normalizeRequestBody(body) {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (
    typeof body === "string" ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body) ||
    (typeof Blob !== "undefined" && body instanceof Blob) ||
    (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams)
  ) {
    return body;
  }

  return JSON.stringify(body);
}

function mergeRequestHeaders(customHeaders, { apiKey, userAgent, hasBody }) {
  const headers = {};

  if (customHeaders && typeof customHeaders.forEach === "function") {
    customHeaders.forEach((value, key) => setHeader(headers, key, value));
  } else if (Array.isArray(customHeaders)) {
    for (const [key, value] of customHeaders) {
      setHeader(headers, key, value);
    }
  } else {
    for (const [key, value] of Object.entries(customHeaders || {})) {
      setHeader(headers, key, value);
    }
  }

  setHeader(headers, "Accept", DEVTO_V1_ACCEPT);
  setHeader(headers, "User-Agent", userAgent);

  if (hasBody) {
    setHeader(headers, "Content-Type", "application/json");
  }

  setHeader(headers, "api-key", apiKey);
  return headers;
}

function setHeader(headers, name, value) {
  const existingName = Object.keys(headers).find(
    (key) => key.toLowerCase() === name.toLowerCase(),
  );

  if (existingName) {
    delete headers[existingName];
  }

  headers[name] = value;
}

async function readResponsePayload(response) {
  if (typeof response?.text === "function") {
    const text = await response.text();

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text.trim();
    }
  }

  if (typeof response?.json === "function") {
    return response.json();
  }

  return null;
}

function responseMessage(payload) {
  if (payload === null || payload === undefined || payload === "") {
    return "Empty response";
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (payload.error) {
    return String(payload.error);
  }

  if (payload.message) {
    return Array.isArray(payload.message)
      ? payload.message.join(", ")
      : String(payload.message);
  }

  return JSON.stringify(payload);
}

function isRetryableResponse(status, message) {
  return (
    status === 408 ||
    status === 409 ||
    status === 425 ||
    status === 429 ||
    status >= 500 ||
    /retry later/i.test(message)
  );
}

function isRetryableError(error) {
  return (
    error?.name === "TypeError" ||
    error?.name === "AbortError" ||
    ["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EAI_AGAIN"].includes(
      error?.code,
    ) ||
    /fetch failed|network|timeout|timed out|retry later/i.test(
      error?.message || "",
    )
  );
}

function exponentialDelay(attempt, initialDelayMs, maximumDelayMs) {
  return Math.min(maximumDelayMs, initialDelayMs * 2 ** (attempt - 1));
}

function retryAfterDelay(response, now) {
  const value = response?.headers?.get?.("retry-after");

  if (!value) {
    return undefined;
  }

  const seconds = Number(value);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1_000;
  }

  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - now);
}

export function redactSecrets(value, secrets) {
  let output = String(value);

  for (const secret of secrets || []) {
    if (!secret) {
      continue;
    }

    output = output.split(String(secret)).join("[REDACTED]");

    const encoded = encodeURIComponent(String(secret));
    if (encoded !== secret) {
      output = output.split(encoded).join("[REDACTED]");
    }
  }

  return output;
}

function redactError(error, secrets) {
  const safeError = new Error(
    redactSecrets(error?.message || String(error), secrets),
  );
  safeError.name = error?.name || "Error";
  return safeError;
}

function stripTrailingSlash(value) {
  return String(value).replace(/\/+$/, "");
}

function validateCanonicalUrl(value) {
  if (!value || typeof value !== "string") {
    throw new Error("canonicalUrl is required and must be an absolute HTTP(S) URL.");
  }

  const canonicalUrl = value.trim();
  let parsed;

  try {
    parsed = new URL(canonicalUrl);
  } catch {
    throw new Error("canonicalUrl must be an absolute HTTP(S) URL.");
  }

  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    !parsed.hostname
  ) {
    throw new Error("canonicalUrl must be an absolute HTTP(S) URL.");
  }

  return canonicalUrl;
}

function canonicalUrlsMatch(left, right) {
  if (!left || !right) {
    return false;
  }

  return stripTrailingSlash(left) === stripTrailingSlash(right);
}

function assertArticleId(article, operation) {
  if (!article?.id) {
    throw new Error(`DEV ${operation} did not return an article id.`);
  }
}

function articleStateEntry(
  article,
  canonicalUrl,
  published,
  previous = {},
) {
  return {
    ...previous,
    id: article.id,
    ...(article.url ? { url: article.url } : {}),
    ...(article.path ? { path: article.path } : {}),
    ...(article.slug ? { slug: article.slug } : {}),
    canonical_url: article.canonical_url || canonicalUrl,
    published,
  };
}

function log(logger, level, message) {
  if (!logger) {
    return;
  }

  const method = logger[level] ?? logger.log;
  method?.call(logger, message);
}

function defaultSleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
