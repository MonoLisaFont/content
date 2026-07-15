#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { put } from "@vercel/blob";
import dotenv from "dotenv";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: resolve(root, ".env.private"), quiet: true });

const COLLECTIONS = new Map([
  ["02_drafts", "drafts"],
  ["03_posts", "posts"],
]);
const CACHE_MAX_AGE = 60;

function usage() {
  return `Publish MonoLisa drafts and posts to Vercel Blob.

Usage:
  npm run publish:content -- --all
  npm run publish:content -- 02_drafts/my-post.md 03_posts/another-post.md
  npm run publish:content -- 02_drafts

Options:
  --all      Publish every Markdown file in 02_drafts and 03_posts
  --dry-run  Show what would be published without contacting Vercel
  --help     Show this help

Objects use deterministic paths such as drafts/my-post.md and
posts/another-post.md. Existing objects are overwritten.`;
}

function parseArgs(argv) {
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
    throw new Error("Pass --all or at least one draft/post path.\n\n" + usage());
  }
  return options;
}

function repositoryPath(path) {
  return relative(root, path).split(sep).join("/");
}

function blobPathFor(path) {
  const localPath = repositoryPath(path);
  const [directory, ...rest] = localPath.split("/");
  const prefix = COLLECTIONS.get(directory);

  if (!prefix || rest.length !== 1 || extname(rest[0]) !== ".md") {
    throw new Error(
      `${localPath} must be a Markdown file directly inside 02_drafts or 03_posts`,
    );
  }
  return `${prefix}/${rest[0]}`;
}

async function markdownFilesIn(directory) {
  const entries = await readdir(resolve(root, directory), {
    withFileTypes: true,
  });
  return entries
    .filter((entry) => entry.isFile() && extname(entry.name) === ".md")
    .map((entry) => resolve(root, directory, entry.name));
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
    if (!COLLECTIONS.has(localPath)) {
      throw new Error(`${input} must be 02_drafts or 03_posts`);
    }
    return markdownFilesIn(localPath);
  }
  if (!metadata.isFile()) throw new Error(`${input} is not a regular file`);

  blobPathFor(path);
  return [path];
}

async function collectFiles(options) {
  const paths = [];
  if (options.all) {
    for (const directory of COLLECTIONS.keys()) {
      paths.push(...(await markdownFilesIn(directory)));
    }
  }
  for (const input of options.inputs) paths.push(...(await filesForInput(input)));

  return [...new Set(paths)].sort((a, b) =>
    repositoryPath(a).localeCompare(repositoryPath(b)),
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const files = await collectFiles(options);

  if (!options.dryRun && !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is missing from .env.private");
  }

  for (const file of files) {
    const localPath = repositoryPath(file);
    const blobPath = blobPathFor(file);

    if (options.dryRun) {
      console.log(`${localPath} -> ${blobPath}`);
      continue;
    }

    const body = await readFile(file);
    const blob = await put(blobPath, body, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "text/markdown; charset=utf-8",
      cacheControlMaxAge: CACHE_MAX_AGE,
    });
    console.log(`${localPath} -> ${blob.url}`);
  }

  console.log(
    `${options.dryRun ? "Would publish" : "Published"} ${files.length} file${files.length === 1 ? "" : "s"}.`,
  );
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
