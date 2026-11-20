import assert from "node:assert/strict";
import test from "node:test";

import { ownershipFromCsv } from "./paddle-backfill-ownership.mjs";

const header = "Order ID,Order Status,Order Type,Product ID,Customer Email,Subscription Status";
const buyer = "buyer@example.test";
const csv = (...rows) => [header, ...rows].join("\r\n");
const row = (id, product, status = "completed", type = "", subscription = "", email = buyer) =>
  [id, status, type, product, email, subscription].join(",");
const tier = (...rows) => ownershipFromCsv(csv(...rows)).tiers.get(buyer);

test("uses the catalog product ID and current order status, including free upgrades and both trial products", () => {
  const expected = new Map([
    ["v1", [578353, 638029, 638030, 580502]],
    ["v2", [798586, 798587, 798588]],
    ["v3_code", [925531]],
    ["v3_text", [926417]],
    ["v3_code_text", [925532]],
    ["commercial", [925533]],
    ["trial", [661578, 925530]],
  ]);
  for (const [value, ids] of expected) {
    for (const id of ids) assert.equal(tier(row("001", id)), value);
  }
  const source =
    '\uFEFF"Payment Status";Order ID;Product;Product ID;Order Status;Customer Email;Sale Gross;Notes\r\n' +
    'failed;0001;Text;925531;completed; BUYER@Example.Test ;0;"a ""quoted"" note;\r\non two lines"';
  assert.equal(ownershipFromCsv(source).tiers.get(buyer), "v3_code");
});

test("uses only remaining active licenses after full or partial refunds and disputes", () => {
  assert.equal(tier(row("1", 925531), row("2", 926417, "Partially Refunded")), "v3_code_text");
  assert.equal(tier(row("1", 925531), row("2", 926417, "refunded")), "v3_code");
  assert.equal(tier(row("1", 925530), row("2", 925531, "disputed")), "trial");
  assert.equal(tier(row("1", 925531, "disputed"), row("2", 926417, "refunded")), "none");
  assert.equal(tier(row("1", 798588), row("2", 926417)), "v3_text");
});

test("combines separate orders for one buyer in the Paddle Classic Transactions export layout", () => {
  const exportHeader = '"Order ID","Order Status","Order Type","Product ID","Product Name","Product Taxable Category","Customer Email","Customer Country","Customer Zip Code","Coupon Applied",Quantity,Total,Tax,Fee,Currency,"Balance Earnings","Balance Currency",Source,Checkout,Date,"User Subscription ID"';
  const creator = '101,Completed,product,925533,"MonoLisa - Creator v3",standard,buyer@example.test,PT,,,1,0.00,0.00,0.00,EUR,,,"monolisa.dev / monolisa.dev",example-checkout-1,"2026-11-20 12:29:59",';
  const code = '102,Completed,product,925531,"MonoLisa - Developer v3",standard,buyer@example.test,PT,,,1,0.00,0.00,0.00,EUR,,,"monolisa.dev / monolisa.dev",example-checkout-2,"2026-11-20 12:30:00",';
  for (const [orders, expected] of [
    [[creator], "commercial"],
    [[creator, code], "commercial"],
    [[creator.replace(",Completed,", ",Refunded,"), code], "v3_code"],
  ]) {
    const { tiers } = ownershipFromCsv([exportHeader, ...orders].join("\r\n"));
    assert.deepEqual([...tiers], [[buyer, expected]]);
  }
});

test("counts commercial subscriptions with confirmed current state and reconciled manual invoices", () => {
  for (const id of [765053, 772304, 772305]) {
    assert.equal(tier(row("1", id)), "unknown");
    assert.equal(
      tier(row("1", id, "completed", "subscription", "deleted"), row("2", 798586)),
      "v2"
    );
    for (const state of ["active", "past_due", "trialing", "paused"]) {
      assert.equal(
        tier(row("1", id, "completed", "subscription", state), row("2", 925532)),
        "commercial"
      );
    }
  }
  assert.equal(
    tier(row("manual-invoice-2026-01", 925533, "completed", "manual invoice")),
    "commercial"
  );
  assert.equal(tier(row("1", 925531, "completed", "subscription")), "unknown");
  assert.equal(tier(row("1", 765053, "completed", "subscription", "unverified")), "unknown");
});

test("unresolved orders take precedence over personal tiers, with known commercial ownership definitive", () => {
  const unresolved = [
    row("x", "new-product"),
    row("", 925531),
    row("x", ""),
    row("x", 925531, ""),
    row("x", 925531, "processing"),
    row("x", 765053, "completed", "Subscription", ""),
  ];
  for (const disputed of unresolved) {
    assert.equal(tier(row("z", 798588), disputed), "unknown");
    assert.equal(tier(row("z", 925533), disputed), "commercial");
  }
  assert.equal(tier(row("x", 998877), row("x", 998877)), "unknown");
});

test("combines only explicitly verified addresses and keeps distinct order identifiers intact", () => {
  const aliasesCsv =
    "alias_email,canonical_email\nold@example.test,middle@example.test\nmiddle@example.test,news@example.test\nnews@example.test,news@example.test";
  const source = csv(
    row("21-101", 925531, "completed", "", "", "OLD@example.test"),
    row("21-102", 926417, "completed", "", "", "news@example.test"),
    row("23", 925530, "completed", "", "", "news+trial@example.test")
  );
  const { tiers, canonicalEmail } = ownershipFromCsv(source, { aliasesCsv });
  assert.deepEqual(
    [...tiers],
    [
      ["news@example.test", "v3_code_text"],
      ["news+trial@example.test", "trial"],
    ]
  );
  assert.equal(canonicalEmail(" Middle@Example.Test "), "news@example.test");
  assert.equal(canonicalEmail("unrelated@example.test"), "unrelated@example.test");
  assert.equal(ownershipFromCsv(source).tiers.get("old@example.test"), "v3_code");
  assert.equal(ownershipFromCsv(source).tiers.has("unrelated@example.test"), false);
});

test("collapses duplicate orders, holds contradictory snapshots and rejects implicit links between buyers", () => {
  const code = row("A", 925531);
  assert.equal(tier(code, code), "v3_code");
  assert.equal(tier(row("A", "", ""), code), "v3_code");
  for (const conflict of [row("A", 926417), row("A", 925531, "refunded")]) {
    assert.equal(tier(code, conflict), "unknown");
    assert.equal(tier(conflict, code), "unknown");
  }
  assert.equal(
    tier(
      row("A", 765053, "completed", "subscription", "active"),
      row("A", 765053, "completed", "subscription", "deleted")
    ),
    "unknown"
  );
  const twoBuyers = csv(code, row("A", 925531, "completed", "", "", "other@example.test"));
  assert.deepEqual([...ownershipFromCsv(twoBuyers).tiers.values()], ["unknown", "unknown"]);
  const aliasesCsv = `alias_email,canonical_email\nother@example.test,${buyer}`;
  assert.deepEqual([...ownershipFromCsv(twoBuyers, { aliasesCsv }).tiers], [[buyer, "v3_code"]]);
});

test("prevents empty reports, unrelated schemas, invalid addresses or malformed records from assigning absence", () => {
  for (const source of [
    "",
    "\n",
    csv(),
    csv(",,,,,"),
    csv(row("1", 925531, "completed", "", "", "bad address")),
    csv("1,completed,product,925531"),
    csv(`1,completed,"product,925531,${buyer},`),
    csv(`1,completed,"pro"duct,925531,${buyer},`),
    csv(row("1", 925531)).replace("Product ID", "Product"),
    csv(row("1", 925531)).replace("Order Status", "Payment Status"),
    csv(row("1", 925531)).replace("Subscription Status", "Order_Status"),
    "\u0000" + csv(row("1", 925531)),
  ]) {
    assert.throws(() => ownershipFromCsv(source));
  }
});

test("rejects invalid and contradictory verified aliases even when the export has no matching order", () => {
  const transactions = csv(row("1", 925531));
  const aliasesHeader = "alias_email,canonical_email\n";
  for (const aliasesCsv of [
    "alias_email,unverified_email\na@example.test,b@example.test",
    "alias_email,canonical_email,notes\na@example.test,b@example.test,note",
    aliasesHeader + "a@example.test,b@example.test\na@example.test,c@example.test",
    aliasesHeader + "a@example.test,b@example.test\nb@example.test,a@example.test",
    aliasesHeader + "invalid,b@example.test",
  ])
    assert.throws(() => ownershipFromCsv(transactions, { aliasesCsv }));
});
