#!/usr/bin/env node

import { open, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import dotenv from "dotenv";
import { createMailrelayClient, storedTier } from "./mailrelay-backfill-client.mjs";
import { ownershipFromCsv } from "./paddle-backfill-ownership.mjs";

const usage = `Backfill MonoLisa ownership tiers for existing Mailrelay subscribers in groups 1 and 3.

npm run backfill:mailrelay-tiers -- --transactions <all-time.csv> --cutoff <timestamp> [options]

  --transactions FILE  Complete Paddle Classic Transactions CSV, including refunded orders
  --cutoff TIME        Export cutoff with time zone, for example 2026-11-20T09:00:00Z
  --aliases FILE       Optional CSV of verified alias_email,canonical_email links
  --env-file FILE      Mailrelay credentials (default .env.private or process environment)
  --report FILE        Write a new private JSON Lines report with subscriber-level results
  --apply              Write eligible changes. The default is a read-only preview.
  --help               Show this help
`;

function audienceOf(subscriber) {
  const groups = new Set(subscriber.groups.map(({ group_id }) => group_id));
  if (groups.has(1)) return groups.has(3) ? "both" : "customers";
  return groups.has(3) ? "prospects" : null;
}

export function parseCutoff(value, now = Date.now()) {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value ?? "")) {
    throw new Error("--cutoff requires an ISO timestamp with a time zone.");
  }
  const cutoff = Date.parse(value);
  const datePart = value.slice(0, 10);
  if (
    !Number.isFinite(cutoff) ||
    cutoff > now ||
    new Date(datePart).toISOString().slice(0, 10) !== datePart
  ) {
    throw new Error("--cutoff must be a valid export time in the past.");
  }
  return cutoff;
}

function increment(counts, key) {
  counts[key] = (counts[key] ?? 0) + 1;
}

function freshness(subscriber, cutoff) {
  const updated = Date.parse(subscriber.updated_at);
  if (!Number.isFinite(updated)) return "missing-update-time";
  if (updated >= cutoff) return "updated-since-cutoff";
  return null;
}

async function applyChange(row, client, options, cutoff) {
  const current = await client.getSubscriber(row.subscriberId);
  if (!current || current.email.trim().toLowerCase() !== row.email || !audienceOf(current)) {
    return "no-longer-eligible";
  }
  const latest = storedTier(current, options);
  if (latest === row.to) return "unchanged";
  if (latest !== row.from) return "tier-changed-since-preview";
  const hold = freshness(current, cutoff);
  if (hold) return hold;
  await client.writeTier(current, row.to, options);
  return "updated";
}

export async function backfillTiers({
  ownership,
  client,
  cutoff,
  apply = false,
  report = () => {},
  progress = () => {},
}) {
  const options = await client.getTierField();
  const subscribers = await client.listSubscribers();
  const seenEmails = new Set();
  const duplicateEmails = new Set();
  for (const subscriber of subscribers) {
    const email = subscriber.email.trim().toLowerCase();
    if (seenEmails.has(email)) duplicateEmails.add(email);
    seenEmails.add(email);
  }

  const matchedBuyers = new Set();
  const counts = {
    mode: apply ? "apply" : "preview",
    cutoff: new Date(cutoff).toISOString(),
    subscribers: 0,
    audiences: { customers: 0, prospects: 0, both: 0 },
    changesByTier: {},
    results: {},
    unmatchedPaddleBuyers: 0,
    unresolvedPaddleBuyers: 0,
  };
  // Validate the entire snapshot and calculate one decision per subscriber
  // before making the first write. The group scans are deduplicated by ID.
  const plan = subscribers.map((subscriber) => {
    const email = subscriber.email.trim().toLowerCase();
    const audience = audienceOf(subscriber);
    if (!audience) throw new Error("Mailrelay returned a subscriber outside groups 1 and 3.");
    const buyer = ownership.canonicalEmail(email);
    const matched = ownership.tiers.has(buyer);
    if (matched) matchedBuyers.add(buyer);
    const to = matched ? ownership.tiers.get(buyer) : "none";
    const from = storedTier(subscriber, options);
    let result;
    if (duplicateEmails.has(email)) result = "ambiguous-email";
    else if (from === to) result = "unchanged";
    else if (!matched && from && !["unknown", "none"].includes(from))
      result = "missing-buyer-history";
    else if (to === "unknown" && from && from !== "unknown") result = "unresolved-ownership";
    else result = freshness(subscriber, cutoff) ?? "planned";
    return { subscriberId: subscriber.id, email, audience, from, to, result };
  });

  for (const [buyer, tier] of ownership.tiers) {
    if (tier === "unknown") counts.unresolvedPaddleBuyers++;
    if (!matchedBuyers.has(buyer)) {
      counts.unmatchedPaddleBuyers++;
      await report({ result: "unmatched-paddle-buyer", email: buyer });
    }
  }
  for (const row of plan) {
    if (apply && row.result === "planned") {
      try {
        row.result = await applyChange(row, client, options, cutoff);
      } catch (error) {
        await report({ ...row, result: "failed" });
        throw new Error(
          `Stopped at Mailrelay subscriber ${row.subscriberId} after ${
            counts.results.updated ?? 0
          } verified updates. ${error.message}`
        );
      }
    }
    counts.subscribers++;
    increment(counts.audiences, row.audience);
    increment(counts.results, row.result);
    if (row.result === "updated" || row.result === "planned")
      increment(counts.changesByTier, row.to);
    await report(row);
    if (apply && counts.subscribers % 100 === 0) progress(counts.subscribers, plan.length);
  }
  return counts;
}

async function main() {
  const { values } = parseArgs({
    options: {
      transactions: { type: "string" },
      cutoff: { type: "string" },
      aliases: { type: "string" },
      "env-file": { type: "string" },
      report: { type: "string" },
      apply: { type: "boolean", default: false },
      help: { type: "boolean" },
    },
  });
  if (values.help) return console.log(usage);
  if (!values.transactions)
    throw new Error("Supply --transactions with a complete all-time Paddle export. See --help.");
  const cutoff = parseCutoff(values.cutoff);
  const [transactionsCsv, aliasesCsv] = await Promise.all([
    readFile(values.transactions, "utf8"),
    values.aliases ? readFile(values.aliases, "utf8") : undefined,
  ]);
  const ownership = ownershipFromCsv(transactionsCsv, { aliasesCsv });
  const env = dotenv.config({ path: values["env-file"] ?? ".env.private", quiet: true });
  if (values["env-file"] && env.error) throw env.error;
  const client = createMailrelayClient({
    accountDomain: process.env.MAILRELAY_ACCOUNT_DOMAIN,
    apiKey: process.env.MAILRELAY_API_KEY,
  });
  const file = values.report ? await open(values.report, "wx", 0o600) : null;
  try {
    const summary = await backfillTiers({
      ownership,
      client,
      cutoff,
      apply: values.apply,
      report: file ? (row) => file.writeFile(JSON.stringify(row) + "\n") : undefined,
      progress: (done, total) => console.error(`Processed ${done} of ${total} subscribers.`),
    });
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await file?.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
