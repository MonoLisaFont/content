import assert from "node:assert/strict";
import test from "node:test";
import { createMailrelayClient, storedTier } from "./mailrelay-backfill-client.mjs";

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
const options = new Map(labels.map((label, i) => [label, 10 + i]));
const field = {
  id: 1,
  field_type: "select",
  tag_name: "monolisatier",
  custom_field_options: [...options].map(([label, id]) => ({ label, id })),
};
const subscriber = {
  id: 7,
  email: "example@example.org",
  status: "active",
  updated_at: "2026-11-20T00:00:00Z",
  groups: [{ group_id: 1 }, { group_id: 3 }],
  unsubscribed: false,
  local_ban: false,
  custom_fields: { 4: "existing order" },
};
const saved = {
  ...subscriber,
  custom_fields: { ...subscriber.custom_fields, 1: String(options.get("v2")) },
};
const page = (records, total) => Response.json(records, { headers: { Total: String(total) } });

function setup(...responses) {
  const calls = [];
  const waits = [];
  let time = 0;
  const client = createMailrelayClient({
    accountDomain: "test.ipzmarketing.com",
    apiKey: "test",
    now: () => time,
    sleep: async (ms) => {
      waits.push(ms);
      time += ms;
    },
    fetchImpl: async (url, init) => {
      calls.push({ url: new URL(url), init });
      assert.ok(responses.length, "unexpected request");
      const result = responses.shift();
      if (result instanceof Error) throw result;
      return result;
    },
  });
  return { client, calls, waits };
}

test("checks the field, maps rendered and stored values, and rejects ambiguous tiers", async () => {
  const { client } = setup(Response.json(field));
  assert.deepEqual(await client.getTierField(), options);
  assert.equal(storedTier(subscriber, options), null);
  assert.equal(storedTier(saved, options), "v2");
  assert.equal(storedTier({ ...saved, custom_fields: { monolisatier: "v2" } }, options), "v2");
  for (const fields of [{ 1: "mystery" }, { 1: "", monolisatier: "v2" }]) {
    assert.throws(() => storedTier({ ...saved, custom_fields: fields }, options));
  }
  for (const overrides of [
    { field_type: "text" },
    { id: 2 },
    { tag_name: "somethingelse" },
    { custom_field_options: field.custom_field_options.slice(1) },
    {
      custom_field_options: [...field.custom_field_options, field.custom_field_options[0]],
    },
  ])
    await assert.rejects(setup(Response.json({ ...field, ...overrides })).client.getTierField());
});

test("paginates both groups, merges overlapping records once, and enforces pacing", async () => {
  const other = { ...subscriber, id: 10, groups: [{ group_id: 1 }] };
  const { client, calls, waits } = setup(
    page([subscriber], 2),
    page([other], 2),
    page([{ ...subscriber, groups: [...subscriber.groups].reverse() }], 1)
  );
  assert.deepEqual(await client.listSubscribers(), [subscriber, other]);
  assert.deepEqual(
    calls.map(({ url }) => [
      url.searchParams.get("q[groups_id_eq_any][]"),
      url.searchParams.get("page"),
      url.searchParams.get("include_groups"),
    ]),
    [
      ["1", "1", "true"],
      ["1", "2", "true"],
      ["3", "1", "true"],
    ]
  );
  assert.deepEqual(waits, [1500, 1500]);
  for (const pages of [
    [page([subscriber], 1), page([{ ...subscriber, status: "inactive" }], 1)],
    [page([subscriber], 1), page([{ ...subscriber, groups: [{ group_id: 3 }] }], 1)],
    [page([subscriber], 2), page([], 2)],
    [page([subscriber], 2), page([subscriber], 2)],
    [page([subscriber], 2), page([other], 3)],
  ])
    await assert.rejects(setup(...pages).client.listSubscribers());
});

test("reads retry transient failures, honor Retry-After, and distinguish missing records", async () => {
  const { client, waits } = setup(
    new Error("timeout"),
    new Response(null, { status: 429, headers: { "Retry-After": "12" } }),
    Response.json(subscriber)
  );
  assert.deepEqual(await client.getSubscriber(7), subscriber);
  assert.deepEqual(waits, [1500, 12000]);
  assert.equal(await setup(new Response(null, { status: 404 })).client.getSubscriber(7), null);
  await assert.rejects(setup(Response.json(null)).client.getSubscriber(7));
  await assert.rejects(setup(Response.json({ ...subscriber, id: 8 })).client.getSubscriber(7));
});

test("writes only the numeric option, targets an existing subscriber and verifies the saved record", async () => {
  const { client, calls } = setup(new Response(null, { status: 204 }), Response.json(saved));
  assert.deepEqual(await client.writeTier(subscriber, "v2", options), saved);
  assert.deepEqual(
    calls.map(({ init, url }) => [init.method, url.pathname, init.redirect]),
    [
      ["PATCH", "/api/v1/subscribers/7", "error"],
      ["GET", "/api/v1/subscribers/7", "error"],
    ]
  );
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    custom_fields: { 1: options.get("v2") },
  });
  for (const record of [
    subscriber,
    { ...saved, custom_fields: { 1: "v2" } },
    { ...saved, groups: [] },
    { ...saved, local_ban: true },
    { ...saved, name: "changed" },
  ]) {
    await assert.rejects(
      setup(Response.json({}), Response.json(record)).client.writeTier(subscriber, "v2", options)
    );
  }
  await assert.rejects(
    setup().client.writeTier({ ...subscriber, groups: [{ group_id: 5 }] }, "v2", options)
  );
});

test("verifies an ambiguous write and never blindly replays it", async () => {
  const committed = setup(new Error("timeout"), Response.json(saved));
  assert.deepEqual(await committed.client.writeTier(subscriber, "v2", options), saved);
  const unchanged = setup(new Response(null, { status: 503 }), Response.json(subscriber));
  await assert.rejects(unchanged.client.writeTier(subscriber, "v2", options), /503/);
  assert.deepEqual(
    unchanged.calls.map(({ init }) => init.method),
    ["PATCH", "GET"]
  );
});

test("retries an explicit rate limit after a fresh revision check", async () => {
  const limited = () => new Response(null, { status: 429, headers: { "Retry-After": "10" } });
  const { client, calls, waits } = setup(
    limited(),
    Response.json(subscriber),
    Response.json({}),
    Response.json(saved)
  );
  assert.deepEqual(await client.writeTier(subscriber, "v2", options), saved);
  assert.deepEqual(
    calls.map(({ init }) => init.method),
    ["PATCH", "GET", "PATCH", "GET"]
  );
  assert.equal(waits[0], 10000);
  const moved = setup(
    limited(),
    Response.json({ ...subscriber, updated_at: "2026-11-21T00:00:00Z" })
  );
  await assert.rejects(moved.client.writeTier(subscriber, "v2", options), /429/);
  assert.equal(moved.calls.length, 2);
});
