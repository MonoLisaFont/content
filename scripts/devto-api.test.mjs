import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  DEVTO_V1_ACCEPT,
  buildDevToPayload,
  createDevToRequest,
  descriptionFromBody,
  normalizeDevToTags,
  parseMarkdownPost,
  publishDevToArticle,
  withDevToStateLock,
  writeDevToState,
} from "./devto-api.mjs";

const silentLogger = { log: () => {}, warn: () => {} };

test("parseMarkdownPost reads repository-style inline and multiline keyword arrays", () => {
  const inline = parseMarkdownPost(
    `---
title: "Inline post"
keywords: ["typefaces", "coding fonts"]
---

Inline body.
`,
    { path: "/content/02_drafts/inline_post.md" },
  );
  const multiline = parseMarkdownPost(
    `---
title: "Multiline post"
keywords:
  [
    "MonoLisa vs Fira Code",
    "programming fonts",
  ]
authors:
  - "Juho Vepsäläinen"
  - "Marcus Sterz"
---

Multiline body.
`,
    { slug: "custom-slug" },
  );

  assert.equal(inline.slug, "inline_post");
  assert.equal(inline.title, "Inline post");
  assert.deepEqual(inline.keywords, ["typefaces", "coding fonts"]);
  assert.equal(inline.body, "Inline body.");
  assert.equal(multiline.slug, "custom-slug");
  assert.deepEqual(multiline.keywords, [
    "MonoLisa vs Fira Code",
    "programming fonts",
  ]);
  assert.deepEqual(multiline.frontmatter.authors, [
    "Juho Vepsäläinen",
    "Marcus Sterz",
  ]);
});

test("descriptionFromBody ignores headings and images and strips Markdown", () => {
  const body = `# Heading

![Diagram](/images/diagram.svg)

This **short** paragraph links to [MonoLisa](https://monolisa.dev) and has \`code\`.
`;

  assert.equal(
    descriptionFromBody(body),
    "This short paragraph links to MonoLisa and has code.",
  );
  assert.equal(descriptionFromBody(body, 10), "This short");
});

test("normalizeDevToTags produces at most four 30-character alphanumeric tags", () => {
  assert.deepEqual(
    normalizeDevToTags([
      "Coding Fonts",
      "OpenType / fonts",
      "TYPE_faces!",
      "123",
      "ignored fifth tag",
    ]),
    ["codingfonts", "opentypefonts", "typefaces", "123"],
  );
  assert.deepEqual(normalizeDevToTags(["Café", "cafe", "!!!"]), ["cafe"]);
  assert.equal(
    normalizeDevToTags(["a".repeat(40)])[0],
    "a".repeat(30),
  );
});

test("buildDevToPayload uses rewritten Markdown, array tags, and optional series", () => {
  const post = {
    title: "A post",
    body: "Original introduction with a [link](/images/original.svg).",
    bodyMarkdown: "Rewritten body with a Blob URL.",
    keywords: ["fallback"],
  };
  const payload = buildDevToPayload(post, {
    canonicalUrl: "https://www.monolisa.dev/blog/a-post",
    published: true,
    tags: ["fonts", "typography"],
    series: "Font guides",
  });

  assert.deepEqual(payload, {
    article: {
      title: "A post",
      body_markdown: "Rewritten body with a Blob URL.",
      published: true,
      canonical_url: "https://www.monolisa.dev/blog/a-post",
      description: "Original introduction with a link.",
      tags: ["fonts", "typography"],
      series: "Font guides",
    },
  });

  assert.equal(
    Object.hasOwn(
      buildDevToPayload(post, {
        canonicalUrl: "https://www.monolisa.dev/blog/a-post",
      }).article,
      "series",
    ),
    false,
  );
});

test("buildDevToPayload rejects relative and non-HTTP canonical URLs", () => {
  const post = { title: "A post", body: "Body." };

  for (const canonicalUrl of ["/blog/a-post", "ftp://example.com/a-post"] ) {
    assert.throws(
      () => buildDevToPayload(post, { canonicalUrl }),
      /absolute HTTP\(S\) URL/,
    );
  }
});

test("createDevToRequest sends v1 authentication headers and retries with backoff", async () => {
  const calls = [];
  const sleeps = [];
  const warnings = [];
  const responses = [
    jsonResponse(429, { error: "Rate limited" }),
    jsonResponse(200, { id: 12 }),
  ];
  const request = createDevToRequest({
    apiKey: "dev-secret",
    userAgent: "MonoLisa publisher test",
    retryDelayMs: 25,
    fetch: async (url, init) => {
      calls.push({ url, init });
      return responses.shift();
    },
    sleep: async (milliseconds) => sleeps.push(milliseconds),
    logger: { warn: (message) => warnings.push(message) },
  });

  const result = await request("/articles", {
    method: "POST",
    body: { article: { title: "Test" } },
    headers: { Accept: "wrong", "api-key": "wrong" },
  });

  assert.deepEqual(result, { id: 12 });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "https://dev.to/api/articles");
  assert.equal(calls[0].init.headers.Accept, DEVTO_V1_ACCEPT);
  assert.equal(calls[0].init.headers["api-key"], "dev-secret");
  assert.equal(calls[0].init.headers["User-Agent"], "MonoLisa publisher test");
  assert.equal(calls[0].init.headers["Content-Type"], "application/json");
  assert.equal(calls[0].init.redirect, "manual");
  assert.equal(
    calls[0].init.body,
    JSON.stringify({ article: { title: "Test" } }),
  );
  assert.deepEqual(sleeps, [25]);
  assert.match(warnings[0], /Retrying in 25ms/);
});

test("createDevToRequest never follows redirects with the API key", async () => {
  const calls = [];
  const request = createDevToRequest({
    apiKey: "dev-secret",
    maxAttempts: 1,
    fetch: async (url, init) => {
      calls.push({ url, init });
      return {
        status: 302,
        ok: false,
        url,
        headers: { get: () => null },
        text: async () => "redirect",
      };
    },
    logger: { warn: () => {} },
  });

  await assert.rejects(request("/articles", { method: "GET" }), /DEV API 302/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.redirect, "manual");
  assert.equal(calls[0].init.headers["api-key"], "dev-secret");
});

test("createDevToRequest redacts the API key from errors and retry logs", async () => {
  const apiKey = "secret-with/a space";
  const warnings = [];
  let attempts = 0;
  const request = createDevToRequest({
    apiKey,
    maxAttempts: 2,
    retryDelayMs: 0,
    fetch: async () => {
      attempts += 1;

      if (attempts === 1) {
        throw new TypeError(`network failed for ${apiKey}`);
      }

      return jsonResponse(400, {
        error: `invalid ${apiKey} and ${encodeURIComponent(apiKey)}`,
      });
    },
    sleep: async () => {},
    logger: { warn: (message) => warnings.push(message) },
  });

  await assert.rejects(request("/articles", { method: "GET" }), (error) => {
    assert.doesNotMatch(error.message, /secret-with/);
    assert.match(error.message, /\[REDACTED\]/);
    return true;
  });
  assert.doesNotMatch(warnings.join("\n"), /secret-with/);
  assert.match(warnings[0], /\[REDACTED\]/);
});

test("writeDevToState stages a complete file before atomic rename", async () => {
  const events = [];

  await writeDevToState(
    "/state/.devto-state.json",
    { article: { id: 42 } },
    {
      randomSuffix: () => "fixed",
      writeFile: async (path, value, options) => {
        events.push(["write", path, value, options]);
      },
      rename: async (from, to) => events.push(["rename", from, to]),
      unlink: async (path) => events.push(["unlink", path]),
    },
  );

  const temporaryPath = `/state/.devto-state.json.${process.pid}.fixed.tmp`;
  assert.deepEqual(events, [
    [
      "write",
      temporaryPath,
      `${JSON.stringify({ article: { id: 42 } }, null, 2)}\n`,
      { encoding: "utf8", flag: "wx" },
    ],
    ["rename", temporaryPath, "/state/.devto-state.json"],
  ]);
});

test("withDevToStateLock serializes DEV state discovery and updates", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "monolisa-devto-lock-"));
  const statePath = join(directory, ".devto-state.json");
  t.after(() => rm(directory, { recursive: true, force: true }));
  let release;
  let started;
  const hasStarted = new Promise((resolve) => {
    started = resolve;
  });
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const first = withDevToStateLock(statePath, async () => {
    started();
    await gate;
    return "first";
  });

  await hasStarted;
  await assert.rejects(
    withDevToStateLock(statePath, async () => "duplicate"),
    /Another DEV publication/,
  );
  release();
  assert.equal(await first, "first");
  assert.equal(
    await withDevToStateLock(statePath, async () => "next"),
    "next",
  );
});

test("publishDevToArticle discovers, creates a draft, checkpoints it, then publishes", async () => {
  const calls = [];
  const persisted = [];
  let stateSource;
  const fetch = async (url, init) => {
    calls.push({ url, init });

    if (init.method === "GET") {
      return jsonResponse(200, []);
    }

    if (init.method === "POST") {
      return jsonResponse(201, {
        id: 41,
        url: "https://dev.to/monolisa/a-post-draft",
        slug: "a-post-draft",
      });
    }

    return jsonResponse(200, {
      id: 41,
      url: "https://dev.to/monolisa/a-post",
      slug: "a-post",
      published: true,
    });
  };
  const readFile = async () => {
    if (stateSource === undefined) {
      const error = new Error("missing");
      error.code = "ENOENT";
      throw error;
    }

    return stateSource;
  };
  const writeFile = async (_path, value) => {
    stateSource = value;
    persisted.push(JSON.parse(value));
  };
  const post = {
    slug: "local-a-post",
    title: "A post",
    body: "The original introduction.",
    bodyMarkdown: "The body with rewritten Blob image URLs.",
    keywords: ["fonts"],
  };

  const result = await publishDevToArticle({
    post,
    canonicalUrl: "https://www.monolisa.dev/blog/local-a-post",
    statePath: "/state/devto.json",
    apiKey: "dev-secret",
    tags: ["fonts", "coding"],
    series: "Font guides",
    fetch,
    readFile,
    writeFile,
    sleep: async () => {},
    logger: silentLogger,
  });

  assert.deepEqual(
    calls.map(({ url, init }) => [new URL(url).pathname + new URL(url).search, init.method]),
    [
      ["/api/articles/me/all?per_page=1000", "GET"],
      ["/api/articles", "POST"],
      ["/api/articles/41", "PUT"],
    ],
  );
  const draftPayload = JSON.parse(calls[1].init.body);
  const publishPayload = JSON.parse(calls[2].init.body);
  assert.equal(draftPayload.article.published, false);
  assert.equal(publishPayload.article.published, true);
  assert.equal(
    publishPayload.article.body_markdown,
    "The body with rewritten Blob image URLs.",
  );
  assert.deepEqual(publishPayload.article.tags, ["fonts", "coding"]);
  assert.equal(persisted.length, 2);
  assert.equal(persisted[0]["local-a-post"].id, 41);
  assert.equal(persisted[0]["local-a-post"].published, false);
  assert.equal(persisted[1]["local-a-post"].published, true);
  assert.equal(result.article.id, 41);
  assert.equal(result.state["local-a-post"].url, "https://dev.to/monolisa/a-post");
  assert.equal(result.created, true);
  assert.equal(result.source, "created");
});

test("publishDevToArticle reuses a canonical article even without local state", async () => {
  const calls = [];
  const persisted = [];
  const canonicalUrl = "https://www.monolisa.dev/blog/existing";
  const fetch = async (url, init) => {
    calls.push({ url, init });

    if (init.method === "GET") {
      return jsonResponse(200, [
        {
          id: 99,
          canonical_url: `${canonicalUrl}/`,
          url: "https://dev.to/monolisa/existing",
          published: false,
        },
      ]);
    }

    assert.equal(init.method, "PUT");
    return jsonResponse(200, {
      id: 99,
      canonical_url: canonicalUrl,
      url: "https://dev.to/monolisa/existing",
      published: true,
    });
  };
  const missingState = async () => {
    const error = new Error("missing");
    error.code = "ENOENT";
    throw error;
  };

  const result = await publishDevToArticle({
    post: {
      slug: "local-existing",
      title: "Existing",
      body: "Already on DEV.",
      keywords: ["fonts"],
    },
    canonicalUrl,
    statePath: "/state/devto.json",
    apiKey: "dev-secret",
    fetch,
    readFile: missingState,
    writeFile: async (_path, value) => persisted.push(JSON.parse(value)),
    sleep: async () => {},
    logger: silentLogger,
  });

  assert.deepEqual(calls.map(({ init }) => init.method), ["GET", "PUT"]);
  assert.equal(persisted.length, 2);
  assert.equal(persisted[0]["local-existing"].id, 99);
  assert.equal(persisted[1]["local-existing"].published, true);
  assert.equal(result.created, false);
  assert.equal(result.source, "discovered");
});

test("publishDevToArticle uses checkpointed state without rediscovery", async () => {
  const calls = [];
  const result = await publishDevToArticle({
    post: {
      slug: "checkpointed",
      title: "Checkpointed",
      body: "Ready to publish.",
    },
    canonicalUrl: "https://www.monolisa.dev/posts/checkpointed",
    statePath: "/state/devto.json",
    apiKey: "dev-secret",
    fetch: async (url, init) => {
      calls.push({ url, init });
      assert.equal(init.method, "PUT");
      return jsonResponse(200, {
        id: 77,
        url: "https://dev.to/monolisa/checkpointed",
        published: true,
      });
    },
    readFile: async () =>
      JSON.stringify({
        checkpointed: {
          id: 77,
          canonical_url: "https://www.monolisa.dev/posts/checkpointed",
          published: false,
        },
      }),
    writeFile: async () => {},
    sleep: async () => {},
    logger: silentLogger,
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/api\/articles\/77$/);
  assert.equal(result.source, "state");
  assert.equal(result.article.id, 77);
});

test("publishDevToArticle rejects state for a different canonical article", async () => {
  let requests = 0;

  await assert.rejects(
    publishDevToArticle({
      post: { slug: "state-mismatch", title: "Mismatch", body: "Body." },
      canonicalUrl: "https://www.monolisa.dev/posts/state-mismatch",
      statePath: "/state/devto.json",
      apiKey: "dev-secret",
      fetch: async () => {
        requests += 1;
      },
      readFile: async () =>
        JSON.stringify({
          "state-mismatch": {
            id: 88,
            canonical_url: "https://www.monolisa.dev/posts/someone-else",
          },
        }),
      writeFile: async () => assert.fail("state must not be written"),
      logger: silentLogger,
    }),
    /different canonical URL/,
  );
  assert.equal(requests, 0);
});

test("publishDevToArticle validates canonicalUrl before discovery", async () => {
  let requests = 0;

  await assert.rejects(
    publishDevToArticle({
      post: { slug: "relative", title: "Relative", body: "Body." },
      canonicalUrl: "/blog/relative",
      statePath: "/state/devto.json",
      request: async () => {
        requests += 1;
      },
    }),
    /absolute HTTP\(S\) URL/,
  );
  assert.equal(requests, 0);
});

test("publishDevToArticle does not retry an ambiguous draft creation failure", async () => {
  const calls = [];
  const missingState = async () => {
    const error = new Error("missing");
    error.code = "ENOENT";
    throw error;
  };

  await assert.rejects(
    publishDevToArticle({
      post: {
        slug: "no-duplicate",
        title: "No duplicate",
        body: "Body.",
      },
      canonicalUrl: "https://www.monolisa.dev/posts/no-duplicate",
      statePath: "/state/devto.json",
      apiKey: "dev-secret",
      fetch: async (_url, init) => {
        calls.push(init.method);
        if (init.method === "GET") return jsonResponse(200, []);
        throw new TypeError("network failed after create");
      },
      readFile: missingState,
      writeFile: async () => assert.fail("state must not be written"),
      sleep: async () => {},
      logger: silentLogger,
    }),
    /network failed after create/,
  );

  assert.deepEqual(calls, ["GET", "POST"]);
});

function jsonResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: () => null },
    text: async () => JSON.stringify(body),
  };
}
