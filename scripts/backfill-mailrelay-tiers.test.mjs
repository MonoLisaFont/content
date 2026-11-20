import assert from "node:assert/strict";
import test from "node:test";
import { backfillTiers, parseCutoff } from "./backfill-mailrelay-tiers.mjs";
import { ownershipFromCsv } from "./paddle-backfill-ownership.mjs";

const cutoff = parseCutoff("2025-10-01T00:00:00Z");
const csv = [
  "Order ID,Customer Email,Product ID,Order Status",
  "1,owner@example.com,925531,completed",
  "2,alias@example.com,926417,completed",
  "3,refund@example.com,925531,refunded",
  "4,unknown@example.com,123456,completed",
  "5,unmatched@example.com,925532,completed",
].join("\n");
const aliasesCsv = "alias_email,canonical_email\nalias@example.com,owner@example.com";
const ownership = ownershipFromCsv(csv, { aliasesCsv });
const options = new Map([
  ["unknown", 1],
  ["none", 2],
  ["v1", 3],
  ["v3_code", 4],
  ["v3_code_text", 5],
]);

function subscriber(id, email, current, extra = {}) {
  return {
    id,
    email: email + "@example.com",
    status: "active",
    updated_at: "2025-09-01T00:00:00Z",
    groups: [{ group_id: 3 }],
    custom_fields: current ? { 1: current } : {},
    ...extra,
  };
}

function setup(snapshot, fresh = snapshot) {
  const live = new Map(fresh.map((row) => [row.id, structuredClone(row)]));
  const writes = [];
  const rows = [];
  const client = {
    getTierField: async () => options,
    listSubscribers: async () => structuredClone(snapshot),
    getSubscriber: async (id) => live.get(id) ?? null,
    async writeTier(row, tier) {
      writes.push([row.id, tier]);
      row.custom_fields[1] = options.get(tier);
      row.updated_at = "2025-10-02T12:00:00Z";
    },
  };
  const run = (apply) =>
    backfillTiers({ client, cutoff, ownership, apply, report: (row) => rows.push(row) });
  return { run, rows, writes, live, client };
}

test("preview counts all three audiences and holds ambiguous or incomplete matches", async () => {
  const { run, rows, writes } = setup([
    subscriber(1, "owner", null, { groups: [{ group_id: 1 }, { group_id: 3 }] }),
    subscriber(2, "refund", "v3_code", { groups: [{ group_id: 1 }] }),
    subscriber(3, "new", null),
    subscriber(4, "unlisted-owner", "v1"),
    subscriber(5, "unknown", "v1"),
    subscriber(6, "duplicate", null),
    subscriber(7, "DUPLICATE", null),
    subscriber(8, "fresh", null, { updated_at: "2025-10-01T00:00:00Z" }),
  ]);
  const summary = await run(false);
  assert.deepEqual(writes, []);
  assert.deepEqual(summary.audiences, { customers: 1, prospects: 6, both: 1 });
  assert.deepEqual(summary.changesByTier, { v3_code_text: 1, none: 2 });
  assert.equal(summary.unresolvedPaddleBuyers, 1);
  assert.equal(summary.unmatchedPaddleBuyers, 1);
  assert.deepEqual(summary.results, {
    planned: 3,
    "missing-buyer-history": 1,
    "unresolved-ownership": 1,
    "ambiguous-email": 2,
    "updated-since-cutoff": 1,
  });
  assert.ok(
    rows.some(
      (row) => row.email === "unmatched@example.com" && row.result === "unmatched-paddle-buyer"
    )
  );
});

test("apply rechecks deleted, moved, renamed and concurrently updated subscribers", async () => {
  const snapshot = Array.from({ length: 7 }, (_, i) => subscriber(i + 1, "prospect" + i, null));
  const fresh = [
    { ...snapshot[1], groups: [{ group_id: 5 }] },
    { ...snapshot[2], email: "new-owner@example.com" },
    { ...snapshot[3], custom_fields: { 1: "v3_code" } },
    { ...snapshot[4], updated_at: "2025-10-02T00:00:00Z" },
    { ...snapshot[5], custom_fields: { 1: "none" } },
    snapshot[6],
  ];
  const { run, writes } = setup(snapshot, fresh);
  assert.deepEqual((await run(true)).results, {
    "no-longer-eligible": 3,
    "tier-changed-since-preview": 1,
    "updated-since-cutoff": 1,
    unchanged: 1,
    updated: 1,
  });
  assert.deepEqual(writes, [[7, "none"]]);
  await run(true);
  assert.deepEqual(writes, [[7, "none"]]);
});

test("a failed readback stops further writes and records the subscriber ID", async () => {
  const snapshot = [subscriber(1, "owner", null), subscriber(2, "refund", null)];
  const { run, client, rows, writes } = setup(snapshot);
  client.writeTier = async (record) => {
    writes.push(record.id);
    throw new Error("Write could not be verified.");
  };
  await assert.rejects(run(true), /subscriber 1 after 0 verified updates/);
  assert.deepEqual(writes, [1]);
  assert.equal(rows.at(-1).result, "failed");
});

test("cutoff requires a past date and explicit time zone", () => {
  assert.equal(parseCutoff("2025-09-30T19:00:00-05:00"), cutoff);
  for (const time of [
    undefined,
    "not a date",
    "2025-02-30T00:00:00Z",
    "2025-10-01T00:00:00",
    "2026-01-01T00:00:00Z",
  ]) {
    assert.throws(() => parseCutoff(time, cutoff), /cutoff/);
  }
});
