import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  localImagePathForReference,
  publishContentFiles,
  referencedImagePaths,
  unpublishContentPathnames,
} from "./publish-content-to-blob.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const imageFile = resolve(root, "images/example.svg");
const faqFile = resolve(root, "faq.md");
const draftFile = resolve(root, "02_drafts/example.md");
const unsafeImageFile = resolve(
  root,
  "images/my image $(do-not-run);it's.svg",
);
const env = {
  BLOB_READ_WRITE_TOKEN: "blob-token",
  WEBSITE_REVALIDATION_URL:
    "https://www.monolisa.dev/api/revalidate/blob",
  WEBSITE_REVALIDATION_SECRET: "website-secret",
};
const silentLogger = { log: () => {} };

test("referencedImagePaths preserves commas inside srcSet image URLs", () => {
  const markdown =
    '<picture><source srcSet="/images/example,small.png 1x, /images/example.png 2x" /></picture>';

  assert.deepEqual(referencedImagePaths(markdown), [
    "images/example,small.png",
    "images/example.png",
  ]);
});

test("referencedImagePaths parses compact srcset candidates and ignores code", () => {
  const markdown = `
<source srcset="https://cdn.example.com/images/external.svg 1x,/images/first.svg 2x,/images/second.svg 3x" />

\`![Inline example](/images/not-inline.svg)\`

\`\`\`markdown
![Fenced example](/images/not-fenced.svg)
<img src="/images/not-fenced-either.svg" />
\`\`\`

    ![Indented example](/images/not-indented.svg)

<pre><code>![HTML code](/images/not-html-code.svg)</code></pre>

- List item
    ![List image](/images/list-image.svg)
`;

  assert.deepEqual(referencedImagePaths(markdown), [
    "images/first.svg",
    "images/second.svg",
    "images/list-image.svg",
  ]);
});

test("referencedImagePaths supports reference images and unquoted HTML attributes", () => {
  const markdown = `![Full reference][Diagram]
![Collapsed reference][]
![Shortcut]

[diagram]: /images/reference.svg#detail "Diagram"
[Collapsed reference]: </images/collapsed.png?size=2>
[shortcut]: /images/shortcut.webp
[ordinary-link]: /images/not-an-image-reference.svg

<img src=/images/unquoted.svg>
<source srcset=/images/unquoted-source.svg>

\`![Code reference][ignored]\`
[ignored]: /images/ignored.svg
`;

  assert.deepEqual(referencedImagePaths(markdown), [
    "images/unquoted.svg",
    "images/unquoted-source.svg",
    "images/reference.svg",
    "images/collapsed.png",
    "images/shortcut.webp",
  ]);
});

test("referencedImagePaths supports balanced brackets in inline image descriptions", () => {
  assert.deepEqual(
    referencedImagePaths(
      `![Alt text with [nested description]](/images/nested.svg "Caption")`,
    ),
    ["images/nested.svg"],
  );
  assert.deepEqual(
    referencedImagePaths(
      `![Alt text with [nested description]][hero]\n\n[hero]: /images/nested.svg`,
    ),
    ["images/nested.svg"],
  );
});

test("referencedImagePaths ignores comments, escapes, nested code, and quoted attribute text", () => {
  const markdown = `<img alt="literal src=/images/not-an-attribute.svg" src="/images/real.svg">
<img alt="2 > 1" src="/images/quoted-angle.svg">
\\<img src="/images/escaped-html.svg">
<!-- ![Disabled](/images/disabled.svg) -->
\\![Escaped](/images/escaped.svg)

> ~~~markdown
> ![Blockquote code](/images/blockquote-code.svg)
> ~~~

- List item

        ![Nested code](/images/nested-code.svg)
`;

  assert.deepEqual(referencedImagePaths(markdown), [
    "images/real.svg",
    "images/quoted-angle.svg",
  ]);
});

test("localImagePathForReference rejects decoded Windows path separators", () => {
  assert.throws(
    () =>
      localImagePathForReference(
        "/images/..%5C..%5Coutside.svg",
      ),
    /cannot contain backslashes/,
  );
});

test("publishContentFiles uploads every object before invalidating website caches", async () => {
  const events = [];
  const revalidations = [];

  await publishContentFiles(
    [imageFile, faqFile],
    { env },
    {
      logger: silentLogger,
      readFileImpl: async (file) => Buffer.from(file),
      putBlob: async (pathname) => {
        events.push(`upload:${pathname}`);
        return { url: `https://blob.example/${pathname}` };
      },
      revalidateWebsiteImpl: async (pathname, options) => {
        events.push(`revalidate:${pathname}`);
        revalidations.push({ pathname, options });
      },
    },
  );

  assert.deepEqual(events, [
    "upload:images/example.svg",
    "upload:faq.md",
    "revalidate:images/example.svg",
    "revalidate:faq.md",
  ]);
  assert.deepEqual(revalidations, [
    {
      pathname: "images/example.svg",
      options: {
        url: "https://www.monolisa.dev/api/revalidate/blob",
        secret: "website-secret",
      },
    },
    {
      pathname: "faq.md",
      options: {
        url: "https://www.monolisa.dev/api/revalidate/blob",
        secret: "website-secret",
      },
    },
  ]);
  assert.equal(Object.hasOwn(revalidations[0].options, "context"), false);
});

test("publishContentFiles deduplicates deterministic Blob pathnames", async () => {
  const uploads = [];
  const revalidations = [];

  const result = await publishContentFiles(
    [imageFile, faqFile, imageFile, faqFile],
    { env },
    {
      logger: silentLogger,
      readFileImpl: async () => Buffer.from("content"),
      putBlob: async (pathname) => {
        uploads.push(pathname);
        return { url: `https://blob.example/${pathname}` };
      },
      revalidateWebsiteImpl: async (pathname) => {
        revalidations.push(pathname);
      },
    },
  );

  assert.deepEqual(uploads, ["images/example.svg", "faq.md"]);
  assert.deepEqual(revalidations, ["images/example.svg", "faq.md"]);
  assert.deepEqual(result.pathnames, ["images/example.svg", "faq.md"]);
  assert.deepEqual(
    result.publications.map(({ pathname, url }) => ({ pathname, url })),
    [
      {
        pathname: "images/example.svg",
        url: "https://blob.example/images/example.svg",
      },
      { pathname: "faq.md", url: "https://blob.example/faq.md" },
    ],
  );
});

test("unpublishContentPathnames deletes deterministic objects before revalidating", async () => {
  const events = [];

  const result = await unpublishContentPathnames(
    ["drafts/example.md", "drafts/example.md"],
    { env },
    {
      logger: silentLogger,
      deleteBlobImpl: async (pathnames, options) => {
        events.push(["delete", pathnames, options]);
      },
      revalidateWebsiteImpl: async (pathname, options) => {
        events.push(["revalidate", pathname, options]);
      },
    },
  );

  assert.deepEqual(events, [
    ["delete", ["drafts/example.md"], { token: "blob-token" }],
    [
      "revalidate",
      "drafts/example.md",
      {
        url: "https://www.monolisa.dev/api/revalidate/blob",
        secret: "website-secret",
      },
    ],
  ]);
  assert.deepEqual(result.pathnames, ["drafts/example.md"]);
});

test("unpublishContentPathnames dry-run needs no configuration or network", async () => {
  const logs = [];
  const calls = [];

  await unpublishContentPathnames(
    ["drafts/example.md"],
    { dryRun: true, env: {} },
    {
      logger: { log: (message) => logs.push(message) },
      deleteBlobImpl: async () => calls.push("delete"),
      revalidateWebsiteImpl: async () => calls.push("revalidate"),
    },
  );

  assert.deepEqual(calls, []);
  assert.deepEqual(logs, [
    "Would delete Blob object: drafts/example.md",
    'Would revalidate website caches: {"pathname":"drafts/example.md"}',
  ]);
});

test("unpublishContentPathnames redacts deletion failures", async () => {
  await assert.rejects(
    unpublishContentPathnames(
      ["drafts/example.md"],
      { env },
      {
        logger: silentLogger,
        deleteBlobImpl: async () => {
          throw new Error("delete failed for blob-token");
        },
      },
    ),
    (error) => {
      assert.match(error.message, /delete failed for \[REDACTED\]/);
      assert.doesNotMatch(error.message, /blob-token/);
      return true;
    },
  );
});

test("publishContentFiles dry-run needs no configuration or network and prints invalidation payloads", async () => {
  const logs = [];
  const calls = [];

  const result = await publishContentFiles(
    [imageFile, faqFile, imageFile],
    { dryRun: true, env: {} },
    {
      logger: { log: (message) => logs.push(message) },
      readFileImpl: async () => {
        calls.push("read");
        throw new Error("dry-run read file");
      },
      putBlob: async () => {
        calls.push("upload");
        throw new Error("dry-run upload");
      },
      revalidateWebsiteImpl: async () => {
        calls.push("revalidate");
        throw new Error("dry-run revalidation");
      },
    },
  );

  assert.deepEqual(calls, []);
  assert.deepEqual(result.pathnames, ["images/example.svg", "faq.md"]);
  assert.deepEqual(logs.slice(0, 4), [
    "images/example.svg -> images/example.svg",
    "faq.md -> faq.md",
    'Would revalidate website caches: {"pathname":"images/example.svg"}',
    'Would revalidate website caches: {"pathname":"faq.md"}',
  ]);
  assert.doesNotMatch(logs.join("\n"), /context/);
});

test("publishContentFiles validates all configuration before uploading", async () => {
  for (const missing of [
    "BLOB_READ_WRITE_TOKEN",
    "WEBSITE_REVALIDATION_URL",
    "WEBSITE_REVALIDATION_SECRET",
  ]) {
    const incompleteEnv = { ...env };
    delete incompleteEnv[missing];
    const calls = [];

    await assert.rejects(
      publishContentFiles(
        [imageFile],
        { env: incompleteEnv },
        {
          logger: silentLogger,
          readFileImpl: async () => {
            calls.push("read");
            return Buffer.from("image");
          },
          putBlob: async () => {
            calls.push("upload");
            return { url: "https://blob.example/images/example.svg" };
          },
          revalidateWebsiteImpl: async () => {
            calls.push("revalidate");
          },
        },
      ),
      new RegExp(missing),
    );

    assert.deepEqual(calls, [], missing);
  }
});

test("publishContentFiles does not invalidate when an upload fails", async () => {
  const events = [];

  await assert.rejects(
    publishContentFiles(
      [imageFile, faqFile],
      { env },
      {
        logger: silentLogger,
        readFileImpl: async () => Buffer.from("content"),
        putBlob: async (pathname) => {
          events.push(`upload:${pathname}`);
          if (pathname === "faq.md") throw new Error("upload failed");
          return { url: `https://blob.example/${pathname}` };
        },
        revalidateWebsiteImpl: async (pathname) => {
          events.push(`revalidate:${pathname}`);
        },
      },
    ),
    /upload failed/,
  );

  assert.deepEqual(events, [
    "upload:images/example.svg",
    "upload:faq.md",
  ]);
});

test("publishContentFiles redacts revalidation failures and lists failed and remaining retries", async () => {
  const events = [];

  await assert.rejects(
    publishContentFiles(
      [imageFile, faqFile, draftFile],
      { env },
      {
        logger: silentLogger,
        readFileImpl: async () => Buffer.from("content"),
        putBlob: async (pathname) => {
          events.push(`upload:${pathname}`);
          return { url: `https://blob.example/${pathname}` };
        },
        revalidateWebsiteImpl: async (pathname) => {
          events.push(`revalidate:${pathname}`);
          if (pathname === "faq.md") {
            throw new Error(
              "Website revalidation failed for website-secret",
            );
          }
        },
      },
    ),
    (error) => {
      assert.match(
        error.message,
        /Website revalidation failed after all Blob uploads succeeded\./,
      );
      assert.match(error.message, /failed for \[REDACTED\]/);
      assert.doesNotMatch(error.message, /website-secret/);
      assert.match(
        error.message,
        /npm run website:revalidate -- --pathname faq\.md/,
      );
      assert.match(
        error.message,
        /npm run website:revalidate -- --pathname drafts\/example\.md/,
      );
      assert.doesNotMatch(
        error.message,
        /npm run website:revalidate -- --pathname images\/example\.svg/,
      );
      return true;
    },
  );

  assert.deepEqual(events, [
    "upload:images/example.svg",
    "upload:faq.md",
    "upload:drafts/example.md",
    "revalidate:images/example.svg",
    "revalidate:faq.md",
  ]);
});

test("publishContentFiles shell-quotes retry pathnames without corrupting them during redaction", async () => {
  const collisionEnv = {
    ...env,
    WEBSITE_REVALIDATION_SECRET: "my image",
  };

  await assert.rejects(
    publishContentFiles(
      [unsafeImageFile],
      { env: collisionEnv },
      {
        logger: silentLogger,
        readFileImpl: async () => Buffer.from("content"),
        putBlob: async (pathname) => ({
          url: `https://blob.example/${pathname}`,
        }),
        revalidateWebsiteImpl: async () => {
          throw new Error("failed for my image");
        },
      },
    ),
    (error) => {
      assert.match(error.message, /failed for \[REDACTED\]/);
      assert.match(
        error.message,
        /npm run website:revalidate -- --pathname 'images\/my image \$\(do-not-run\);it'\\''s\.svg'/,
      );
      return true;
    },
  );
});
