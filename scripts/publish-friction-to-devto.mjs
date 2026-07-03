#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const postsDir = join(root, "03_posts");
const defaultStatePath = join(root, ".devto-friction-state.json");
const devToApiBase = "https://dev.to/api";
const series = "Friction in software development";
const defaultTags = "productivity, development";

const postSlugs = [
  "friction_in_software_development",
  "visual_friction",
  "cognitive_friction",
  "mechanical_friction",
  "context_friction",
  "typography_friction",
  "process_friction",
  "toolchain_friction",
  "communication_friction",
  "organizational_friction",
];

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printUsage();
  process.exit(0);
}

if (args["create-drafts"] && args.publish) {
  fail("Choose only one action: --create-drafts or --publish.");
}

const requestedAction = args.publish ? "publish" : "create-drafts";
const dryRunMode = args["dry-run"] || (!args["create-drafts"] && !args.publish);
const statePath = args.state || defaultStatePath;
const canonicalBase = stripTrailingSlash(args["canonical-base"] || process.env.MONOLISA_POST_BASE || "");
const apiKey = process.env.DEVTO_API_KEY;

const posts = await readPosts();
const existingState = await readState(statePath);

if (!dryRunMode && !apiKey) {
  fail("Set DEVTO_API_KEY before calling the DEV API.");
}

if (!dryRunMode && !canonicalBase) {
  fail("Pass --canonical-base, for example --canonical-base https://monolisa.dev/blog.");
}

if (dryRunMode) {
  await dryRun(posts, existingState, requestedAction);
} else if (requestedAction === "create-drafts") {
  await createDrafts(posts, existingState);
} else if (requestedAction === "publish") {
  await publishDrafts(posts, existingState);
}

async function dryRun(posts, state, requestedAction) {
  const publishing = requestedAction === "publish";
  const payloads = posts.map((post) => ({ post, payload: buildPayload(post, state, publishing) }));

  if (args.out) {
    await mkdir(args.out, { recursive: true });

    for (const { post, payload } of payloads) {
      const outputPath = join(args.out, `${post.slug}.json`);
      await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
    }

    console.log(`Wrote ${payloads.length} payloads to ${args.out}`);
  } else {
    console.log(`Dry run: ${requestedAction}`);
    console.log("");

    for (const { post, payload } of payloads) {
      const entry = state[post.slug];

      console.log(`${post.slug}`);
      console.log(`  operation: ${publishing ? "update existing DEV article with published: true" : "create unpublished draft, then update crosslinks"}`);
      console.log(`  DEV article: ${entry?.id ? `${entry.id} (${entry.url})` : "(not created yet)"}`);
      if (publishing && !entry?.id) {
        console.log("  warning: run --create-drafts before publishing this post");
      }
      console.log(`  title: ${payload.article.title}`);
      console.log(`  canonical_url: ${payload.article.canonical_url || "(set --canonical-base)"}`);
      console.log(`  published: ${payload.article.published}`);
    }
  }
}

async function createDrafts(posts, state) {
  const nextState = { ...state };

  for (const post of posts) {
    if (nextState[post.slug]?.id) {
      console.log(`Skipping existing draft for ${post.slug}: ${nextState[post.slug].url}`);
      continue;
    }

    const initialPayload = buildPayload(post, nextState, false);
    const article = await devToRequest("/articles", {
      method: "POST",
      body: JSON.stringify(initialPayload),
    });

    nextState[post.slug] = {
      id: article.id,
      url: article.url,
      path: article.path,
      slug: article.slug,
    };

    console.log(`Created draft for ${post.slug}: ${article.url}`);
    await writeState(statePath, nextState);
  }

  for (const post of posts) {
    const entry = nextState[post.slug];

    if (!entry?.id) {
      fail(`Missing DEV article id for ${post.slug}.`);
    }

    const updatedPayload = buildPayload(post, nextState, false);
    const article = await devToRequest(`/articles/${entry.id}`, {
      method: "PUT",
      body: JSON.stringify(updatedPayload),
    });

    nextState[post.slug] = {
      id: article.id,
      url: article.url,
      path: article.path,
      slug: article.slug,
    };

    console.log(`Updated DEV crosslinks for ${post.slug}`);
    await writeState(statePath, nextState);
  }

  console.log(`Drafts ready. Review them on DEV before running --publish.`);
}

async function publishDrafts(posts, state) {
  const nextState = { ...state };

  for (const post of posts) {
    const entry = nextState[post.slug];

    if (!entry?.id) {
      fail(`Missing DEV article id for ${post.slug}. Run --create-drafts first.`);
    }

    const payload = buildPayload(post, nextState, true);
    const article = await devToRequest(`/articles/${entry.id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    nextState[post.slug] = {
      id: article.id,
      url: article.url,
      path: article.path,
      slug: article.slug,
      published: true,
    };

    console.log(`Published ${post.slug}: ${article.url}`);
    await writeState(statePath, nextState);
  }
}

function buildPayload(post, state, published) {
  const body = rewriteLinks(post.body, state);

  return {
    article: {
      title: post.frontmatter.title,
      body_markdown: body,
      published,
      series,
      canonical_url: canonicalBase ? `${canonicalBase}/${post.slug}` : "",
      description: descriptionFromBody(post.body),
      tags: args.tags || defaultTags,
    },
  };
}

function rewriteLinks(body, state) {
  return body.replace(/\]\(\.\.\/([^)#]+)(#[^)]+)?\)/g, (match, rawSlug, hash = "") => {
    const slug = rawSlug.replace(/\/$/, "");

    if (postSlugs.includes(slug)) {
      const devUrl = state[slug]?.url;

      if (devUrl) {
        return `](${devUrl}${hash})`;
      }
    }

    if (canonicalBase) {
      return `](${canonicalBase}/${slug}${hash})`;
    }

    return match;
  });
}

async function readPosts() {
  return Promise.all(
    postSlugs.map(async (slug) => {
      const path = join(postsDir, `${slug}.md`);
      const markdown = await readFile(path, "utf8");
      const { frontmatter, body } = parseMarkdown(markdown, path);

      return { slug, path, frontmatter, body };
    }),
  );
}

function parseMarkdown(markdown, path) {
  if (!markdown.startsWith("---\n")) {
    fail(`Missing front matter in ${path}.`);
  }

  const closing = markdown.indexOf("\n---", 4);

  if (closing === -1) {
    fail(`Unclosed front matter in ${path}.`);
  }

  const frontmatterRaw = markdown.slice(4, closing).trim();
  const bodyStart = markdown.indexOf("\n", closing + 1);
  const body = bodyStart === -1 ? "" : markdown.slice(bodyStart + 1).trim();
  const frontmatter = parseFrontmatter(frontmatterRaw);

  if (!frontmatter.title) {
    fail(`Missing title in ${path}.`);
  }

  return { frontmatter, body };
}

function parseFrontmatter(raw) {
  const data = {};

  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);

    if (!match) {
      continue;
    }

    const [, key, value] = match;
    data[key] = parseFrontmatterValue(value);
  }

  return data;
}

function parseFrontmatterValue(value) {
  const trimmed = value.trim();

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function descriptionFromBody(body) {
  const firstParagraph = body
    .split(/\n\s*\n/)
    .find((block) => block.trim() && !block.trim().startsWith("#"));

  if (!firstParagraph) {
    return "";
  }

  return firstParagraph
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

async function devToRequest(path, init) {
  const response = await fetch(`${devToApiBase}${path}`, {
    ...init,
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
      ...init.headers,
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`DEV API ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function readState(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

async function writeState(path, state) {
  await writeFile(path, `${JSON.stringify(state, null, 2)}\n`);
}

function parseArgs(rawArgs) {
  const parsed = {};

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (!arg.startsWith("--")) {
      fail(`Unexpected argument: ${arg}`);
    }

    const key = arg.slice(2);

    if (["help", "dry-run", "create-drafts", "publish"].includes(key)) {
      parsed[key] = true;
      continue;
    }

    const value = rawArgs[index + 1];

    if (!value || value.startsWith("--")) {
      fail(`Missing value for --${key}`);
    }

    parsed[key] = value;
    index += 1;
  }

  return parsed;
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function printUsage() {
  console.log(`Usage:
  node scripts/publish-friction-to-devto.mjs --dry-run [--canonical-base URL] [--tags "tag1, tag2"]
  node scripts/publish-friction-to-devto.mjs --dry-run --create-drafts --canonical-base URL
  node scripts/publish-friction-to-devto.mjs --dry-run --publish --canonical-base URL
  DEVTO_API_KEY=... node scripts/publish-friction-to-devto.mjs --create-drafts --canonical-base URL
  DEVTO_API_KEY=... node scripts/publish-friction-to-devto.mjs --publish --canonical-base URL

Options:
  --dry-run previews the requested action without calling DEV. It is the default when no action is given.
  Add --out DIR to write JSON payloads during dry runs.
  --create-drafts creates unpublished DEV drafts, records returned URLs, then updates crosslinks.
  --publish updates those same articles with published: true.
  --state PATH controls where DEV article ids and URLs are stored.
`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
