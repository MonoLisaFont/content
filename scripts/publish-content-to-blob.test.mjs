import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  publishContentFiles,
  referencedImagePaths,
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
