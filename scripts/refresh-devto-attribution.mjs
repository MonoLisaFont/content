#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import dotenv from "dotenv";

import { tagDevToMarkdownLinks } from "./campaign-markdown.mjs";
import { createDevToRequest } from "./devto-api.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const stateFiles = [".devto-state.json", ".devto-friction-state.json"];

export function planDevToAttribution(article, entry, slug) {
  if (article?.id !== entry?.id || !entry?.id) {
    throw new Error(`DEV article id mismatch for ${slug}.`);
  }
  const actualCanonical = String(article.canonical_url ?? "").replace(/\/+$/, "");
  const expectedCanonical = String(entry.canonical_url ?? "").replace(/\/+$/, "");
  if (!expectedCanonical || actualCanonical !== expectedCanonical) {
    throw new Error(`DEV canonical URL mismatch for ${slug}.`);
  }
  if (
    !(article.published || article.published_at || article.published_timestamp) ||
    typeof article.body_markdown !== "string"
  ) {
    throw new Error(`DEV article ${slug} must be published and contain Markdown.`);
  }
  const body = tagDevToMarkdownLinks(article.body_markdown, slug);
  return {
    id: article.id,
    slug,
    canonical_url: actualCanonical,
    before: article.body_markdown,
    after: body,
    changed: body !== article.body_markdown,
  };
}

export async function refreshDevToAttribution({
  request,
  states,
  apply = false,
  backupPath,
  writeFileImpl = writeFile,
  logger = console,
}) {
  const plans = [];
  for (const state of states) {
    for (const [slug, entry] of Object.entries(state)) {
      if (!entry?.id) continue;
      const article = await request(`/articles/${entry.id}`, { method: "GET" });
      plans.push(planDevToAttribution(article, entry, slug));
    }
  }
  const changes = plans.filter((plan) => plan.changed);
  logger.log(`${changes.length} of ${plans.length} DEV articles need attribution updates.`);
  for (const plan of changes) logger.log(`  ${plan.slug}`);
  if (!apply || changes.length === 0) return plans;
  if (!backupPath) throw new Error("backupPath is required when applying changes.");
  await writeFileImpl(backupPath, `${JSON.stringify(changes, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  logger.log(`Saved original DEV bodies to ${backupPath}.`);
  for (const plan of changes) {
    const updated = await request(`/articles/${plan.id}`, {
      method: "PUT",
      body: JSON.stringify({ article: { body_markdown: plan.after } }),
    });
    if (updated?.id !== plan.id) {
      throw new Error(`DEV did not confirm the update for ${plan.slug}.`);
    }
    logger.log(`Updated ${plan.slug}.`);
  }
  return plans;
}

async function main(argv = process.argv.slice(2)) {
  if (argv.some((arg) => !["--apply", "--dry-run"].includes(arg))) {
    throw new Error("Usage: node scripts/refresh-devto-attribution.mjs [--dry-run | --apply]");
  }
  if (argv.includes("--apply") && argv.includes("--dry-run")) {
    throw new Error("Choose --apply or --dry-run.");
  }
  dotenv.config({ path: resolve(root, ".env.private"), quiet: true });
  if (!process.env.DEVTO_API_KEY) throw new Error("DEVTO_API_KEY is missing.");
  const states = await Promise.all(stateFiles.map(async (file) => {
    const entries = JSON.parse(await readFile(resolve(root, file), "utf8"));
    if (file !== ".devto-friction-state.json") return entries;
    return Object.fromEntries(Object.entries(entries).map(([slug, entry]) => [
      slug,
      { ...entry, canonical_url: `https://monolisa.dev/posts/${slug}` },
    ]));
  }));
  const backupPath = resolve(root, `.devto-attribution-backup-${Date.now()}.json`);
  await refreshDevToAttribution({
    request: createDevToRequest({ apiKey: process.env.DEVTO_API_KEY }),
    states,
    apply: argv.includes("--apply"),
    backupPath,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
