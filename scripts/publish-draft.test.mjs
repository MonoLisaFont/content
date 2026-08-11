import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  parsePublishDraftArgs,
  publicationPaths,
  publishDraft,
  publishDevToWithImages,
  localPublicationDate,
  rewriteDevToImages,
  rewriteDevToLinks,
  updatePublicationFrontmatter,
} from "./publish-draft.mjs";

const markdown = `---
title: "Example post"
published: YYYY-MM-DD
updated: 2026-07-01
draft: true
keywords:
  [
    "typefaces",
    "coding fonts",
  ]
authors: ["Example Author"]
---

Intro paragraph.

![Diagram](/images/example.svg)
`;

async function createFixture(t) {
  const rootDir = await mkdtemp(join(tmpdir(), "monolisa-publish-draft-"));
  await Promise.all([
    mkdir(join(rootDir, "02_drafts")),
    mkdir(join(rootDir, "03_posts")),
    mkdir(join(rootDir, "images")),
  ]);
  t.after(() => rm(rootDir, { recursive: true, force: true }));
  return rootDir;
}

test("parsePublishDraftArgs parses the publication controls", () => {
  assert.deepEqual(
    parsePublishDraftArgs([
      "02_drafts/example.md",
      "--devto",
      "--date",
      "2026-08-10",
      "--canonical-base",
      "https://www.monolisa.dev/posts/",
      "--tags",
      "fonts, typography",
    ]),
    {
      canonicalBase: "https://www.monolisa.dev/posts/",
      date: "2026-08-10",
      devto: true,
      dryRun: false,
      help: false,
      input: "02_drafts/example.md",
      tags: ["fonts", "typography"],
    },
  );

  assert.throws(
    () => parsePublishDraftArgs(["example.md", "--date", "2026-02-30"]),
    /Invalid publication date/,
  );
  assert.throws(
    () =>
      parsePublishDraftArgs([
        "example.md",
        "--tags",
        "one,two,three,four,five",
      ]),
    /at most four tags/,
  );
});

test("updatePublicationFrontmatter updates dates, removes draft, and preserves the body", () => {
  const result = updatePublicationFrontmatter(markdown, "2026-08-10");

  assert.match(result, /^---\ntitle: "Example post"\npublished: 2026-08-10\nupdated: 2026-08-10\n/);
  assert.doesNotMatch(result, /^draft:/m);
  assert.ok(result.endsWith("\n\n![Diagram](/images/example.svg)\n"));
  assert.match(result, /keywords:\n  \[\n    "typefaces",/);

  const withoutPublished = `---\r\ntitle: "CRLF"\r\nauthors: ["A"]\r\n---\r\n\r\nBody\r\n`;
  assert.equal(
    updatePublicationFrontmatter(withoutPublished, "2026-08-10"),
    `---\r\ntitle: "CRLF"\r\npublished: 2026-08-10\r\nauthors: ["A"]\r\n---\r\n\r\nBody\r\n`,
  );

  assert.equal(
    updatePublicationFrontmatter(`\uFEFF---\ntitle: "BOM"\n---\nBody\n`, "2026-08-10"),
    `\uFEFF---\ntitle: "BOM"\npublished: 2026-08-10\n---\nBody\n`,
  );
});

test("localPublicationDate uses the requested local calendar rather than UTC", () => {
  assert.equal(
    localPublicationDate(
      new Date("2026-08-10T01:00:00.000Z"),
      "Pacific/Honolulu",
    ),
    "2026-08-09",
  );
});

test("publicationPaths accepts direct draft names and rejects traversal", () => {
  const rootDir = "/tmp/content-root";
  assert.deepEqual(publicationPaths("example", rootDir), {
    filename: "example.md",
    slug: "example",
    sourcePath: resolve(rootDir, "02_drafts/example.md"),
    targetPath: resolve(rootDir, "03_posts/example.md"),
  });
  assert.throws(
    () => publicationPaths("02_drafts/nested/example.md", rootDir),
    /directly inside 02_drafts/,
  );
  assert.throws(
    () => publicationPaths("02_drafts/../example.md", rootDir),
    /directly inside 02_drafts/,
  );
});

test("rewriteDevToImages uses Blob URLs for SVG and raster references", () => {
  const input = `![Summary](/images/summary.svg "title")
<picture><source srcSet="/images/summary-mobile.svg 1x, /images/summary.svg 2x" /><img src='/images/example.png' /></picture>
![External](https://example.com/external.svg)
`;
  const imageUrls = new Map([
    ["images/summary.svg", "https://blob.example/images/summary.svg"],
    [
      "images/summary-mobile.svg",
      "https://blob.example/images/summary-mobile.svg",
    ],
    ["images/example.png", "https://blob.example/images/example.png"],
  ]);

  assert.equal(
    rewriteDevToImages(input, imageUrls),
    `![Summary](https://blob.example/images/summary.svg "title")
<picture><source srcSet="https://blob.example/images/summary-mobile.svg 1x, https://blob.example/images/summary.svg 2x" /><img src='https://blob.example/images/example.png' /></picture>
![External](https://example.com/external.svg)
`,
  );
});

test("rewriteDevToImages handles compact srcset and preserves code examples", () => {
  const input = `<source srcset="https://cdn.example.com/images/external.svg 1x,/images/first.svg 2x,/images/second.svg 3x" />
\`![Inline](/images/not-inline.svg)\`
\`\`\`md
![Fenced](/images/not-fenced.svg)
\`\`\`
    ![Indented](/images/not-indented.svg)
<code>![HTML code](/images/not-html-code.svg)</code>
- List item
    ![List image](/images/list-image.svg)
`;
  const imageUrls = new Map([
    ["images/first.svg", "https://blob.example/images/first.svg"],
    ["images/second.svg", "https://blob.example/images/second.svg"],
    ["images/list-image.svg", "https://blob.example/images/list-image.svg"],
  ]);

  assert.equal(
    rewriteDevToImages(input, imageUrls),
    `<source srcset="https://cdn.example.com/images/external.svg 1x,https://blob.example/images/first.svg 2x,https://blob.example/images/second.svg 3x" />
\`![Inline](/images/not-inline.svg)\`
\`\`\`md
![Fenced](/images/not-fenced.svg)
\`\`\`
    ![Indented](/images/not-indented.svg)
<code>![HTML code](/images/not-html-code.svg)</code>
- List item
    ![List image](https://blob.example/images/list-image.svg)
`,
  );
});

test("rewriteDevToImages preserves SVG fragments and rewrites reference and unquoted images", () => {
  const input = `![Sprite](/images/sprite.svg?theme=dark#symbol)
![Alt with [nested description]](/images/diagram.svg "Nested")
![Nested reference [description]][nested]
![Diagram][diagram]
<img src=/images/sprite.svg#thumbnail>
<source srcset="/images/sprite.svg#small 1x,/images/sprite.svg#large 2x">

[diagram]: </images/diagram.svg#overview> "Overview"
[nested]: /images/diagram.svg
[ordinary-link]: /images/not-an-image.svg
`;
  const imageUrls = new Map([
    ["images/sprite.svg", "https://blob.example/images/sprite.svg"],
    ["images/diagram.svg", "https://blob.example/images/diagram.svg"],
  ]);

  assert.equal(
    rewriteDevToImages(input, imageUrls),
    `![Sprite](https://blob.example/images/sprite.svg?theme=dark#symbol)
![Alt with [nested description]](https://blob.example/images/diagram.svg "Nested")
![Nested reference [description]][nested]
![Diagram][diagram]
<img src=https://blob.example/images/sprite.svg#thumbnail>
<source srcset="https://blob.example/images/sprite.svg#small 1x,https://blob.example/images/sprite.svg#large 2x">

[diagram]: <https://blob.example/images/diagram.svg#overview> "Overview"
[nested]: https://blob.example/images/diagram.svg
[ordinary-link]: /images/not-an-image.svg
`,
  );
});

test("rewriteDevToImages leaves comments, escapes, code, and quoted attribute text unchanged", () => {
  const input = `<img alt="literal src=/images/not-real.svg" src="/images/real.svg">
<img alt="2 > 1" src="/images/quoted-angle.svg">
\\<img src="/images/escaped-html.svg">
<!-- ![Disabled](/images/disabled.svg) -->
\\![Escaped](/images/escaped.svg)
> ~~~markdown
> ![Blockquote code](/images/blockquote-code.svg)
> ~~~
- Item

        ![Nested code](/images/nested-code.svg)
`;

  assert.equal(
    rewriteDevToImages(
      input,
      new Map([
        ["images/real.svg", "https://blob.example/images/real.svg"],
        [
          "images/quoted-angle.svg",
          "https://blob.example/images/quoted-angle.svg",
        ],
      ]),
    ),
    `<img alt="literal src=/images/not-real.svg" src="https://blob.example/images/real.svg">
<img alt="2 > 1" src="https://blob.example/images/quoted-angle.svg">
\\<img src="/images/escaped-html.svg">
<!-- ![Disabled](/images/disabled.svg) -->
\\![Escaped](/images/escaped.svg)
> ~~~markdown
> ![Blockquote code](/images/blockquote-code.svg)
> ~~~
- Item

        ![Nested code](/images/nested-code.svg)
`,
  );
});

test("rewriteDevToLinks makes MonoLisa-relative article links absolute", () => {
  assert.equal(
    rewriteDevToLinks(
      `[Release](/releases/3.000) and [Sibling](../other_post).
\`[Inline](/keep)\`
\`\`\`md
[Fenced](/keep-too)
\`\`\``,
      "https://www.monolisa.dev/posts",
    ),
    `[Release](https://www.monolisa.dev/releases/3.000) and [Sibling](https://www.monolisa.dev/posts/other_post).
\`[Inline](/keep)\`
\`\`\`md
[Fenced](/keep-too)
\`\`\``,
  );
});

test("publishDraft dry-run validates but performs no writes or network calls", async (t) => {
  const rootDir = await createFixture(t);
  const sourcePath = join(rootDir, "02_drafts/example.md");
  await Promise.all([
    writeFile(sourcePath, markdown),
    writeFile(join(rootDir, "images/example.svg"), "<svg />"),
  ]);
  const logs = [];
  const calls = [];

  const result = await publishDraft(
    {
      devto: true,
      dryRun: true,
      env: {},
      input: sourcePath,
      canonicalBase: "https://www.monolisa.dev/posts",
    },
    {
      rootDir,
      logger: { log: (message) => logs.push(message) },
      now: () => new Date(2026, 7, 10, 12),
      validateContentConfigImpl: () => calls.push("validate-config"),
      publishContentImpl: async () => calls.push("publish-content"),
      unpublishContentImpl: async () => calls.push("unpublish-content"),
      publishDevToImpl: async () => calls.push("devto"),
      prepareDevToAssetsImpl: async () => calls.push("prepare-devto-images"),
      resolveDevToSessionImpl: async () => calls.push("resolve-devto-session"),
      fetchDevToApiUserImpl: async () => calls.push("fetch-devto-user"),
      publishDevToWithImagesImpl: async () => calls.push("devto-images"),
    },
  );

  assert.equal(result.date, "2026-08-10");
  assert.equal(result.mode, "promote");
  assert.deepEqual(calls, []);
  assert.equal(await readFile(sourcePath, "utf8"), markdown);
  await assert.rejects(readFile(join(rootDir, "03_posts/example.md")), /ENOENT/);
  assert.match(logs.join("\n"), /Would publish images\/example\.svg/);
  assert.match(logs.join("\n"), /Would convert images\/example\.svg to PNG/);
  assert.match(logs.join("\n"), /Would upload images\/example\.svg to DEV/);
  assert.match(logs.join("\n"), /Would publish to DEV/);
});

test("publishDraft promotes locally, publishes the post, and removes the draft Blob", async (t) => {
  const rootDir = await createFixture(t);
  const sourcePath = join(rootDir, "02_drafts/example.md");
  const targetPath = join(rootDir, "03_posts/example.md");
  await Promise.all([
    writeFile(sourcePath, markdown),
    writeFile(join(rootDir, "images/example.svg"), "<svg />"),
  ]);
  const events = [];

  const result = await publishDraft(
    {
      devto: false,
      date: "2026-08-08",
      dryRun: false,
      env: { BLOB_READ_WRITE_TOKEN: "token" },
      input: sourcePath,
    },
    {
      rootDir,
      logger: { log: () => {} },
      now: () => assert.fail("an explicit date must not read the clock"),
      validateContentConfigImpl: () => events.push("validate"),
      publishContentImpl: async (input) => {
        events.push(`publish:${input}`);
        assert.match(await readFile(targetPath, "utf8"), /published: 2026-08-08/);
        return { publications: [] };
      },
      unpublishContentImpl: async (pathnames) => {
        events.push(`delete:${pathnames.join(",")}`);
      },
    },
  );

  assert.equal(result.mode, "promote");
  assert.deepEqual(events, [
    "validate",
    "publish:03_posts/example.md",
    "delete:drafts/example.md",
  ]);
  await assert.rejects(readFile(sourcePath), /ENOENT/);
  const promoted = await readFile(targetPath, "utf8");
  assert.equal(result.date, "2026-08-08");
  assert.match(promoted, /published: 2026-08-08/);
  assert.match(promoted, /updated: 2026-08-08/);
  assert.doesNotMatch(promoted, /^draft:/m);
});

test("publishDraft prepares isolated DEV images and ignores Blob image URLs", async (t) => {
  const rootDir = await createFixture(t);
  const sourcePath = join(rootDir, "02_drafts/example.md");
  await Promise.all([
    writeFile(sourcePath, `${markdown}\n[Release](/releases/3.000)\n`),
    writeFile(join(rootDir, "images/example.svg"), "<svg />"),
  ]);
  let devOptions;
  const devAsset = {
    localPath: "images/example.svg",
    filename: "example.png",
    contentType: "image/png",
    data: Buffer.from("png"),
    sourceHash: "source-hash",
    contentHash: "content-hash",
  };

  await publishDraft(
    {
      canonicalBase: "https://www.monolisa.dev/posts/",
      devto: true,
      dryRun: false,
      env: {
        DEVTO_API_KEY: "dev-key",
        DEVTO_SESSION_COOKIE: "_dev_to_session=session-secret",
      },
      input: sourcePath,
      series: "Typography",
      tags: ["fonts"],
    },
    {
      rootDir,
      logger: { log: () => {} },
      now: () => new Date(2026, 7, 10, 12),
      validateContentConfigImpl: () => {},
      publishContentImpl: async () => ({
        publications: [
          {
            pathname: "images/example.svg",
            url: "https://mono.public.blob.vercel-storage.com/images/example.svg",
          },
        ],
      }),
      unpublishContentImpl: async () => {},
      prepareDevToAssetsImpl: async (sources, options) => {
        assert.deepEqual(
          sources.map(({ localPath }) => localPath),
          ["images/example.svg"],
        );
        assert.equal(options.rootDir, rootDir);
        return [devAsset];
      },
      resolveDevToSessionImpl: async () => ({
        csrfToken: "csrf-secret",
        sessionUser: { id: 7, username: "monolisa" },
      }),
      fetchDevToApiUserImpl: async () => ({ id: 7, username: "monolisa" }),
      publishDevToWithImagesImpl: async (options) => {
        devOptions = options;
        return { article: { id: 42 } };
      },
    },
  );

  assert.equal(devOptions.apiKey, "dev-key");
  assert.equal(
    devOptions.canonicalUrl,
    "https://www.monolisa.dev/posts/example",
  );
  assert.deepEqual(devOptions.tags, ["fonts"]);
  assert.equal(devOptions.series, "Typography");
  assert.deepEqual(devOptions.assets, [devAsset]);
  assert.equal(devOptions.sessionCookie, "_dev_to_session=session-secret");
  assert.equal(devOptions.csrfToken, "csrf-secret");
  assert.equal(devOptions.lock, false);
  assert.match(devOptions.post.body, /!\[Diagram\]\(\/images\/example\.svg\)/);
  assert.match(devOptions.post.body, /\[Release\]\(\/releases\/3\.000\)/);
  assert.doesNotMatch(JSON.stringify(devOptions), /blob\.vercel-storage\.com/);
});

test("DEV media preflight failures leave the draft untouched", async (t) => {
  const scenarios = [
    {
      name: "missing session cookie",
      env: { DEVTO_API_KEY: "dev-key" },
      dependencies: {},
      pattern: /DEVTO_SESSION_COOKIE is missing/,
    },
    {
      name: "SVG conversion failure",
      env: {
        DEVTO_API_KEY: "dev-key",
        DEVTO_SESSION_COOKIE: "_dev_to_session=session-secret",
      },
      dependencies: {
        prepareDevToAssetsImpl: async () => {
          throw new Error("SVG conversion failed");
        },
      },
      pattern: /SVG conversion failed/,
    },
    {
      name: "API key and session account mismatch",
      env: {
        DEVTO_API_KEY: "dev-key",
        DEVTO_SESSION_COOKIE: "_dev_to_session=session-secret",
      },
      dependencies: {
        prepareDevToAssetsImpl: async () => [
          {
            localPath: "images/example.svg",
            filename: "example.png",
            contentType: "image/png",
            data: Buffer.from("png"),
            sourceHash: "source-hash",
            contentHash: "content-hash",
          },
        ],
        resolveDevToSessionImpl: async () => ({
          csrfToken: "csrf-secret",
          sessionUser: { id: 7, username: "monolisa" },
        }),
        fetchDevToApiUserImpl: async () => ({
          id: 8,
          username: "monolisa",
        }),
      },
      pattern: /different DEV accounts/,
    },
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.name, async (t) => {
      const rootDir = await createFixture(t);
      const sourcePath = join(rootDir, "02_drafts/example.md");
      const targetPath = join(rootDir, "03_posts/example.md");
      await Promise.all([
        writeFile(sourcePath, markdown),
        writeFile(join(rootDir, "images/example.svg"), "<svg />"),
      ]);
      const externalCalls = [];

      await assert.rejects(
        publishDraft(
          {
            canonicalBase: "https://www.monolisa.dev/posts",
            devto: true,
            dryRun: false,
            env: scenario.env,
            input: sourcePath,
          },
          {
            rootDir,
            logger: { log: () => {} },
            now: () => new Date(2026, 7, 10, 12),
            validateContentConfigImpl: () => {},
            publishContentImpl: async () => externalCalls.push("blob"),
            unpublishContentImpl: async () => externalCalls.push("delete"),
            publishDevToWithImagesImpl: async () => externalCalls.push("devto"),
            ...scenario.dependencies,
          },
        ),
        scenario.pattern,
      );

      assert.deepEqual(externalCalls, []);
      assert.equal(await readFile(sourcePath, "utf8"), markdown);
      await assert.rejects(readFile(targetPath), /ENOENT/);
    });
  }
});

test("publishDraft reuses cached DEV images without conversion or a session cookie", async (t) => {
  const rootDir = await createFixture(t);
  const sourcePath = join(rootDir, "02_drafts/example.md");
  await Promise.all([
    writeFile(sourcePath, markdown),
    writeFile(join(rootDir, "images/example.svg"), "<svg />"),
  ]);
  const canonicalUrl = "https://www.monolisa.dev/posts/example";
  const source = {
    localPath: "images/example.svg",
    filename: "example.png",
    contentType: "image/png",
    sourceHash: "source-hash",
    conversionPolicy: "rsvg-convert:png:v1",
    requiresConversion: true,
  };
  const events = [];
  let devOptions;

  await publishDraft(
    {
      canonicalBase: "https://www.monolisa.dev/posts",
      devto: true,
      dryRun: false,
      env: { DEVTO_API_KEY: "dev-key" },
      input: sourcePath,
    },
    {
      rootDir,
      logger: { log: () => {} },
      now: () => new Date(2026, 7, 10, 12),
      validateContentConfigImpl: () => {},
      withDevToStateLockImpl: async (_path, callback) => {
        events.push("lock");
        return callback();
      },
      readDevToStateImpl: async () => ({
        example: {
          canonical_url: canonicalUrl,
          devto_images: {
            "images/example.svg": {
              source_sha256: "source-hash",
              filename: "example.png",
              content_type: "image/png",
              url: "https://media2.dev.to/uploads/example.png",
            },
          },
        },
      }),
      readDevToAssetSourcesImpl: async () => [source],
      prepareDevToAssetsImpl: async () =>
        assert.fail("a cached SVG must not be converted"),
      resolveDevToSessionImpl: async () =>
        assert.fail("a cached image must not require a browser session"),
      fetchDevToApiUserImpl: async () => {
        events.push("api-user");
        return { id: 7, username: "monolisa" };
      },
      publishContentImpl: async () => events.push("blob"),
      unpublishContentImpl: async () => events.push("delete"),
      publishDevToWithImagesImpl: async (options) => {
        events.push("devto");
        devOptions = options;
        return { article: { id: 42 } };
      },
    },
  );

  assert.deepEqual(events, ["lock", "api-user", "blob", "delete", "devto"]);
  assert.deepEqual(devOptions.assets, [source]);
  assert.equal(devOptions.sessionCookie, undefined);
  assert.equal(devOptions.lock, false);
});

test("publishDraft holds one real state lock and sends only cached DEV media to the article", async (t) => {
  const rootDir = await createFixture(t);
  const sourcePath = join(rootDir, "02_drafts/example.md");
  const statePath = join(rootDir, ".devto-state.json");
  const canonicalUrl = "https://www.monolisa.dev/posts/example";
  const devImageUrl = "https://media2.dev.to/uploads/example.png";
  const source = {
    localPath: "images/example.svg",
    filename: "example.png",
    contentType: "image/png",
    sourceHash: "source-hash",
    conversionPolicy: "rsvg-convert:png:v1",
    requiresConversion: true,
  };
  await Promise.all([
    writeFile(sourcePath, markdown),
    writeFile(join(rootDir, "images/example.svg"), "<svg />"),
    writeFile(
      statePath,
      JSON.stringify({
        example: {
          canonical_url: canonicalUrl,
          devto_images: {
            "images/example.svg": {
              source_sha256: "source-hash",
              filename: "example.png",
              content_type: "image/png",
              url: devImageUrl,
            },
          },
        },
      }),
    ),
  ]);
  let articleBody;

  await publishDraft(
    {
      canonicalBase: "https://www.monolisa.dev/posts",
      devto: true,
      dryRun: false,
      env: { DEVTO_API_KEY: "dev-key" },
      input: sourcePath,
    },
    {
      rootDir,
      logger: { log: () => {} },
      now: () => new Date(2026, 7, 10, 12),
      validateContentConfigImpl: () => {},
      readDevToAssetSourcesImpl: async () => [source],
      prepareDevToAssetsImpl: async () =>
        assert.fail("the cached image must not be converted"),
      fetchDevToApiUserImpl: async () => ({ id: 7, username: "monolisa" }),
      publishContentImpl: async () => ({
        publications: [
          {
            pathname: "images/example.svg",
            url: "https://mono.public.blob.vercel-storage.com/images/example.svg",
          },
        ],
      }),
      unpublishContentImpl: async () => {},
      publishDevToImpl: async ({ post }) => {
        articleBody = post.bodyMarkdown;
        return { article: { id: 42 } };
      },
    },
  );

  assert.match(articleBody, /media2\.dev\.to\/uploads\/example\.png/);
  assert.doesNotMatch(articleBody, /\/images\/example\.svg|blob\.vercel/);
  await assert.rejects(readFile(`${statePath}.lock`), /ENOENT/);
});

test("a busy DEV state lock fails before local or Blob publication", async (t) => {
  const rootDir = await createFixture(t);
  const sourcePath = join(rootDir, "02_drafts/example.md");
  const targetPath = join(rootDir, "03_posts/example.md");
  await Promise.all([
    writeFile(sourcePath, markdown),
    writeFile(join(rootDir, "images/example.svg"), "<svg />"),
  ]);
  const calls = [];

  await assert.rejects(
    publishDraft(
      {
        canonicalBase: "https://www.monolisa.dev/posts",
        devto: true,
        dryRun: false,
        env: {
          DEVTO_API_KEY: "dev-key",
          DEVTO_SESSION_COOKIE: "_dev_to_session=session-secret",
        },
        input: sourcePath,
      },
      {
        rootDir,
        logger: { log: () => {} },
        validateContentConfigImpl: () => {},
        withDevToStateLockImpl: async () => {
          throw new Error("Another DEV publication is using the state lock.");
        },
        fetchDevToApiUserImpl: async () => calls.push("api-user"),
        publishContentImpl: async () => calls.push("blob"),
        unpublishContentImpl: async () => calls.push("delete"),
        publishDevToWithImagesImpl: async () => calls.push("devto"),
      },
    ),
    /Another DEV publication/,
  );

  assert.deepEqual(calls, []);
  assert.equal(await readFile(sourcePath, "utf8"), markdown);
  await assert.rejects(readFile(targetPath), /ENOENT/);
});

test("an invalid DEV API key fails before moving an image-free post", async (t) => {
  const rootDir = await createFixture(t);
  const sourcePath = join(rootDir, "02_drafts/example.md");
  const targetPath = join(rootDir, "03_posts/example.md");
  const imageFreeMarkdown = markdown.replace(
    "![Diagram](/images/example.svg)\n",
    "No images in this article.\n",
  );
  await writeFile(sourcePath, imageFreeMarkdown);
  const calls = [];

  await assert.rejects(
    publishDraft(
      {
        canonicalBase: "https://www.monolisa.dev/posts",
        devto: true,
        dryRun: false,
        env: { DEVTO_API_KEY: "expired-key" },
        input: sourcePath,
      },
      {
        rootDir,
        logger: { log: () => {} },
        validateContentConfigImpl: () => {},
        withDevToStateLockImpl: async (_path, callback) => callback(),
        fetchDevToApiUserImpl: async () => {
          throw new Error("DEV API request failed with HTTP 401");
        },
        publishContentImpl: async () => calls.push("blob"),
        unpublishContentImpl: async () => calls.push("delete"),
        publishDevToWithImagesImpl: async () => calls.push("devto"),
      },
    ),
    /HTTP 401/,
  );

  assert.deepEqual(calls, []);
  assert.equal(await readFile(sourcePath, "utf8"), imageFreeMarkdown);
  await assert.rejects(readFile(targetPath), /ENOENT/);
});

test("publishDevToWithImages checkpoints and reuses DEV-hosted image copies", async () => {
  const events = [];
  let articleOptions;
  let state = {
    example: {
      canonical_url: "https://www.monolisa.dev/posts/example",
      devto_images: {
        "images/example.svg": {
          source_sha256: "source-hash",
          filename: "example.png",
          content_type: "image/png",
          url: "https://blob.vercel-storage.com/images/example.png",
        },
      },
    },
  };
  const settings = {
    apiKey: "dev-key",
    assets: [
      {
        localPath: "images/example.svg",
        filename: "example.png",
        contentType: "image/png",
        data: Buffer.from("png-data"),
        sourceHash: "source-hash",
        contentHash: "content-hash",
      },
    ],
    canonicalBase: "https://www.monolisa.dev/posts",
    canonicalUrl: "https://www.monolisa.dev/posts/example",
    csrfToken: "csrf-secret",
    logger: { log: () => {} },
    post: {
      slug: "example",
      title: "Example",
      body: "![Diagram](/images/example.svg#detail)\n\n[Release](/releases/3.000)",
      keywords: ["fonts"],
    },
    sessionCookie: "_dev_to_session=session-secret",
    sessionUser: { id: 7, username: "monolisa" },
    statePath: "/state/devto.json",
    tags: ["fonts"],
  };
  const dependencies = {
    withStateLockImpl: async (_path, callback) => {
      events.push("lock");
      return callback();
    },
    readStateImpl: async () => structuredClone(state),
    writeStateImpl: async (_path, nextState) => {
      events.push("checkpoint");
      state = structuredClone(nextState);
    },
    createImageUploaderImpl: () => async () => {
      events.push("upload");
      return { url: "https://media2.dev.to/uploads/example.png" };
    },
    publishDevToImpl: async (options) => {
      events.push("article");
      articleOptions = options;
      return { article: { id: 42 } };
    },
  };

  await publishDevToWithImages(settings, dependencies);

  assert.deepEqual(events, ["lock", "upload", "checkpoint", "article"]);
  assert.equal(
    state.example.devto_images["images/example.svg"].url,
    "https://media2.dev.to/uploads/example.png",
  );
  assert.equal(articleOptions.lock, false);
  assert.match(
    articleOptions.post.bodyMarkdown,
    /https:\/\/media2\.dev\.to\/uploads\/example\.png/,
  );
  assert.doesNotMatch(articleOptions.post.bodyMarkdown, /#detail|\/images\//);
  assert.match(
    articleOptions.post.bodyMarkdown,
    /https:\/\/www\.monolisa\.dev\/releases\/3\.000/,
  );

  events.length = 0;
  dependencies.createImageUploaderImpl = () =>
    assert.fail("cached image must not be uploaded again");
  await publishDevToWithImages(settings, dependencies);
  assert.deepEqual(events, ["lock", "article"]);
});

test("DEV image checkpoints survive a partial upload failure and preserve article state", async () => {
  let state = {
    unrelated: { id: 9, canonical_url: "https://example.com/unrelated" },
    example: {
      id: 42,
      canonical_url: "https://www.monolisa.dev/posts/example",
      published: false,
    },
  };
  const uploads = [];
  const articleBodies = [];
  let failSecond = true;
  const settings = {
    apiKey: "dev-key",
    assets: [
      {
        localPath: "images/first.png",
        filename: "first.png",
        contentType: "image/png",
        data: Buffer.from("first"),
        sourceHash: "first-source",
        contentHash: "first-content",
      },
      {
        localPath: "images/second.png",
        filename: "second.png",
        contentType: "image/png",
        data: Buffer.from("second"),
        sourceHash: "second-source",
        contentHash: "second-content",
      },
    ],
    canonicalBase: "https://www.monolisa.dev/posts",
    canonicalUrl: "https://www.monolisa.dev/posts/example",
    csrfToken: "csrf-secret",
    logger: { log: () => {} },
    post: {
      slug: "example",
      title: "Example",
      body: "![First](/images/first.png)\n![Second](/images/second.png)",
    },
    sessionCookie: "_dev_to_session=session-secret",
    sessionUser: { id: 7, username: "monolisa" },
    statePath: "/state/devto.json",
  };
  const dependencies = {
    withStateLockImpl: async (_path, callback) => callback(),
    readStateImpl: async () => structuredClone(state),
    writeStateImpl: async (_path, nextState) => {
      state = structuredClone(nextState);
    },
    createImageUploaderImpl: () => async (asset) => {
      uploads.push(asset.localPath);
      if (failSecond && asset.localPath === "images/second.png") {
        throw new Error("second upload failed");
      }
      return {
        url: `https://media2.dev.to/uploads/${asset.filename}`,
      };
    },
    publishDevToImpl: async ({ post }) => {
      articleBodies.push(post.bodyMarkdown);
      return { article: { id: 42 } };
    },
  };

  await assert.rejects(
    publishDevToWithImages(settings, dependencies),
    /second upload failed/,
  );
  assert.deepEqual(uploads, ["images/first.png", "images/second.png"]);
  assert.equal(articleBodies.length, 0);
  assert.equal(state.example.id, 42);
  assert.equal(state.example.published, false);
  assert.equal(state.unrelated.id, 9);
  assert.ok(state.example.devto_images["images/first.png"]);
  assert.equal(state.example.devto_images["images/second.png"], undefined);

  failSecond = false;
  uploads.length = 0;
  await publishDevToWithImages(settings, dependencies);

  assert.deepEqual(uploads, ["images/second.png"]);
  assert.equal(articleBodies.length, 1);
  assert.match(articleBodies[0], /media2\.dev\.to\/uploads\/first\.png/);
  assert.match(articleBodies[0], /media2\.dev\.to\/uploads\/second\.png/);
  assert.equal(state.example.id, 42);
  assert.equal(state.unrelated.id, 9);
});

test("publishDevToWithImages honors an already-held state lock", async () => {
  let published = false;
  await publishDevToWithImages(
    {
      apiKey: "dev-key",
      assets: [],
      canonicalBase: "https://www.monolisa.dev/posts",
      canonicalUrl: "https://www.monolisa.dev/posts/example",
      lock: false,
      logger: { log: () => {} },
      post: { slug: "example", title: "Example", body: "Body." },
      statePath: "/state/devto.json",
    },
    {
      withStateLockImpl: async () =>
        assert.fail("an outer publication lock is already held"),
      readStateImpl: async () => ({}),
      publishDevToImpl: async () => {
        published = true;
        return { article: { id: 42 } };
      },
    },
  );

  assert.equal(published, true);
});

test("publishDevToWithImages rejects literal Vercel Blob URLs", async () => {
  await assert.rejects(
    publishDevToWithImages(
      {
        apiKey: "dev-key",
        assets: [],
        canonicalBase: "https://www.monolisa.dev/posts",
        canonicalUrl: "https://www.monolisa.dev/posts/example",
        lock: false,
        logger: { log: () => {} },
        post: {
          slug: "example",
          title: "Example",
          body: "![Blob](https://blob.vercel-storage.com/image.png)",
        },
        statePath: "/state/devto.json",
      },
      {
        readStateImpl: async () => ({}),
        publishDevToImpl: async () =>
          assert.fail("an article containing a Blob URL must not be published"),
      },
    ),
    /Vercel Blob URL/,
  );
});

test("publishDraft validates configuration and images before moving the draft", async (t) => {
  const rootDir = await createFixture(t);
  const sourcePath = join(rootDir, "02_drafts/example.md");
  await writeFile(sourcePath, markdown);

  await assert.rejects(
    publishDraft(
      { devto: false, dryRun: false, env: {}, input: sourcePath },
      {
        rootDir,
        validateContentConfigImpl: () => {
          throw new Error("missing Blob config");
        },
      },
    ),
    /images\/example\.svg is missing/,
  );
  assert.equal(await readFile(sourcePath, "utf8"), markdown);

  await writeFile(join(rootDir, "images/example.svg"), "<svg />");
  await assert.rejects(
    publishDraft(
      { devto: false, dryRun: false, env: {}, input: sourcePath },
      {
        rootDir,
        validateContentConfigImpl: () => {
          throw new Error("missing Blob config");
        },
      },
    ),
    /missing Blob config/,
  );
  assert.equal(await readFile(sourcePath, "utf8"), markdown);
});

test("publishDraft rejects source collisions and symlinks before side effects", async (t) => {
  const rootDir = await createFixture(t);
  const sourcePath = join(rootDir, "02_drafts/example.md");
  const targetPath = join(rootDir, "03_posts/example.md");
  const calls = [];
  await Promise.all([
    writeFile(sourcePath, markdown),
    writeFile(targetPath, updatePublicationFrontmatter(markdown, "2026-08-01")),
  ]);

  await assert.rejects(
    publishDraft(
      { devto: false, dryRun: false, env: {}, input: sourcePath },
      {
        rootDir,
        validateContentConfigImpl: () => calls.push("config"),
        publishContentImpl: async () => calls.push("publish"),
      },
    ),
    /Both draft and published post exist/,
  );
  assert.deepEqual(calls, []);
  assert.equal(await readFile(sourcePath, "utf8"), markdown);

  await unlink(targetPath);
  await unlink(sourcePath);
  const linkedSource = join(rootDir, "outside-source.md");
  await writeFile(linkedSource, markdown);
  await symlink(linkedSource, sourcePath);
  await assert.rejects(
    publishDraft(
      { devto: false, dryRun: false, env: {}, input: sourcePath },
      { rootDir, validateContentConfigImpl: () => calls.push("config") },
    ),
    /cannot be symbolic links/,
  );
  assert.deepEqual(calls, []);
});

test("publishDraft rejects symlinked publication directories", async (t) => {
  const rootDir = await createFixture(t);
  const outsideImages = join(rootDir, "outside-images");
  await mkdir(outsideImages);
  await rm(join(rootDir, "images"), { recursive: true });
  await symlink(outsideImages, join(rootDir, "images"), "dir");

  await assert.rejects(
    publishDraft(
      { devto: false, dryRun: true, env: {}, input: "example.md" },
      { rootDir },
    ),
    /Publication directory cannot be a symbolic link: images/,
  );
});

test("publishDraft resumes a post that was already moved after a partial failure", async (t) => {
  const rootDir = await createFixture(t);
  const targetPath = join(rootDir, "03_posts/example.md");
  const alreadyPublished = updatePublicationFrontmatter(markdown, "2026-08-09");
  await Promise.all([
    writeFile(targetPath, alreadyPublished),
    writeFile(join(rootDir, "images/example.svg"), "<svg />"),
  ]);
  const calls = [];

  const result = await publishDraft(
    { devto: false, dryRun: false, env: {}, input: "example.md" },
    {
      rootDir,
      logger: { log: () => {} },
      now: () => new Date(2026, 7, 10, 12),
      validateContentConfigImpl: () => {},
      publishContentImpl: async () => {
        calls.push("publish");
        return { publications: [] };
      },
      unpublishContentImpl: async () => calls.push("delete"),
    },
  );

  assert.equal(result.mode, "resume");
  assert.equal(result.date, "2026-08-09");
  assert.deepEqual(calls, ["publish", "delete"]);
  assert.match(await readFile(targetPath, "utf8"), /published: 2026-08-09/);
});

test("publishDraft rejects an unpromoted post during resume", async (t) => {
  const rootDir = await createFixture(t);
  const targetPath = join(rootDir, "03_posts/example.md");
  await Promise.all([
    writeFile(targetPath, markdown),
    writeFile(join(rootDir, "images/example.svg"), "<svg />"),
  ]);

  await assert.rejects(
    publishDraft(
      { devto: false, dryRun: false, env: {}, input: targetPath },
      {
        rootDir,
        validateContentConfigImpl: () => assert.fail("must not validate config"),
        publishContentImpl: async () => assert.fail("must not publish"),
      },
    ),
    /still contains draft metadata/,
  );
});

test("publishDraft cleans a partial target when the promotion write fails", async (t) => {
  const rootDir = await createFixture(t);
  const sourcePath = join(rootDir, "02_drafts/example.md");
  const targetPath = join(rootDir, "03_posts/example.md");
  await Promise.all([
    writeFile(sourcePath, markdown),
    writeFile(join(rootDir, "images/example.svg"), "<svg />"),
  ]);

  await assert.rejects(
    publishDraft(
      { devto: false, dryRun: false, env: {}, input: sourcePath },
      {
        rootDir,
        logger: { log: () => {} },
        validateContentConfigImpl: () => {},
        writeFileImpl: async (path) => {
          await writeFile(path, "partial", { flag: "wx" });
          const error = new Error("disk full");
          error.code = "ENOSPC";
          throw error;
        },
      },
    ),
    /disk full/,
  );

  assert.equal(await readFile(sourcePath, "utf8"), markdown);
  await assert.rejects(readFile(targetPath), /ENOENT/);
});

test("publishDraft rolls back the target when removing the source fails", async (t) => {
  const rootDir = await createFixture(t);
  const sourcePath = join(rootDir, "02_drafts/example.md");
  const targetPath = join(rootDir, "03_posts/example.md");
  await Promise.all([
    writeFile(sourcePath, markdown),
    writeFile(join(rootDir, "images/example.svg"), "<svg />"),
  ]);
  let externalCalls = 0;

  await assert.rejects(
    publishDraft(
      { devto: false, dryRun: false, env: {}, input: sourcePath },
      {
        rootDir,
        logger: { log: () => {} },
        validateContentConfigImpl: () => {},
        unlinkImpl: async (path) => {
          if (path === sourcePath) throw new Error("source is busy");
          await unlink(path);
        },
        publishContentImpl: async () => {
          externalCalls += 1;
        },
      },
    ),
    /source is busy/,
  );

  assert.equal(await readFile(sourcePath, "utf8"), markdown);
  await assert.rejects(readFile(targetPath), /ENOENT/);
  assert.equal(externalCalls, 0);
});

test("publishDraft reports how to finish remaining stages after an external failure", async (t) => {
  const rootDir = await createFixture(t);
  const sourcePath = join(rootDir, "02_drafts/example.md");
  await Promise.all([
    writeFile(sourcePath, markdown),
    writeFile(join(rootDir, "images/example.svg"), "<svg />"),
  ]);

  await assert.rejects(
    publishDraft(
      { devto: false, dryRun: false, env: {}, input: sourcePath },
      {
        rootDir,
        logger: { log: () => {} },
        validateContentConfigImpl: () => {},
        publishContentImpl: async () => {
          throw new Error(
            "Retry revalidation: npm run website:revalidate -- --pathname posts/example.md",
          );
        },
      },
    ),
    (error) => {
      assert.match(error.message, /Retry revalidation/);
      assert.match(error.message, /rerun the same publish:draft command/);
      return true;
    },
  );

  assert.match(
    await readFile(join(rootDir, "03_posts/example.md"), "utf8"),
    /published: \d{4}-\d{2}-\d{2}/,
  );
});
