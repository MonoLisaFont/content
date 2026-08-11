import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";
import { PassThrough, Writable } from "node:stream";
import test from "node:test";

import {
  DEVTO_SVG_CONVERSION_POLICY,
  convertSvgToPng,
  createDevToImageUploader,
  extractDevToCsrfToken,
  fetchDevToCsrfToken,
  preflightRsvgConvert,
  prepareDevToAssets,
  readDevToAssetSources,
  resolveDevToSession,
  runSpawn,
} from "./devto-images.mjs";

const pngData = Buffer.alloc(33);
Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(
  pngData,
);
pngData.writeUInt32BE(13, 8);
pngData.write("IHDR", 12, "ascii");
pngData.writeUInt32BE(1, 16);
pngData.writeUInt32BE(1, 20);
pngData[24] = 8;
pngData[25] = 6;
const uploadAsset = {
  filename: "diagram.png",
  contentType: "image/png",
  data: pngData,
};
const silentLogger = { log: () => {}, warn: () => {} };

test("runSpawn passes fixed arguments without a shell and pipes input", async () => {
  const calls = [];
  const inputChunks = [];
  const spawnImpl = (command, args, options) => {
    calls.push({ command, args, options });
    const child = new EventEmitter();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.stdin = new Writable({
      write(chunk, _encoding, callback) {
        inputChunks.push(Buffer.from(chunk));
        callback();
      },
    });

    setImmediate(() => {
      child.stdout.end("output");
      child.stderr.end("warning");
      child.emit("close", 0, null);
    });
    return child;
  };

  const result = await runSpawn("rsvg-convert", ["--format", "png"], {
    input: Buffer.from("<svg/>"),
    spawnImpl,
  });

  assert.deepEqual(calls, [
    {
      command: "rsvg-convert",
      args: ["--format", "png"],
      options: {
        shell: false,
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      },
    },
  ]);
  assert.equal(Buffer.concat(inputChunks).toString(), "<svg/>");
  assert.equal(result.stdout.toString(), "output");
  assert.equal(result.stderr.toString(), "warning");
  assert.equal(result.exitCode, 0);
});

test("runSpawn kills converters that exceed output or time limits", async (t) => {
  await t.test("output", async () => {
    let killed = false;
    const spawnImpl = () => {
      const child = new EventEmitter();
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      child.stdin = new Writable({ write(_chunk, _encoding, done) { done(); } });
      child.kill = () => {
        killed = true;
      };
      setImmediate(() => child.stdout.write("too much output"));
      return child;
    };

    await assert.rejects(
      runSpawn("rsvg-convert", [], { maxStdoutBytes: 4, spawnImpl }),
      /stdout size limit/,
    );
    assert.equal(killed, true);
  });

  await t.test("timeout", async () => {
    let killed = false;
    const spawnImpl = () => {
      const child = new EventEmitter();
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      child.stdin = new Writable({ write(_chunk, _encoding, done) { done(); } });
      child.kill = () => {
        killed = true;
      };
      return child;
    };

    await assert.rejects(
      runSpawn("rsvg-convert", [], { timeoutMs: 5, spawnImpl }),
      /timed out/,
    );
    assert.equal(killed, true);
  });
});

test("rsvg conversion preflights availability and returns validated PNG bytes", async () => {
  const calls = [];
  const runner = async (command, args, options) => {
    calls.push({ command, args, options });
    return args.includes("--version")
      ? { exitCode: 0, stdout: Buffer.from("rsvg-convert 2.60") }
      : { exitCode: 0, stdout: pngData };
  };

  assert.equal(await preflightRsvgConvert({ runner }), "rsvg-convert 2.60");
  const result = await convertSvgToPng(Buffer.from("<svg/>"), { runner });

  assert.deepEqual(result, pngData);
  assert.deepEqual(
    calls.map(({ args }) => args),
    [["--version"], ["--version"], ["--format", "png"]],
  );
  assert.equal(calls[2].options.input.toString(), "<svg/>");
});

test("rsvg conversion rejects PNGs above DEV's dimension limit", async () => {
  const oversized = Buffer.from(pngData);
  oversized.writeUInt32BE(4097, 16);

  await assert.rejects(
    convertSvgToPng(Buffer.from("<svg/>"), {
      runner: async (_command, args) =>
        args.includes("--version")
          ? { exitCode: 0, stdout: "rsvg-convert 2.60" }
          : { exitCode: 0, stdout: oversized },
    }),
    /dimensions 4097x1 exceed DEV's/,
  );
});

test("rsvg preflight reports a missing executable clearly", async () => {
  const missing = Object.assign(new Error("spawn ENOENT"), { code: "ENOENT" });

  await assert.rejects(
    preflightRsvgConvert({ runner: async () => { throw missing; } }),
    /rsvg-convert was not found.*Install librsvg/,
  );
});

test("rsvg-convert does not inherit publishing credentials", async () => {
  let childEnvironment;
  const spawnImpl = (_command, _args, options) => {
    childEnvironment = options.env;
    const child = new EventEmitter();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.stdin = new Writable({ write(_chunk, _encoding, done) { done(); } });
    setImmediate(() => {
      child.stdout.end("rsvg-convert 2.60");
      child.stderr.end();
      child.emit("close", 0, null);
    });
    return child;
  };

  await preflightRsvgConvert({
    processEnv: {
      PATH: "/usr/bin",
      LANG: "en_US.UTF-8",
      DEVTO_API_KEY: "api-secret",
      DEVTO_SESSION_COOKIE: "session-secret",
      BLOB_READ_WRITE_TOKEN: "blob-secret",
      WEBSITE_REVALIDATION_SECRET: "website-secret",
    },
    spawnImpl,
  });

  assert.deepEqual(childEnvironment, {
    PATH: "/usr/bin",
    LANG: "en_US.UTF-8",
  });
});

test("asset preparation preserves rasters and converts SVGs in memory with both hashes", async () => {
  const raster = Buffer.from(pngData);
  const svg = Buffer.from("<svg><rect /></svg>");
  const reads = [];
  const processCalls = [];
  const readFile = async (path) => {
    reads.push(path);
    return path.endsWith("vector.svg") ? svg : raster;
  };
  const runner = async (_command, args) => {
    processCalls.push(args);
    return args.includes("--version")
      ? { exitCode: 0, stdout: "rsvg-convert 2.60" }
      : { exitCode: 0, stdout: pngData };
  };

  const sources = await readDevToAssetSources(
    ["images/photo.png", "images/vector.svg", "images/photo.png"],
    { rootDir: "/repo" },
    { readFile },
  );

  assert.equal(sources.length, 2);
  assert.equal(processCalls.length, 0, "source hashing must not invoke rsvg");
  assert.equal(
    sources[0].sourceHash,
    createHash("sha256").update(raster).digest("hex"),
  );
  assert.equal(
    sources[1].sourceHash,
    createHash("sha256")
      .update(`${DEVTO_SVG_CONVERSION_POLICY}\0`)
      .update(svg)
      .digest("hex"),
  );
  assert.equal(sources[1].conversionPolicy, DEVTO_SVG_CONVERSION_POLICY);

  const assets = await prepareDevToAssets(sources, {}, { runner });

  assert.deepEqual(reads, [
    "/repo/images/photo.png",
    "/repo/images/vector.svg",
  ]);
  assert.deepEqual(processCalls, [["--version"], ["--format", "png"]]);
  assert.equal(assets[0].filename, "photo.png");
  assert.equal(assets[0].contentType, "image/png");
  assert.deepEqual(assets[0].data, raster);
  assert.equal(assets[1].filename, "vector.png");
  assert.equal(assets[1].contentType, "image/png");
  assert.deepEqual(assets[1].data, pngData);
  assert.equal(
    assets[1].contentHash,
    createHash("sha256").update(pngData).digest("hex"),
  );
  assert.equal(assets[1].sourceHash, sources[1].sourceHash);
});

test("asset preparation rejects oversized raster dimensions before upload", async () => {
  const oversized = Buffer.from(pngData);
  oversized.writeUInt32BE(4097, 16);

  await assert.rejects(
    prepareDevToAssets(["images/oversized.png"], { rootDir: "/repo" }, {
      readFile: async () => oversized,
    }),
    /dimensions 4097x1 exceed DEV's/,
  );
});

test("asset preparation rejects animations above DEV's frame limit", async () => {
  const header = Buffer.alloc(13);
  header.write("GIF89a", 0, "ascii");
  header.writeUInt16LE(1, 6);
  header.writeUInt16LE(1, 8);
  const frame = Buffer.alloc(12);
  frame[0] = 0x2c;
  frame.writeUInt16LE(1, 5);
  frame.writeUInt16LE(1, 7);
  frame[10] = 2;
  const animation = Buffer.concat([
    header,
    ...Array.from({ length: 501 }, () => frame),
    Buffer.from([0x3b]),
  ]);

  await assert.rejects(
    prepareDevToAssets(["images/animation.gif"], { rootDir: "/repo" }, {
      readFile: async () => animation,
    }),
    /contains 501 frames; DEV accepts at most 500/,
  );
});

test("asset preparation rejects traversal and unsupported repository images", async () => {
  for (const path of ["../outside.png", "images/photo.tiff"]) {
    await assert.rejects(
      prepareDevToAssets([path], { rootDir: "/repo" }, {
        readFile: async () => Buffer.from("image"),
      }),
      /escapes the repository|Unsupported DEV image type/,
    );
  }
});

test("extractDevToCsrfToken handles attribute order, quotes, and entities", () => {
  assert.equal(
    extractDevToCsrfToken(
      `<html><meta content='token&amp;&#x2f;value' data-x="1" name='csrf-token'></html>`,
    ),
    "token&/value",
  );
});

test("resolveDevToSession returns CSRF and parses DEV's stringified user", async () => {
  const calls = [];
  const result = await resolveDevToSession(
    { sessionCookie: "session=session-secret", origin: "https://dev.test" },
    {
      fetch: async (url, init) => {
        calls.push({ url, init });
        return jsonResponse(
          200,
          { token: "csrf-token", user: JSON.stringify({ id: 7, username: "mono" }) },
          { url },
        );
      },
    },
  );

  assert.deepEqual(result, {
    csrfToken: "csrf-token",
    sessionUser: { id: 7, username: "mono" },
  });
  assert.equal(calls[0].url, "https://dev.test/async_info/base_data");
  assert.equal(calls[0].init.headers.Cookie, "session=session-secret");
  assert.equal(calls[0].init.redirect, "manual");
});

test("session resolution rejects unsigned and cross-origin responses", async () => {
  await assert.rejects(
    resolveDevToSession(
      { sessionCookie: "session=expired", origin: "https://dev.test" },
      { fetch: async (url) => jsonResponse(200, { token: "anonymous" }, { url }) },
    ),
    /did not contain a signed-in user/,
  );

  await assert.rejects(
    resolveDevToSession(
      { sessionCookie: "session=value", origin: "https://dev.test" },
      {
        fetch: async () =>
          jsonResponse(200, { token: "csrf", user: "{}" }, {
            url: "https://evil.test/async_info/base_data",
          }),
      },
    ),
    /crossed origins/,
  );
});

test("fetchDevToCsrfToken can use the signed-in /new meta-tag fallback", async () => {
  const calls = [];
  const token = await fetchDevToCsrfToken(
    {
      sessionCookie: "session=value",
      origin: "https://dev.test",
      preferBaseData: false,
    },
    {
      fetch: async (url, init) => {
        calls.push({ url, init });
        return htmlResponse(
          200,
          `<meta name="csrf-token" content="editor-token">`,
          { url },
        );
      },
    },
  );

  assert.equal(token, "editor-token");
  assert.equal(calls[0].url, "https://dev.test/new");
  assert.equal(calls[0].init.headers.Cookie, "session=value");

  await assert.rejects(
    fetchDevToCsrfToken(
      {
        sessionCookie: "session=value",
        origin: "https://dev.test",
        preferBaseData: false,
      },
      {
        fetch: async (url) =>
          htmlResponse(302, "", {
            headers: { location: "/enter" },
            url,
          }),
      },
    ),
    /redirected.*session cookie/,
  );
});

test("DEV uploader uses fresh multipart forms, no Content-Type, and retries only 429 Retry-After", async () => {
  const forms = [];
  const requests = [];
  const sleeps = [];
  const warnings = [];
  let attempt = 0;
  const upload = createDevToImageUploader(
    {
      sessionCookie: "session=session-secret",
      csrfToken: "csrf-secret",
      origin: "https://dev.test",
      maxAttempts: 3,
    },
    {
      formDataFactory: () => {
        const entries = [];
        const form = {
          append: (...args) => entries.push(args),
          entries,
        };
        forms.push(form);
        return form;
      },
      blobFactory: (data, { type }) => ({ data: Buffer.from(data), type }),
      fetch: async (url, init) => {
        requests.push({ url, init });
        attempt += 1;
        return attempt === 1
          ? jsonResponse(429, { error: "wait session-secret" }, {
              headers: { "retry-after": "2" },
              url,
            })
          : jsonResponse(200, { links: ["https://media.dev.test/diagram.png"] }, { url });
      },
      sleep: async (milliseconds) => sleeps.push(milliseconds),
      logger: { warn: (message) => warnings.push(message) },
    },
  );

  const result = await upload(uploadAsset);

  assert.equal(result.url, "https://media.dev.test/diagram.png");
  assert.equal(forms.length, 2);
  assert.notEqual(forms[0], forms[1]);
  assert.deepEqual(
    forms[0].entries.map(([name]) => name),
    ["authenticity_token", "image[]"],
  );
  assert.equal(forms[0].entries[0][1], "csrf-secret");
  assert.equal(forms[0].entries[1][2], "diagram.png");
  assert.equal(forms[0].entries[1][1].type, "image/png");
  assert.equal(requests[0].url, "https://dev.test/image_uploads");
  assert.equal(requests[0].init.headers.Cookie, "session=session-secret");
  assert.equal(requests[0].init.headers["X-CSRF-Token"], "csrf-secret");
  assert.equal(
    Object.keys(requests[0].init.headers).some(
      (name) => name.toLowerCase() === "content-type",
    ),
    false,
  );
  assert.deepEqual(sleeps, [2_000]);
  assert.doesNotMatch(warnings.join("\n"), /session-secret/);
  assert.match(warnings[0], /\[REDACTED\]/);
});

test("DEV uploader resolves CSRF and exposes session identity when token is omitted", async () => {
  const requests = [];
  const upload = createDevToImageUploader(
    { sessionCookie: "session=value", origin: "https://dev.test" },
    {
      formDataFactory: () => ({ append: () => {} }),
      blobFactory: () => ({}),
      fetch: async (url, init) => {
        requests.push({ url, init });
        return url.endsWith("/async_info/base_data")
          ? jsonResponse(200, {
              token: "resolved-token",
              user: { id: 42, username: "monolisa" },
            }, { url })
          : jsonResponse(200, { links: ["/uploads/articles/image.png"] }, { url });
      },
      logger: silentLogger,
    },
  );

  const result = await upload(uploadAsset);

  assert.deepEqual(requests.map(({ url }) => url), [
    "https://dev.test/async_info/base_data",
    "https://dev.test/image_uploads",
  ]);
  assert.equal(requests[1].init.headers["X-CSRF-Token"], "resolved-token");
  assert.equal(result.url, "https://dev.test/uploads/articles/image.png");
  assert.deepEqual(result.sessionUser, { id: 42, username: "monolisa" });
});

test("DEV uploader does not retry ambiguous network, 5xx, or ordinary 4xx failures", async (t) => {
  const scenarios = [
    {
      name: "network",
      fetch: async () => { throw new TypeError("network timeout"); },
      pattern: /network timeout/,
    },
    {
      name: "server",
      fetch: async (url) => jsonResponse(503, { error: "unavailable" }, { url }),
      pattern: /503/,
    },
    {
      name: "invalid image",
      fetch: async (url) => jsonResponse(422, { error: "bad image" }, { url }),
      pattern: /422/,
    },
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.name, async () => {
      let calls = 0;
      const upload = createDevToImageUploader(
        {
          sessionCookie: "session=value",
          csrfToken: "csrf",
          origin: "https://dev.test",
          maxAttempts: 4,
        },
        {
          formDataFactory: () => ({ append: () => {} }),
          blobFactory: () => ({}),
          fetch: async (...args) => {
            calls += 1;
            return scenario.fetch(...args);
          },
          sleep: async () => assert.fail("must not sleep"),
          logger: silentLogger,
        },
      );

      await assert.rejects(upload(uploadAsset), scenario.pattern);
      assert.equal(calls, 1);
    });
  }
});

test("DEV uploader redacts cookie values and CSRF tokens from errors", async () => {
  const upload = createDevToImageUploader(
    {
      sessionCookie: "session=cookie-secret; remember=remember-secret",
      csrfToken: "csrf-secret",
      origin: "https://dev.test",
    },
    {
      formDataFactory: () => ({ append: () => {} }),
      blobFactory: () => ({}),
      fetch: async (url) =>
        jsonResponse(422, {
          error: "cookie-secret remember-secret csrf-secret",
        }, { url }),
      logger: silentLogger,
    },
  );

  await assert.rejects(upload(uploadAsset), (error) => {
    assert.doesNotMatch(error.message, /cookie-secret|remember-secret|csrf-secret/);
    assert.match(error.message, /\[REDACTED\]/);
    return true;
  });
});

function jsonResponse(status, body, options = {}) {
  return response(status, JSON.stringify(body), options);
}

function htmlResponse(status, body, options = {}) {
  return response(status, body, options);
}

function response(status, body, options = {}) {
  const headers = new Map(
    Object.entries(options.headers || {}).map(([name, value]) => [
      name.toLowerCase(),
      value,
    ]),
  );

  return {
    status,
    ok: status >= 200 && status < 300,
    redirected: options.redirected ?? false,
    url: options.url || "",
    headers: { get: (name) => headers.get(name.toLowerCase()) ?? null },
    text: async () => body,
  };
}
