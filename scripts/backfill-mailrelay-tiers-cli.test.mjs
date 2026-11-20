import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("./backfill-mailrelay-tiers.mjs", import.meta.url));
const email = "buyer@example.test";
const account = "fixture.mailrelay.test";
const testKey = "offline-test-key";
const labels = [
  "unknown",
  "none",
  "trial",
  "v1",
  "v2",
  "v3_code",
  "v3_text",
  "v3_code_text",
  "commercial",
];
const options = labels.map((label, index) => ({ id: 24 + index, label }));
const bundleOption = options.find(({ label }) => label === "v3_code_text").id;

// The child imports this file before its CLI entry point. Every fetch is
// handled in memory, including unexpected URLs and writes.
if (process.argv[1] === cli) {
  const subscriber = {
    id: 12,
    email,
    status: "inactive",
    unsubscribed: true,
    groups: [{ group_id: 1 }, { group_id: 3 }],
    custom_fields: { 8: "unrelated field" },
    updated_at: "2020-01-01T00:00:00Z",
  };
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(input);
    const method = init.method ?? "GET";
    const body = init.body ? JSON.parse(init.body) : undefined;
    appendFileSync("requests.jsonl", JSON.stringify({ method, path: url.pathname, body }) + "\n");
    if (
      url.origin !== "https://" + account ||
      new Headers(init.headers).get("X-AUTH-TOKEN") !== testKey
    ) {
      return new Response(null, { status: 403 });
    }
    if (method === "GET" && url.pathname === "/api/v1/custom_fields/1") {
      return Response.json({
        id: 1,
        tag_name: "monolisatier",
        field_type: "select",
        custom_field_options: options,
      });
    }
    if (method === "GET" && url.pathname === "/api/v1/subscribers") {
      const groups = url.searchParams.getAll("q[groups_id_eq_any][]");
      const inGroup = subscriber.groups.some(({ group_id }) => groups.includes(String(group_id)));
      const records = inGroup ? [subscriber] : [];
      return Response.json(records, { headers: { Total: String(records.length) } });
    }
    if (url.pathname === "/api/v1/subscribers/12") {
      if (method === "PATCH") {
        Object.assign(subscriber.custom_fields, body.custom_fields);
        subscriber.updated_at = "2021-01-01T00:00:01Z";
      }
      if (method === "PATCH" || method === "GET") return Response.json(subscriber);
    }
    return new Response(null, { status: 404 });
  };
} else {
  function run(directory, args) {
    const result = spawnSync(process.execPath, ["--import", import.meta.url, cli, ...args], {
      cwd: directory,
      env: {},
      encoding: "utf8",
      timeout: 30_000,
    });
    assert.ifError(result.error);
    return result;
  }

  async function workspace(t) {
    const directory = await mkdtemp(join(tmpdir(), "monolisa-tier-cli-"));
    t.after(() => rm(directory, { recursive: true, force: true }));
    return directory;
  }

  async function jsonLines(path) {
    return (await readFile(path, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
  }

  test("CLI help and missing arguments work before contacting Mailrelay", async (t) => {
    const directory = await workspace(t);
    const help = run(directory, ["--help"]);
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /--transactions/);
    const missing = run(directory, []);
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /--transactions/);
    await assert.rejects(stat(join(directory, "requests.jsonl")), { code: "ENOENT" });
  });

  test("CLI previews privately and applies one verified tier to a subscriber in both groups", async (t) => {
    const directory = await workspace(t);
    await writeFile(
      join(directory, ".env.private"),
      `MAILRELAY_ACCOUNT_DOMAIN=${account}\nMAILRELAY_API_KEY=${testKey}\n`
    );
    await writeFile(
      join(directory, "transactions.csv"),
      [
        "Customer Email,Order ID,Product ID,Order Status,Order Type,Total,Date",
        `${email},11001,925531,Completed,Product,0.00,2020-01-01`,
        `${email},11002,926417,Partially Refunded,Product,5.00,2020-01-02`,
      ].join("\r\n")
    );
    const args = ["--transactions", "transactions.csv", "--cutoff", "2021-01-01T00:00:00Z"];
    const preview = run(directory, [...args, "--report", "preview.jsonl"]);
    assert.equal(preview.status, 0, preview.stderr);
    const planned = JSON.parse(preview.stdout);
    assert.equal(planned.subscribers, 1);
    assert.equal(planned.audiences.both, 1);
    assert.equal(planned.changesByTier.v3_code_text, 1);
    assert.equal(planned.results.planned, 1);
    assert.ok(
      (await jsonLines(join(directory, "requests.jsonl"))).every(({ method }) => method === "GET")
    );
    const [row] = await jsonLines(join(directory, "preview.jsonl"));
    assert.equal(row.email, email);
    assert.equal(row.to, "v3_code_text");
    if (process.platform !== "win32")
      assert.equal((await stat(join(directory, "preview.jsonl"))).mode & 0o077, 0);

    const applied = run(directory, [...args, "--apply"]);
    assert.equal(applied.status, 0, applied.stderr);
    assert.equal(JSON.parse(applied.stdout).results.updated, 1);
    const requests = await jsonLines(join(directory, "requests.jsonl"));
    const writes = requests.filter(({ method }) => method !== "GET");
    assert.deepEqual(writes, [
      {
        method: "PATCH",
        path: "/api/v1/subscribers/12",
        body: { custom_fields: { 1: bundleOption } },
      },
    ]);
    assert.ok(
      requests
        .slice(requests.indexOf(writes[0]) + 1)
        .some(({ method, path }) => method === "GET" && path === writes[0].path),
      "CLI must read back the subscriber after updating"
    );
    for (const result of [preview, applied]) {
      assert.ok(!result.stdout.includes(email) && !result.stderr.includes(email));
      assert.ok(!result.stdout.includes(testKey) && !result.stderr.includes(testKey));
    }
  });
}
