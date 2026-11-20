import { setTimeout as delay } from "node:timers/promises";
import { isDeepStrictEqual } from "node:util";

const tiers = [
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
const tierKeys = ["1", "monolisatier"];
const groups = [1, 3];
const pageSize = 1000;
const maxAttempts = 3;
const positiveId = (value) => Number.isSafeInteger(value) && value > 0;
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const sortedGroups = (groups) => [...groups].sort((a, b) => a.group_id - b.group_id);

function validateSubscriber(record) {
  if (
    !isObject(record) ||
    !positiveId(record.id) ||
    typeof record.email !== "string" ||
    !record.email.trim() ||
    typeof record.status !== "string" ||
    !record.status ||
    typeof record.updated_at !== "string" ||
    !Number.isFinite(Date.parse(record.updated_at)) ||
    !isObject(record.custom_fields) ||
    !Array.isArray(record.groups) ||
    !record.groups.every((g) => isObject(g) && positiveId(g.group_id))
  ) {
    throw new Error("Invalid Mailrelay subscriber response.");
  }
  return record;
}

export function storedTier(subscriber, options) {
  const fields = subscriber.custom_fields;
  if (!isObject(fields)) throw new Error("Missing Mailrelay subscriber custom fields.");
  const labels = new Set();
  for (const key of tierKeys) {
    if (!Object.hasOwn(fields, key)) continue;
    const value = fields[key];
    if (value === null || value === "") {
      labels.add(null);
      continue;
    }
    const match = [...options].find(
      ([label, id]) => value === label || value === id || value === String(id)
    );
    if (!match) throw new Error(`Unrecognized Mailrelay tier on subscriber ${subscriber.id}.`);
    labels.add(match[0]);
  }
  if (labels.size > 1)
    throw new Error(`Conflicting Mailrelay tier on subscriber ${subscriber.id}.`);
  return labels.size ? [...labels][0] : null;
}

function unchangedFields(subscriber) {
  const { updated_at, custom_fields, groups, ...otherFields } = subscriber;
  return {
    ...otherFields,
    groups: sortedGroups(groups),
    custom_fields: Object.fromEntries(
      Object.entries(custom_fields).filter(([key]) => !tierKeys.includes(key))
    ),
  };
}

function retryDelay(header, now, attempt) {
  if (header && /^\d+$/.test(header)) return Number(header) * 1000;
  const date = header ? Date.parse(header) : NaN;
  return Number.isFinite(date) ? Math.max(0, date - now) : 1000 * 2 ** attempt;
}

export function createMailrelayClient({
  accountDomain,
  apiKey,
  fetchImpl = fetch,
  sleep = delay,
  now = Date.now,
  // Leave some of the account's request quota available to the checkout webhook.
  minIntervalMs = 1500,
  timeoutMs = 30000,
}) {
  if (
    typeof accountDomain !== "string" ||
    !/^[a-z\d.-]+\.[a-z\d-]+$/i.test(accountDomain) ||
    typeof apiKey !== "string" ||
    !apiKey.trim()
  ) {
    throw new Error("Mailrelay requires an account hostname and API key.");
  }
  let nextRequest = 0;
  let queue = Promise.resolve();

  // Serialize transport attempts to share rate limits, including Retry-After,
  // between overlapping callers. All URLs are constructed locally.
  function request(path, method = "GET", body) {
    const pending = queue.then(async () => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const wait = nextRequest - now();
        if (wait > 0) await sleep(wait);
        nextRequest = now() + minIntervalMs;
        let response;
        try {
          response = await fetchImpl(`https://${accountDomain}/api/v1/${path}`, {
            method,
            redirect: "error",
            cache: "no-store",
            signal: AbortSignal.timeout(timeoutMs),
            headers: {
              "X-AUTH-TOKEN": apiKey,
              "Content-Type": "application/json",
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
          });
          if (response.ok && method === "GET")
            return { data: await response.json(), headers: response.headers };
          await response.body?.cancel();
        } catch {
          if (method === "PATCH" || attempt === maxAttempts - 1) {
            throw new Error(`Mailrelay ${method} response unavailable.`);
          }
          nextRequest = Math.max(nextRequest, now() + retryDelay(null, now(), attempt));
          continue;
        }
        if (response.ok) return;
        if (response.status === 404 && method === "GET")
          return { missing: true, headers: response.headers };
        const transient =
          response.status === 429 || response.status === 408 || response.status >= 500;
        if (transient) {
          nextRequest = Math.max(
            nextRequest,
            now() + retryDelay(response.headers.get("Retry-After"), now(), attempt)
          );
          if (method === "GET" && attempt < maxAttempts - 1) continue;
        }
        throw Object.assign(new Error(`Mailrelay ${method} failed with HTTP ${response.status}.`), {
          status: response.status,
        });
      }
    });
    queue = pending.catch(() => {});
    return pending;
  }

  async function getTierField() {
    const { data } = await request("custom_fields/1");
    if (
      data?.id !== 1 ||
      data.field_type !== "select" ||
      data.tag_name !== "monolisatier" ||
      !Array.isArray(data.custom_field_options)
    )
      throw new Error("Expected Mailrelay monolisatier Select field 1.");
    const options = new Map();
    const ids = new Set();
    for (const item of data.custom_field_options) {
      if (
        !tiers.includes(item?.label) ||
        !positiveId(item.id) ||
        options.has(item.label) ||
        ids.has(item.id)
      ) {
        throw new Error("Unexpected or duplicate Mailrelay tier option.");
      }
      options.set(item.label, item.id);
      ids.add(item.id);
    }
    if (options.size !== tiers.length) throw new Error("Missing Mailrelay tier options.");
    return options;
  }

  async function listSubscribers() {
    const records = new Map();
    for (const group of groups) {
      let total = null;
      let count = 0;
      let lastId = 0;
      for (let page = 1; ; page++) {
        const query = new URLSearchParams({
          "q[groups_id_eq_any][]": String(group),
          "q[s]": "id",
          include_groups: "true",
          page: String(page),
          per_page: String(pageSize),
        });
        const { data, headers } = await request(`subscribers?${query}`);
        const header = headers.get("Total");
        if (
          !Array.isArray(data) ||
          header === null ||
          !/^\d+$/.test(header) ||
          !Number.isSafeInteger(Number(header)) ||
          (total !== null && Number(header) !== total)
        ) {
          throw new Error("Mailrelay group pagination changed or is incomplete.");
        }
        total = Number(header);
        for (const item of data) {
          validateSubscriber(item);
          const subscriber = { ...item, groups: sortedGroups(item.groups) };
          if (subscriber.id <= lastId || !subscriber.groups.some((g) => g.group_id === group)) {
            throw new Error("Mailrelay returned an unexpected subscriber for this group page.");
          }
          lastId = subscriber.id;
          const previous = records.get(subscriber.id);
          if (previous && !isDeepStrictEqual(previous, subscriber)) {
            throw new Error(`Mailrelay subscriber ${subscriber.id} changed between group reads.`);
          }
          records.set(subscriber.id, subscriber);
        }
        count += data.length;
        if (count === total) break;
        if (count > total || data.length === 0)
          throw new Error("Incomplete Mailrelay group pagination.");
      }
    }
    return [...records.values()];
  }

  async function getSubscriber(id) {
    if (!positiveId(id)) throw new Error("Invalid Mailrelay subscriber ID.");
    const { data, missing } = await request(`subscribers/${id}?include_groups=true`);
    if (missing) return null;
    const subscriber = validateSubscriber(data);
    if (subscriber.id !== id) throw new Error("Mailrelay returned the wrong subscriber.");
    return subscriber;
  }

  async function writeTier(subscriber, tier, options) {
    validateSubscriber(subscriber);
    if (!subscriber.groups.some((g) => groups.includes(g.group_id)))
      throw new Error("Subscriber is outside the backfill audience.");
    const optionId = options.get(tier);
    if (!positiveId(optionId)) throw new Error("Unknown Mailrelay tier option.");
    const originalTier = storedTier(subscriber, options);
    if (originalTier === tier) return subscriber;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let failure;
      try {
        await request(`subscribers/${subscriber.id}`, "PATCH", {
          custom_fields: { 1: optionId },
        });
      } catch (error) {
        if (error.status >= 400 && error.status < 500 && ![408, 429].includes(error.status))
          throw error;
        failure = error;
      }
      const saved = await getSubscriber(subscriber.id);
      if (!saved || !isDeepStrictEqual(unchangedFields(subscriber), unchangedFields(saved))) {
        throw new Error(`Mailrelay subscriber ${subscriber.id} changed during the tier update.`);
      }
      const actualTier = storedTier(saved, options);
      if (actualTier === tier) return saved;
      // Retry an explicitly rate-limited write only after verifying the same
      // record and revision. A timeout or server error has an uncertain result.
      if (
        failure?.status === 429 &&
        actualTier === originalTier &&
        subscriber.updated_at === saved.updated_at &&
        attempt < maxAttempts - 1
      )
        continue;
      throw (
        failure ??
        new Error(`Mailrelay tier write did not persist for subscriber ${subscriber.id}.`)
      );
    }
  }

  return { getTierField, listSubscribers, getSubscriber, writeTier };
}
