import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { canonicalSlug, matchPublishedArticles, coverMatches, validateCoverPng, assertArticlePreserved,
  listPublishedArticles, updateCover, parseCoverArgs } from "./publish-devto-covers.mjs";

const url = "https://example.public.blob.vercel-storage.com/devto-covers/test.png";
const article = { id: 42, canonical_url: "https://www.monolisa.dev/posts/test", title: "Title",
  body_markdown: "{% details Optional %}unchanged{% enddetails %}", published_at: "2026-01-01T12:00:00Z",
  tag_list: ["fonts"], collection_id: 8, description: "Description", cover_image: null };

test("canonical matching accepts both MonoLisa hosts and rejects unrelated or draft paths", () => {
  assert.equal(canonicalSlug(article.canonical_url), "test");
  assert.equal(canonicalSlug("https://monolisa.dev/posts/test/"), "test");
  for (const value of ["https://evil.example/posts/test", "https://monolisa.dev/drafts/test", "bad", "http://monolisa.dev/posts/test"]) assert.equal(canonicalSlug(value), undefined);
  assert.equal(matchPublishedArticles([{ slug: "test" }], [article])[0].article.id, 42);
  assert.throws(() => matchPublishedArticles([{ slug: "test" }], []), /found 0/);
  assert.throws(() => matchPublishedArticles([{ slug: "test" }], [article, article]), /found 2/);
});

test("cover matching recognizes Forem proxy URLs without substring false positives", () => {
  assert.ok(coverMatches(url, url));
  assert.ok(coverMatches(`https://media2.dev.to/dynamic/image/width=1000/${encodeURIComponent(url)}`, url));
  assert.ok(!coverMatches(`${url}.other.png`, url));
  assert.ok(!coverMatches(`https://other.example/${encodeURIComponent(url)}`, url));
  assert.ok(!coverMatches(null, url));
});

test("cover update backs up before mutation and sends only main_image", async () => {
  const calls = [];
  let updated = false;
  const result = await updateCover({ article, url,
    backup: async before => { assert.deepEqual(before, article); calls.push("backup"); },
    request: async (path, init) => {
      assert.equal(path, "/articles/42");
      if (init) {
        assert.deepEqual(init, { method: "PUT", body: { article: { main_image: url } } });
        assert.deepEqual(calls, ["backup"]);
        updated = true;
      }
      return { ...article, cover_image: updated ? url : null };
    },
  });
  assert.equal(result.changed, true);
  assert.equal(result.previousCover, null);
});

test("already-current covers skip both backup and PUT", async () => {
  const result = await updateCover({ article, url, backup: () => assert.fail(), request: async (_path, init) => {
    assert.equal(init, undefined);
    return { ...article, cover_image: url };
  } });
  assert.equal(result.changed, false);
});

test("cover updates stop for changed canonical identity or unpublished articles", async () => {
  for (const changed of [{ canonical_url: "https://monolisa.dev/posts/other" }, { published_at: null }]) {
    await assert.rejects(updateCover({ article, url, backup: () => assert.fail(), request: async () => ({ ...article, ...changed }) }), /no longer matches/);
  }
});

test("article preservation checks catch text, metadata, and publication changes", () => {
  for (const field of ["body_markdown", "title", "tag_list", "canonical_url", "published_at", "collection_id", "description"]) {
    assert.throws(() => assertArticlePreserved(article, { ...article, [field]: "changed" }), new RegExp(field));
  }
});

test("inventory follows pagination", async () => {
  const calls = [];
  const articles = await listPublishedArticles(async path => {
    calls.push(path);
    return calls.length === 1 ? Array.from({ length: 100 }, (_, id) => ({ id })) : [{ id: 101 }];
  });
  assert.equal(articles.length, 101);
  assert.deepEqual(calls, ["/articles/me?page=1&per_page=100", "/articles/me?page=2&per_page=100"]);
});

test("every cover design has a published source, outlined SVG, and correctly sized PNG", async () => {
  const designs = JSON.parse(await readFile(new URL("./devto-cover-designs.json", import.meta.url)));
  assert.equal(new Set(designs.map(d => d.slug)).size, designs.length);
  for (const { slug } of designs) {
    await readFile(new URL(`../03_posts/${slug}.md`, import.meta.url));
    const data = await readFile(new URL(`../social_media/devto/${slug}.png`, import.meta.url));
    validateCoverPng(data, slug);
    const svg = await readFile(new URL(`../social_media/devto/${slug}.svg`, import.meta.url), "utf8");
    assert.ok(!/<text\b|@font-face|<image\b/.test(svg), `${slug} must contain self-contained outlines`);
  }
  assert.throws(() => validateCoverPng(Buffer.from("invalid"), "test"), /2000 × 840/);
});

test("CLI requires an explicit scope", () => {
  assert.deepEqual(parseCoverArgs(["--all", "--dry-run"]), { all: true, dryRun: true, slugs: [] });
  assert.deepEqual(parseCoverArgs(["test"]).slugs, ["test"]);
  assert.throws(() => parseCoverArgs([]), /Pass --all/);
  assert.throws(() => parseCoverArgs(["--all", "test"]), /Pass --all/);
  assert.throws(() => parseCoverArgs(["--unknown"]), /Unknown/);
});
