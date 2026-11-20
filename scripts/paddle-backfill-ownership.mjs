// Production IDs and precedence match website/shared/product_ids.ts and
// website/utils/paddleTier.ts. Paddle's sandbox uses different product IDs.
const productTiers = new Map([
  ["578353", "v1"],
  ["638029", "v1"],
  ["638030", "v1"],
  ["580502", "v1"],
  ["798586", "v2"],
  ["798587", "v2"],
  ["798588", "v2"],
  ["765053", "commercial"],
  ["772304", "commercial"],
  ["772305", "commercial"],
  ["925533", "commercial"],
  ["925531", "v3_code"],
  ["926417", "v3_text"],
  ["925532", "v3_code_text"],
  ["661578", "trial"],
  ["925530", "trial"],
]);
const subscriptionProducts = new Set(["765053", "772304", "772305"]);
const liveSubscriptionStates = new Set(["active", "trialing", "past_due", "paused"]);
const oneTimeTypes = new Set([
  "product",
  "one_off",
  "one_time",
  "one_off_product",
  "one_time_product",
  "manual_invoice",
  "invoice",
]);

function* csvRows(source) {
  if (typeof source !== "string" || /[\u0000\uFFFD]/u.test(source)) {
    throw new Error("Expected a UTF-8 CSV text file.");
  }
  const input = source.replace(/^\uFEFF/, "");
  const headerLine = input
    .trimStart()
    .split(/[\r\n]/, 1)[0]
    .replace(/"(?:[^"]|"")*"/g, "");
  const delimiter =
    (headerLine.match(/;/g)?.length || 0) > (headerLine.match(/,/g)?.length || 0) ? ";" : ",";
  let fields = [];
  let field = "";
  let quoted = false;
  let closedQuote = false;
  for (let i = 0; i <= input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === undefined) throw new Error("Unterminated quoted CSV field.");
      if (char !== '"') field += char;
      else if (input[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        quoted = false;
        closedQuote = true;
      }
    } else if (char === delimiter) {
      fields.push(field.trim());
      field = "";
      closedQuote = false;
    } else if (char === undefined || char === "\r" || char === "\n") {
      if (fields.length || field.trim() || closedQuote) {
        fields.push(field.trim());
        yield fields;
      }
      if (char === "\r" && input[i + 1] === "\n") i++;
      fields = [];
      field = "";
      closedQuote = false;
    } else if (char === '"' && !field && !closedQuote) {
      quoted = true;
    } else if (closedQuote && /[ \t]/.test(char)) {
      continue;
    } else if (closedQuote || char === '"') {
      throw new Error("Unexpected character in a quoted CSV field.");
    } else {
      field += char;
    }
  }
}

function normalizeHeading(value) {
  return value.toLowerCase().replace(/[ _-]/g, "");
}

function* records(source, required, optional = [], aliasesOnly = false) {
  const rows = csvRows(source);
  const header = rows.next().value;
  if (!header) throw new Error("CSV is empty.");
  const headings = header.map(normalizeHeading);
  if (aliasesOnly && headings.length !== 2)
    throw new Error("Verified aliases CSV requires exactly two columns.");
  const columns = new Map();
  for (const label of [...required, ...optional]) {
    const heading = normalizeHeading(label);
    const index = headings.indexOf(heading);
    if (index < 0) {
      if (required.includes(label)) throw new Error(`CSV is missing the ${label} column.`);
    } else {
      if (headings.lastIndexOf(heading) !== index)
        throw new Error(`CSV contains duplicate ${label} columns.`);
      columns.set(label, index);
    }
  }
  let rowNumber = 1;
  for (const row of rows) {
    rowNumber++;
    if (row.length !== header.length)
      throw new Error(`CSV record ${rowNumber} has an unexpected number of columns.`);
    yield Object.fromEntries(Array.from(columns, ([label, index]) => [label, row[index]]));
  }
}

function normalizedEmail(input) {
  const email = typeof input === "string" ? input.trim().toLowerCase() : "";
  if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/u.test(email)) {
    throw new Error(
      "Missing or invalid email address. Reconcile the CSV before calculating ownership."
    );
  }
  return email;
}

function verifiedAddresses(aliasesCsv) {
  const aliases = new Map();
  if (aliasesCsv !== undefined) {
    for (const row of records(aliasesCsv, ["alias_email", "canonical_email"], [], true)) {
      const alias = normalizedEmail(row.alias_email);
      const canonical = normalizedEmail(row.canonical_email);
      if (aliases.has(alias) && aliases.get(alias) !== canonical)
        throw new Error("Conflicting verified alias mappings.");
      aliases.set(alias, canonical);
    }
  }
  function canonicalEmail(value) {
    let email = normalizedEmail(value);
    const visited = new Set();
    while (aliases.has(email) && aliases.get(email) !== email) {
      if (visited.has(email)) throw new Error("Cycle in verified alias mappings.");
      visited.add(email);
      email = aliases.get(email);
    }
    for (const alias of visited) aliases.set(alias, email);
    return email;
  }
  // Validate even unused mappings before the caller can start an import.
  for (const alias of aliases.keys()) canonicalEmail(alias);
  return canonicalEmail;
}

function token(value = "") {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function orderTier({ product, status, orderType, subscriptionStatus }) {
  if (status === "refunded" || status === "disputed") return "none";
  if (status !== "completed" && status !== "partially_refunded") return "unknown";
  if (subscriptionStatus === "deleted") return "none";
  if (orderType && !oneTimeTypes.has(orderType) && orderType !== "subscription") return "unknown";
  if (
    (orderType === "subscription" || subscriptionProducts.has(product) || subscriptionStatus) &&
    !liveSubscriptionStates.has(subscriptionStatus)
  ) {
    return "unknown";
  }
  return productTiers.get(product) ?? "unknown";
}

function highestTier(owned) {
  if (owned.has("commercial")) return "commercial";
  if (owned.has("unknown")) return "unknown";
  if (owned.has("v3_code_text") || (owned.has("v3_code") && owned.has("v3_text")))
    return "v3_code_text";
  for (const tier of ["v3_text", "v3_code", "v2", "v1", "trial"]) {
    if (owned.has(tier)) return tier;
  }
  return "none";
}

/**
 * Accepts the current order snapshot from Paddle Classic. Verified manual
 * invoices use the same columns with a distinct order ID and catalog product ID.
 * See https://www.paddle.com/help/manage/reporting/a-comprehensive-insight-into-the-transactions-report
 */
export function ownershipFromCsv(transactionsCsv, { aliasesCsv } = {}) {
  const canonicalEmail = verifiedAddresses(aliasesCsv);
  const orders = new Map();
  const ownership = new Map();
  for (const row of records(
    transactionsCsv,
    ["Customer Email", "Order ID", "Product ID", "Order Status"],
    ["Order Type", "Subscription Status"]
  )) {
    const owner = canonicalEmail(row["Customer Email"]);
    if (!ownership.has(owner)) ownership.set(owner, new Set());
    const id = row["Order ID"];
    if (!id) {
      ownership.get(owner).add("unknown");
      continue;
    }

    const facts = {
      product: row["Product ID"],
      status: token(row["Order Status"]),
      orderType: token(row["Order Type"]),
      subscriptionStatus: token(row["Subscription Status"]),
    };
    const existing = orders.get(id);
    if (!existing) {
      orders.set(id, { ...facts, owners: new Set([owner]), conflict: false });
      continue;
    }
    existing.owners.add(owner);
    // Each order has one current state. Complete a missing fact from another
    // copy of the same order, but never choose between contradictory snapshots.
    for (const [key, value] of Object.entries(facts)) {
      if (existing[key] && value && existing[key] !== value) existing.conflict = true;
      else if (value) existing[key] = value;
    }
  }
  if (!ownership.size)
    throw new Error("Transactions CSV contains no orders. Supply the complete ownership history.");
  for (const order of orders.values()) {
    const tier = order.conflict || order.owners.size !== 1 ? "unknown" : orderTier(order);
    for (const owner of order.owners) ownership.get(owner).add(tier);
  }
  const tiers = new Map(Array.from(ownership, ([owner, owned]) => [owner, highestTier(owned)]));
  return { tiers, canonicalEmail };
}
