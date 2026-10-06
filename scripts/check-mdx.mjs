#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { compile } from "@mdx-js/mdx";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import smartypants from "remark-smartypants";

const directories = ["02_drafts", "03_posts"];
const contentPath = /^(?:faq\.md|(?:02_drafts|03_posts)\/[^/]+\.md)$/;
const objectId = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;

function git(args, rootDir) {
  return execFileSync("git", args, {
    cwd: rootDir,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
}

async function workingTreeSources(rootDir) {
  const paths = [];
  for (const directory of directories) {
    let entries;
    try {
      entries = await readdir(resolve(rootDir, directory), { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        paths.push(`${directory}/${entry.name}`);
      }
    }
  }

  const sources = [];
  for (const path of ["faq.md", ...paths.sort()]) {
    try {
      sources.push({ path, value: await readFile(resolve(rootDir, path), "utf8") });
    } catch (error) {
      if (path === "faq.md" && error.code === "ENOENT") continue;
      throw error;
    }
  }
  return sources;
}

export function pushObjectIds(input) {
  const ids = new Set();
  for (const line of input.split(/\r?\n/).filter((line) => line.trim())) {
    const fields = line.trim().split(/\s+/);
    if (fields.length !== 4 || !objectId.test(fields[1]) || !objectId.test(fields[3])) {
      throw new Error("Invalid Git pre-push input; unable to check outgoing content.");
    }
    // Git supplies an all-zero local object ID for branch/tag deletions.
    if (!/^0+$/.test(fields[1])) ids.add(fields[1]);
  }
  return [...ids];
}

function pushedSources(input, rootDir) {
  const sources = [];
  for (const revision of pushObjectIds(input)) {
    const paths = git(
      ["ls-tree", "-r", "--name-only", "-z", revision, "--", ...directories, "faq.md"],
      rootDir,
    ).split("\0").filter((path) => contentPath.test(path));

    for (const path of paths) {
      sources.push({ path, revision, value: git(["show", `${revision}:${path}`], rootDir) });
    }
  }
  return sources;
}

function rejectMalformedComments() {
  return (tree, file) => {
    function inspect(node) {
      if (
        (node.type === "mdxFlowExpression" || node.type === "mdxTextExpression") &&
        /^\/_[\s\S]*_\/$/.test(node.value.trim())
      ) {
        // Short malformed comments can parse as valid regex literals.
        file.fail("Malformed MDX comment; use {/* comment */}.", node);
      }
      for (const child of node.children ?? []) inspect(child);
    }
    inspect(tree);
  };
}

export async function checkMdxSources(sources) {
  const failures = [];
  for (const source of sources) {
    try {
      await compile({ path: source.path, value: source.value }, {
        // Explicitly use MDX: extension detection would treat .md as plain Markdown.
        format: "mdx",
        remarkPlugins: [remarkFrontmatter, remarkGfm, smartypants, rejectMalformedComments],
      });
    } catch (error) {
      failures.push({
        path: source.path,
        revision: source.revision,
        line: error.line ?? 1,
        column: error.column ?? 1,
        reason: error.reason ?? error.message,
      });
    }
  }
  return failures;
}

export async function runMdxCheck(
  argv = process.argv.slice(2),
  { rootDir = process.cwd(), stdin = process.stdin, logger = console } = {},
) {
  if (argv.length > 1 || (argv.length === 1 && argv[0] !== "--pre-push")) {
    throw new Error("Usage: npm run check:mdx [-- --pre-push]");
  }
  const prePush = argv[0] === "--pre-push";
  let sources;
  if (prePush) {
    let input = "";
    for await (const chunk of stdin) input += chunk;
    sources = pushedSources(input, rootDir);
  } else {
    sources = await workingTreeSources(rootDir);
  }

  const failures = await checkMdxSources(sources);
  for (const failure of failures) {
    const revision = failure.revision ? ` (${failure.revision.slice(0, 12)})` : "";
    logger.error(`${failure.path}:${failure.line}:${failure.column}${revision}: ${failure.reason}`);
  }
  if (failures.length) {
    logger.error(
      `MDX check failed: ${failures.length} invalid file(s).` +
      (prePush ? " Fix and commit the content before pushing." : ""),
    );
  } else {
    logger.log(`MDX check passed (${sources.length} file(s)).`);
  }
  return { checked: sources.length, failures };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  runMdxCheck().then(({ failures }) => {
    if (failures.length) process.exitCode = 1;
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
