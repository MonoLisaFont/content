import assert from "node:assert/strict";
import test from "node:test";

import {
  planDevToAttribution,
  refreshDevToAttribution,
} from "./refresh-devto-attribution.mjs";

const canonical = "https://monolisa.dev/posts/example";
const entry = { id: 42, canonical_url: canonical };
const article = {
  id: 42,
  canonical_url: canonical,
  published: true,
  body_markdown: "[Read](https://monolisa.dev/buy/trial)",
};

test("attribution refresh verifies identity and changes only body links", async () => {
  const requests = [];
  let backup;
  const plans = await refreshDevToAttribution({
    request: async (path, init) => {
      requests.push({ path, init });
      return init.method === "GET" ? article : { id: 42 };
    },
    states: [{ example: entry }],
    apply: true,
    backupPath: "backup.json",
    writeFileImpl: async (_path, content, options) => {
      backup = JSON.parse(content);
      assert.equal(options.flag, "wx");
    },
    logger: { log: () => {} },
  });
  assert.equal(plans.length, 1);
  assert.equal(backup[0].before, article.body_markdown);
  assert.deepEqual(requests.map(({ path, init }) => [path, init.method]), [
    ["/articles/42", "GET"],
    ["/articles/42", "PUT"],
  ]);
  assert.deepEqual(Object.keys(JSON.parse(requests[1].init.body).article), ["body_markdown"]);
  assert.match(JSON.parse(requests[1].init.body).article.body_markdown, /utm_source=devto/);
});

test("attribution refresh refuses mismatched canonical URLs before writes", () => {
  assert.throws(
    () => planDevToAttribution({ ...article, canonical_url: "https://other.example/" }, entry, "example"),
    /canonical URL mismatch/,
  );
});
