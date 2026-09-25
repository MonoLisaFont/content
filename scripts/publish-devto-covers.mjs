#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { put } from "@vercel/blob";
import dotenv from "dotenv";
import { createDevToRequest, readDevToState, writeDevToState, withDevToStateLock, redactSecrets } from "./devto-api.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const preservedFields = ["title", "body_markdown", "canonical_url", "tag_list", "published_at", "collection_id", "description"];

export function canonicalSlug(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["monolisa.dev", "www.monolisa.dev"].includes(url.hostname)) return;
    return url.pathname.match(/^\/posts\/([a-z0-9_]+)\/?$/)?.[1];
  } catch { /* Unrelated articles are not candidates. */ }
}

export function matchPublishedArticles(designs, articles) {
  return designs.map(design => {
    const matches = articles.filter(article => canonicalSlug(article.canonical_url) === design.slug);
    if (matches.length !== 1) throw new Error(`${design.slug}: expected one published DEV article, found ${matches.length}. No articles will be created.`);
    return { ...design, article: matches[0] };
  });
}

export function coverMatches(actual, expected) {
  if (!actual || !expected) return false;
  // Forem can return the original URL or its percent-encoded image proxy URL.
  if (actual === expected) return true;
  try {
    const proxy = new URL(actual);
    if (!/^media\d*\.dev\.to$/.test(proxy.hostname)) return false;
    const path = decodeURIComponent(proxy.pathname);
    return path.endsWith(`/${expected}`);
  } catch { return false; }
}

export function validateCoverPng(data, name) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (data.length < 33 || !data.subarray(0, 8).equals(signature) || data.toString("ascii", 12, 16) !== "IHDR" ||
      data.readUInt32BE(16) !== 2000 || data.readUInt32BE(20) !== 840) {
    throw new Error(`${name}: expected a 2000 × 840 PNG. Run render:devto-covers first.`);
  }
  if (data.length > 5 * 1024 * 1024) throw new Error(`${name}: cover exceeds the 5 MB project budget.`);
}

export function assertArticlePreserved(before, after) {
  for (const field of preservedFields) {
    if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) {
      throw new Error(`DEV article ${before.id}: ${field} changed during the cover update. Inspect the saved backup before proceeding.`);
    }
  }
}

export async function listPublishedArticles(request) {
  const articles = [];
  for (let page = 1; ; page++) {
    const batch = await request(`/articles/me?page=${page}&per_page=100`);
    if (!Array.isArray(batch)) throw new Error("Unexpected DEV article inventory.");
    articles.push(...batch);
    if (batch.length < 100) return articles;
  }
}

export async function updateCover({ article, url, request, backup }) {
  const before = await request(`/articles/${article.id}`);
  if (canonicalSlug(before.canonical_url) !== canonicalSlug(article.canonical_url) || !before.published_at) {
    throw new Error(`DEV article ${article.id} no longer matches the published article selected.`);
  }
  if (coverMatches(before.cover_image, url)) return { article: before, changed: false };
  await backup(before);
  // Do not send published, body_markdown, tags, or canonical_url: existing
  // platform-specific copy (including Liquid disclosures) must be preserved.
  await request(`/articles/${article.id}`, { method: "PUT", body: { article: { main_image: url } } });
  const after = await request(`/articles/${article.id}`);
  assertArticlePreserved(before, after);
  if (!coverMatches(after.cover_image, url)) throw new Error(`DEV article ${article.id}: cover readback did not match.`);
  return { article: after, changed: true, previousCover: before.cover_image };
}

export function parseCoverArgs(argv) {
  const options = { all: false, dryRun: false, slugs: [] };
  for (const arg of argv) {
    if (arg === "--all") options.all = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
    else options.slugs.push(arg);
  }
  if (!options.help && (options.all === Boolean(options.slugs.length))) throw new Error("Pass --all or one or more post slugs.");
  return options;
}

export async function run(argv = process.argv.slice(2)) {
  const options = parseCoverArgs(argv);
  if (options.help) {
    console.log("Usage: npm run publish:devto-covers -- [--all | post_slug ...] [--dry-run]\nUpdates covers of existing published articles only. Dry runs are offline.");
    return;
  }
  const designs = JSON.parse(await readFile(resolve(root, "scripts/devto-cover-designs.json"), "utf8"));
  if (new Set(designs.map(d => d.slug)).size !== designs.length) throw new Error("Duplicate cover design slug.");
  for (const slug of options.slugs) if (!designs.some(d => d.slug === slug)) throw new Error(`No cover design for ${slug}.`);
  const selected = designs.filter(d => options.all || options.slugs.includes(d.slug));
  const assets = await Promise.all(selected.map(async design => {
    if (!/^[a-z0-9_]+$/.test(design.slug)) throw new Error("Invalid cover slug.");
    await readFile(resolve(root, `03_posts/${design.slug}.md`));
    const data = await readFile(resolve(root, `social_media/devto/${design.slug}.png`));
    validateCoverPng(data, design.slug);
    return { ...design, data, hash: createHash("sha256").update(data).digest("hex") };
  }));
  if (options.dryRun) {
    for (const asset of assets) console.log(`${asset.slug}: 2000 × 840, ${Math.round(asset.data.length / 1024)} KB; would match published canonical URL and update main_image only.`);
    return;
  }
  dotenv.config({ path: resolve(root, ".env.private"), quiet: true });
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is required.");
  const request = createDevToRequest({ apiKey: process.env.DEVTO_API_KEY });
  const statePath = resolve(root, ".devto-covers-state.json");
  await withDevToStateLock(statePath, async () => {
    const user = await request("/users/me");
    if (user.username !== "monolisafont") throw new Error("DEV API key must belong to monolisafont.");
    // Resolve every requested article before uploading or changing anything.
    const matches = matchPublishedArticles(assets, await listPublishedArticles(request));
    const state = await readDevToState(statePath);
    const backupDir = resolve(root, ".devto-cover-backups");
    await mkdir(backupDir, { recursive: true });
    for (const asset of matches) {
      let cached = state[asset.slug];
      if (cached?.sha256 !== asset.hash || !cached?.url) {
        const blob = await put(`devto-covers/${asset.slug}-${asset.hash}.png`, asset.data, {
          access: "public", token, contentType: "image/png", addRandomSuffix: false,
          allowOverwrite: true, cacheControlMaxAge: 31536000,
        });
        cached = { sha256: asset.hash, url: blob.url };
      }
      // Verify public hosting before pointing a live article at the image.
      const response = await fetch(cached.url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`Cover host returned ${response.status} for ${asset.slug}.`);
      const remoteHash = createHash("sha256").update(Buffer.from(await response.arrayBuffer())).digest("hex");
      if (remoteHash !== asset.hash) throw new Error(`Hosted image differs from ${asset.slug}.png.`);
      state[asset.slug] = cached;
      await writeDevToState(statePath, state);
      const result = await updateCover({ article: asset.article, url: cached.url, request,
        backup: before => writeFile(resolve(backupDir, `${asset.slug}-${Date.now()}.json`), `${JSON.stringify(before, null, 2)}\n`, { flag: "wx", mode: 0o600 }),
      });
      state[asset.slug] = { ...cached, articleId: result.article.id, articleUrl: result.article.url,
        ...(result.changed ? { previousCover: result.previousCover, updatedAt: new Date().toISOString() } : {}),
      };
      await writeDevToState(statePath, state);
      console.log(`${result.changed ? "Updated" : "Already current"}: ${result.article.url}`);
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch(error => {
    console.error(redactSecrets(error.message, [process.env.DEVTO_API_KEY, process.env.BLOB_READ_WRITE_TOKEN].filter(Boolean)));
    process.exitCode = 1;
  });
}
