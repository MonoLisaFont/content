import assert from "node:assert/strict";
import test from "node:test";

import {
  revalidateWebsitePathname,
  runWebsiteRevalidation,
} from "./revalidate-website.mjs";

test("revalidateWebsitePathname sends an authenticated pathname-only request", async () => {
  const requests = [];
  const response = { status: 204 };

  const result = await revalidateWebsitePathname("images/example.svg", {
    url: "https://www.monolisa.dev/api/revalidate/blob",
    secret: "website-secret",
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return response;
    },
  });

  assert.equal(result, response);
  assert.equal(requests.length, 1);
  assert.equal(
    requests[0].url,
    "https://www.monolisa.dev/api/revalidate/blob",
  );
  assert.deepEqual(requests[0].options, {
    method: "POST",
    redirect: "manual",
    headers: {
      Authorization: "Bearer website-secret",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pathname: "images/example.svg" }),
  });

  const requestBody = JSON.parse(requests[0].options.body);
  assert.deepEqual(requestBody, { pathname: "images/example.svg" });
  assert.equal(Object.hasOwn(requestBody, "context"), false);
});

test("revalidateWebsitePathname rejects redirects without following them", async () => {
  const requests = [];

  await assert.rejects(
    revalidateWebsitePathname("images/example.svg", {
      url: "https://www.monolisa.dev/api/revalidate/blob",
      secret: "website-secret",
      fetchImpl: async (url, options) => {
        requests.push({ url, options });
        return {
          status: 307,
          text: async () => "redirect not allowed",
        };
      },
    }),
    /status 307: redirect not allowed/,
  );

  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.redirect, "manual");
});

test("revalidateWebsitePathname redacts the secret from non-2xx responses", async () => {
  await assert.rejects(
    revalidateWebsitePathname("images/example.svg", {
      url: "https://www.monolisa.dev/api/revalidate/blob",
      secret: "website-secret",
      fetchImpl: async () => ({
        status: 503,
        text: async () => "cache unavailable for website-secret",
      }),
    }),
    (error) => {
      assert.match(error.message, /503/);
      assert.match(error.message, /cache unavailable/);
      assert.match(error.message, /\[REDACTED\]/);
      assert.doesNotMatch(error.message, /website-secret/);
      return true;
    },
  );
});

test("revalidateWebsitePathname redacts the secret from network errors", async () => {
  await assert.rejects(
    revalidateWebsitePathname("images/example.svg", {
      url: "https://www.monolisa.dev/api/revalidate/blob",
      secret: "website-secret",
      fetchImpl: async () => {
        throw new Error("connection failed for website-secret");
      },
    }),
    (error) => {
      assert.match(error.message, /Website revalidation request failed/);
      assert.match(error.message, /connection failed/);
      assert.match(error.message, /\[REDACTED\]/);
      assert.doesNotMatch(error.message, /website-secret/);
      return true;
    },
  );
});

test("runWebsiteRevalidation runs only the requested website invalidation", async () => {
  const calls = [];
  const logs = [];
  const fetchImpl = async () => ({ status: 204 });

  await runWebsiteRevalidation(
    ["--pathname", "images/example.svg"],
    {
      WEBSITE_REVALIDATION_URL:
        "https://www.monolisa.dev/api/revalidate/blob",
      WEBSITE_REVALIDATION_SECRET: "website-secret",
    },
    {
      fetchImpl,
      logger: { log: (message) => logs.push(message) },
      revalidateWebsiteImpl: async (pathname, options) => {
        calls.push({ pathname, options });
      },
    },
  );

  assert.deepEqual(calls, [
    {
      pathname: "images/example.svg",
      options: {
        url: "https://www.monolisa.dev/api/revalidate/blob",
        secret: "website-secret",
        fetchImpl,
      },
    },
  ]);
  assert.deepEqual(logs, [
    "Revalidated website caches for images/example.svg.",
  ]);
});
