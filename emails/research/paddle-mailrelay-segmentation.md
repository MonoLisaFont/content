# Mailrelay ownership sync and Black Week 2026 segmentation

Keep **Customers (group 1)** and **Prospects (group 3)** as separate Mailrelay lists. A subscriber in either list has one `monolisatier` field, including when they belong to both lists. The backfill uses Juho’s Paddle Classic Transactions CSV for historical ownership. The website’s signed Paddle webhook maintains the field on purchases and refunds once deployed. The field determines which Black Week draft a subscriber receives. [Website issue #1185](https://github.com/MonoLisaFont/website/issues/1185)

## Which value to store

Under **Subscribers → Custom fields**, **MonoLisa tier** is Select field ID `1` with tag name `monolisatier`, a blank default and the options below. Calculate the value from all active orders associated with a person and write that value to each of their verified subscriber records. [Custom field types](https://help.mailrelay.com/en/support/solutions/articles/103000425364) · [Select field and predefined options](https://apidocs.mailrelay.com/tag/custom-fields/POST/custom_fields)

Use the first matching row. For the personal upgrade emails, v1 and v2 each have one value because all editions of that version receive the same draft. Where someone owns both versions, use v2 for the email. My Orders determines the actual offer from the individual orders. It treats Code and Text as complementary families and Creator as a separate commercial license. Giving commercial ownership precedence here keeps mixed personal/commercial owners out of this campaign. [Website upgrade rules](../../../website/shared/canUpgrade.ts) · [Production product IDs](../../../website/shared/product_ids.ts)

| `monolisatier` value | Ownership from active Paddle Classic orders | Black Week email |
| --- | --- | --- |
| `unknown` | Ownership still needs verification | [General Black Week offer](../drafts/black-week-2026-trial.md) if eligible under the fallback rule below |
| `commercial` | Creator `925533` or active Indie, Company or Enterprise subscription (`765053`, `772304`, `772305`) | None |
| `v3_code_text` | Developer + Text bundle `925532`, or both standalone Code `925531` and Text `926417` | None |
| `v3_text` | Standalone v3 Text `926417` only among the v3 families | None |
| `v3_code` | Standalone v3 Developer Code `925531` only among the v3 families | [Add Text to Code](../drafts/black-week-2026-v3-code.md) |
| `v2` | Basic `798586`, Plus `798587`, or Complete `798588` | [Upgrade from v2](../drafts/black-week-2026-v2.md) |
| `v1` | Personal `578353`, Plus `638029`, Plus Upgrade `638030`, or Professional `580502` | [Upgrade from v1](../drafts/black-week-2026-v1.md) |
| `trial` | Current Trial `925530` or legacy Trial `661578` only | [General Black Week offer](../drafts/black-week-2026-trial.md) |
| `none` | Reconciliation found no active license or trial | [General Black Week offer](../drafts/black-week-2026-trial.md) |

## 1. Backfill existing subscribers from the Paddle CSV

**Prepare a complete all-time export.** Include every product, order status, zero-value trial and free upgrade. The script reads `Order ID`, `Customer Email`, `Product ID` and `Order Status`. Use the UTC time the export covers as the cutoff. A filtered export can assign `none` to an owner it omits. Paddle keeps refund events in a separate report and excludes manual invoices. Reconcile refunds by order ID and include known manual invoices as additional rows with unique order IDs and their verified product IDs. Supply an optional `Subscription Status` column with the current Paddle state for subscription orders. Missing subscription evidence yields `unknown`. [Paddle Classic Transactions report](https://www.paddle.com/help/manage/reporting/a-comprehensive-insight-into-the-transactions-report) · [Refunds report](https://www.paddle.com/help/manage/reporting/understanding-the-refunds-report)

**Preview from the repository root.** Set `MAILRELAY_ACCOUNT_DOMAIN` and `MAILRELAY_API_KEY` in your environment or in the ignored `.env.private`. Use `--env-file PATH` for another credentials file. Replace the paths and timestamp below with the actual export and its cutoff.

```sh
npm run backfill:mailrelay-tiers -- \
  --transactions /private/path/transactions.csv \
  --cutoff 2026-11-20T09:00:00Z \
  --report /private/path/tier-preview.jsonl
```

The preview reads both groups, counts overlapping subscriber IDs once, and prints aggregate results. The optional report contains addresses, prior and proposed tiers, outcomes, and unmatched Paddle buyers. Use a new report path outside Git for each run. Matching uses trimmed, lowercased addresses. To combine verified accounts, add `--aliases /private/path/aliases.csv` with columns `alias_email,canonical_email`. An alias can contribute an order even if only the canonical address subscribes.

**Apply the reviewed changes.** Repeat the command with the same inputs, a fresh report path and `--apply`. The script rereads eligibility and the current tier, writes only the tier field on the subscriber ID, then verifies the result, groups, consent, suppressions and unrelated custom fields. It spaces API requests 1.5 seconds apart, allowing up to about 800 changed subscribers per hour. If verification fails, inspect the reported subscriber before resuming. A rerun skips tiers already in place. Buyers outside both lists receive no update. [Mailrelay subscriber API](https://apidocs.mailrelay.com/tag/subscribers/PATCH/subscribers/%7Bid%7D)

**Reconcile exceptions before freezing the roster.** Review ambiguous addresses, records updated at or after the cutoff, and existing known tiers that conflict with incomplete Paddle evidence. After the run, recompute current ownership for buyers with purchases or refunds since the cutoff, including refunds of older orders. Mailrelay can change between the last read and the write. Use the time of the purchase or refund event for catch-up. [Webhook rollout](https://github.com/MonoLisaFont/website/pull/1190)

## 2. Keep the tier current from the website webhook

On a verified production checkout, including a free Trial or upgrade, look up the subscriber by exact email and check membership in either group 1 or group 3. Write the tier once per matching subscriber regardless of the checkout’s `marketing_consent` value. For example, someone in group 3 who buys Code with the checkbox empty stays in group 3 and gets `v3_code`. A subscriber already in both groups keeps both memberships. If checkout consent enrolls someone in group 1 through the existing flow, complete enrollment before updating their tier. Otherwise skip absent subscribers and those outside the two lists. Tier updates preserve status, suppressions, groups and consent evidence. [Paddle webhook](../../../website/app/api/webhooks/paddle/route.ts) · [Existing exact-email lookup](../../../website/utils/mailrelaySignup.ts) · [Enrollment client](../../../website/utils/mailrelay.ts)

The backfill follows the webhook’s production product IDs and tier precedence. Buying Text after Code yields `v3_code_text`. Fully refunding Text returns that owner to `v3_code` if Code is their only remaining entitlement. The webhook reads all pages of the buyer’s order history and asks Paddle to retry transient failures. [Website tier webhook](https://github.com/MonoLisaFont/website/pull/1190)

The field-only PATCH was verified on a designated group 3 subscriber and the original blank tier restored. Reconcile before campaigns for disputes, missed events and buyers who subscribed after checkout. [Subscriber update](https://apidocs.mailrelay.com/tag/subscribers/PATCH/subscribers/%7Bid%7D)

## Decisions from website issue #1185

- **Field and segments.** Use groups 1 and 3 for the current newsletter audience. Issue #1185 identifies group 5 as a separate website welcome group. A group-5-only contact is outside this rollout. Within the two lists, `none` and `trial` identify known prospects. Paid owners have `v1`, `v2`, `v3_code`, `v3_text`, `v3_code_text` or `commercial`. An uncategorized subscriber keeps their original field value when receiving the general offer. [Mailrelay segment conditions](https://help.mailrelay.com/en/support/solutions/articles/103000156746-segmentations)
- **Refunds.** Use the remaining active licenses. A full refund of someone’s last paid order can return them to `trial` or `none`. A partial refund retains that order’s entitlement.
- **Privacy notice.** The published policy describes Paddle for online sales. It does not explicitly describe using license ownership to tailor newsletters. Suggested wording for the privacy review follows. “If you subscribe to the MonoLisa newsletter, we use the MonoLisa licenses you own to send relevant product and upgrade offers.” Consent evidence is tracked separately in #1168, and newsletter signup can proceed independently. [Published privacy policy](https://www.iubenda.com/privacy-policy/25140137/legal) · [Privacy review #1166](https://github.com/MonoLisaFont/website/pull/1166) · [Consent evidence #1168](https://github.com/MonoLisaFont/website/issues/1168)

## Verify and send once

Build four Black Week segments. All four require **(group 1 OR group 3) AND eligible for newsletter delivery**. The three owner emails each require an exact tier match (`v1`, `v2`, or `v3_code`). For the fourth email, use **Match any** for `trial`, `none`, `unknown`, or **Blank**. Combine the audience and tier conditions with **Match all**. Trial setup tips alone do not confer newsletter consent. [Mailrelay segment conditions](https://help.mailrelay.com/en/support/solutions/articles/103000156746-segmentations) · [Custom field filters](https://help.mailrelay.com/en/support/solutions/articles/103000236461-custom-fields-and-campaign-segmentation)

**Fallback rule.** Before freezing the roster, check uncategorized subscribers against available ownership matches and verified aliases. Where a match establishes a tier, update the field and use the draft or exclusion in the table. Hold conflicting identities or consent. The remaining eligible subscribers with an unknown or blank tier receive the same general offer as Trial users in a single delivery. It describes the public sale and links to the [buy page](https://www.monolisa.dev/buy), which anyone can open without an order number.

Keep one private campaign roster across both lists with one row per person, selected subscriber ID and address, frozen draft and delivery status. For verified aliases, prefer the designated newsletter address, then the latest explicit opt-in, then the lowest subscriber ID. Hold conflicting identities or consent. Someone in both groups who owns v2 appears once on the v2 delivery list. [Mailrelay sending guide](https://help.mailrelay.com/en/support/solutions/articles/103000424825)

- **Freeze the four delivery lists before the first send.** Save each segment as a static campaign group and reconcile its members to exactly the selected subscriber IDs on the roster. Remove alternate addresses. All six pairwise intersections must be empty by person key, subscriber ID and normalized address. The sum of group sizes must equal the number of distinct assigned people. Select only the corresponding static group when preparing each delivery. [Mailrelay segment and group behavior](https://help.mailrelay.com/en/support/solutions/articles/103000156746)
- **Spot-check overlaps.** Trial + v1 + v2 gets the v2 email. V2 + v3 Code gets the v3 Code email. Code + Text bought separately gets no email, including when a verified alias holds the second purchase. V2 + standalone v3 Text gets no email. A newsletter subscriber with only a legacy trial and an eligible subscriber with a blank tier both receive the general offer. A blank-tier subscriber in both groups receives it once. A trial-tips-only contact gets no email.
- **Recheck eligibility before each delivery.** Remove anyone who has unsubscribed or whose current ownership or consent no longer qualifies them for their assigned draft. Compare the final preview with the roster after suppressions. A Trial recipient who buys Code between sends stays out of the v3 Code delivery even though the ownership field now reads `v3_code`.
- **Reserve once across all four sends.** Use one sending operator and one roster for `black-week-2026`. At launch or restart, reconcile any existing Black Week deliveries under **Reports → Sent campaigns**. Before submitting each variant, reserve its recipients in the roster. Save the Mailrelay delivery ID when scheduling or queueing succeeds. Anyone already reserved, scheduled, queued or sent is ineligible for another delivery in this campaign.
- **Recover the original delivery on a retry.** After a timeout, pause or partial failure, look up the recorded delivery and resume it where possible. A replacement send may include only people confirmed never queued in any of the four deliveries. Hold uncertain rows and use delivery records to reconcile them. Opens and clicks cannot establish who was queued. [Sending and delivery reports](https://help.mailrelay.com/en/support/solutions/articles/103000424825)

## Future Text-only campaign

For a future offer to add Code, select newsletter subscribers where **MonoLisa tier** equals `v3_text`. Someone who owns v2 and standalone v3 Text belongs to this audience. Once they also buy v3 Code, their value becomes `v3_code_text` and they leave the Text-only segment. [My Orders upgrade paths](../../../website/shared/canUpgrade.ts)
