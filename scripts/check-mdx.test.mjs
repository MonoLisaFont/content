import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { checkMdxSources, pushObjectIds, runMdxCheck } from "./check-mdx.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const zero = "0".repeat(40);
const first = "a".repeat(40);
const second = "b".repeat(40);
const silentLogger = { log() {}, error() {} };

test("accepts website frontmatter, tables, responsive images, and MDX comments", async () => {
  const failures = await checkMdxSources([{
    path: "02_drafts/example.md",
    value: `---
title: "Comparison {example}"
published: YYYY-MM-DD
draft: true
---

| Font | Italics |
| --- | --- |
| MonoLisa | Yes |

<picture>
  <source media="(max-width: 640px)" srcSet="/images/mobile.svg" />
  <img src="/images/desktop.svg" alt="Example" width="100%" />
</picture>

<details>
  <summary>View infographic</summary>
  <img src="/images/summary.svg" alt="Summary" />
</details>

{/* Editorial review before publication. */}
`,
  }]);
  assert.deepEqual(failures, []);
});

test("rejects the malformed editorial comment with its original file and line", async () => {
  const failures = await checkMdxSources([{
    path: "02_drafts/monolisa_vs_jetbrains_mono.md",
    value: '---\ntitle: "Comparison"\n---\n\nIntroduction.\n\n{/_ Editorial review: confirm license/source basis before publication. _/}\n',
  }, {
    path: "03_posts/another.md",
    value: "<picture>\n<img src=\"/images/example.svg\" />\n",
  }]);
  assert.equal(failures.length, 2);
  assert.equal(failures[0].path, "02_drafts/monolisa_vs_jetbrains_mono.md");
  assert.equal(failures[0].line, 7);
  assert.match(failures[0].reason, /Could not parse expression/);
  assert.equal(failures[1].path, "03_posts/another.md");
});

test("rejects malformed block and inline comments that otherwise parse as regex literals", async () => {
  const failures = await checkMdxSources([{
    path: "02_drafts/block.md",
    value: "{/_ Editorial review before publication. _/}\n",
  }, {
    path: "02_drafts/inline.md",
    value: "Introduction {/_ Editorial review. _/} continues.\n",
  }]);
  assert.equal(failures.length, 2);
  for (const failure of failures) assert.match(failure.reason, /Malformed MDX comment/);
});

test("allows malformed-looking examples inside code", async () => {
  const failures = await checkMdxSources([{
    path: "faq.md",
    value: 'Use `{/_ broken comment _/}` as an example.\n\n```mdx\n{/_ broken comment _/}\n<img>\n```\n',
  }]);
  assert.deepEqual(failures, []);
});

test("handles new branches, multiple refs, deletions, and duplicate outgoing commits", () => {
  const input = `refs/heads/main ${first} refs/heads/main ${zero}\n` +
    `refs/tags/v1 ${first} refs/tags/v1 ${zero}\n` +
    `refs/heads/other ${second} refs/heads/other ${first}\n` +
    `(delete) ${zero} refs/heads/old ${first}\n`;
  assert.deepEqual(pushObjectIds(input), [first, second]);
  assert.deepEqual(pushObjectIds(""), []);
  assert.throws(() => pushObjectIds("malformed input\n"), /Invalid Git pre-push input/);
});

test("checks new working drafts and FAQ while excluding non-MDX documents", async (t) => {
  const directory = await mkdtemp(resolve(tmpdir(), "monolisa-mdx-working-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(resolve(directory, "02_drafts"));
  await mkdir(resolve(directory, "emails/drafts"), { recursive: true });
  await writeFile(resolve(directory, "02_drafts/new.md"), "{/_ bad draft _/}");
  await writeFile(resolve(directory, "faq.md"), "{/* valid FAQ comment */}");
  await writeFile(resolve(directory, "README.md"), "{/_ not MDX _/}");
  await writeFile(resolve(directory, "emails/drafts/email.md"), "{/_ not MDX _/}");
  const result = await runMdxCheck([], { rootDir: directory, logger: silentLogger });
  assert.equal(result.checked, 2);
  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].path, "02_drafts/new.md");
});

test("pre-push skips deleted refs without reading any repository content", async () => {
  const result = await runMdxCheck(["--pre-push"], {
    rootDir: "/does-not-exist",
    stdin: Readable.from([`(delete) ${zero} refs/heads/old ${first}\n`]),
    logger: silentLogger,
  });
  assert.deepEqual(result, { checked: 0, failures: [] });
});

test("installed hook blocks a broken commit even with an uncommitted fix, then allows the committed fix", async (t) => {
  const directory = await mkdtemp(resolve(tmpdir(), "monolisa-mdx-push-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const repo = resolve(directory, "repo");
  const remote = resolve(directory, "remote.git");
  await mkdir(repo);
  const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git("init", "--quiet");
  git("init", "--quiet", "--bare", remote);
  await mkdir(resolve(repo, "scripts"));
  await mkdir(resolve(repo, ".husky"));
  await mkdir(resolve(repo, "02_drafts"));
  await symlink(resolve(root, "node_modules"), resolve(repo, "node_modules"), "dir");
  await copyFile(resolve(root, "scripts/check-mdx.mjs"), resolve(repo, "scripts/check-mdx.mjs"));
  await copyFile(resolve(root, ".husky/pre-push"), resolve(repo, ".husky/pre-push"));
  const env = { ...process.env, HUSKY: "1" };
  execFileSync(process.execPath, [resolve(root, "node_modules/husky/bin.js")], { cwd: repo, env });
  const commit = () => {
    git("add", "--", "02_drafts/example.md");
    git("-c", "user.name=MDX tests", "-c", "user.email=mdx@example.invalid",
      "-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "Test content");
    return git("rev-parse", "HEAD");
  };
  const push = () => spawnSync("git", ["push", remote, "HEAD:refs/heads/main"], {
    cwd: repo, env, encoding: "utf8",
  });
  const path = resolve(repo, "02_drafts/example.md");
  await writeFile(path, "{/_ Editorial review before publication. _/}\n");
  const badRevision = commit();
  await writeFile(path, "{/* Editorial review before publication. */}\n");

  const blocked = push();
  assert.equal(blocked.status, 1, blocked.stdout + blocked.stderr);
  assert.match(blocked.stderr, /02_drafts\/example\.md:1:/);
  assert.ok(blocked.stderr.includes(badRevision.slice(0, 12)));
  assert.match(blocked.stderr, /Fix and commit/);
  assert.notEqual(spawnSync("git", ["--git-dir", remote, "rev-parse", "--verify", "refs/heads/main"]).status, 0);

  const fixedRevision = commit();
  const allowed = push();
  assert.equal(allowed.status, 0, allowed.stdout + allowed.stderr);
  assert.match(allowed.stdout, /MDX check passed/);
  assert.equal(git("--git-dir", remote, "rev-parse", "refs/heads/main"), fixedRevision);
});
