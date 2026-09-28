import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";

const WEBSITE_ORIGINS = new Set([
  "https://www.monolisa.dev",
  "https://monolisa.dev",
]);
const REQUIRED_FIELDS = ["source", "medium", "campaign", "content"];

export function isWebsiteCampaignUrl(url) {
  return (
    url.protocol === "https:" &&
    WEBSITE_ORIGINS.has(url.origin) &&
    !url.username &&
    !url.password
  );
}

function validateCampaign(campaign) {
  for (const field of [...REQUIRED_FIELDS, "term"]) {
    const value = campaign[field];
    if (field === "term" && value === undefined) continue;
    if (
      typeof value !== "string" ||
      value.length > 200 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
    ) {
      throw new Error(
        `${field} must be a nonempty lowercase slug of at most 200 characters.`,
      );
    }
  }
}

/** Tag the final website destination, before an email provider wraps the link. */
export function buildCampaignLink(href, campaign) {
  validateCampaign(campaign);
  const url = new URL(href);
  if (!isWebsiteCampaignUrl(url))
    throw new Error(
      "Use an HTTPS MonoLisa website destination, not a tracking or external URL.",
    );
  for (const field of REQUIRED_FIELDS)
    url.searchParams.set(`utm_${field}`, campaign[field]);
  // Replacing a campaign must not leave the previous campaign's keyword behind.
  if (campaign.term === undefined) url.searchParams.delete("utm_term");
  else url.searchParams.set("utm_term", campaign.term);
  return url.toString();
}

/** Rewrite href attributes in repository-authored email markup; leave images alone. */
export function tagEmailCampaignLinks(markup, campaign) {
  validateCampaign(campaign);
  return markup.replace(
    /(\s)href\s*=\s*(['"])(.*?)\2/g,
    (attribute, space, quote, href) => {
      const decoded = href.replaceAll("&amp;", "&");
      let url;
      try {
        url = new URL(decoded);
      } catch {
        return attribute;
      }
      if (!isWebsiteCampaignUrl(url)) return attribute;
      const tagged = buildCampaignLink(decoded, campaign).replaceAll(
        "&",
        "&amp;",
      );
      return `${space}href=${quote}${tagged}${quote}`;
    },
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const { values, positionals } = parseArgs({
      allowPositionals: true,
      options: Object.fromEntries(
        [...REQUIRED_FIELDS, "term"].map((field) => [
          field,
          { type: "string" },
        ]),
      ),
    });
    if (positionals.length !== 1)
      throw new Error(
        "Pass one website destination followed by --source, --medium, --campaign and --content.",
      );
    console.log(buildCampaignLink(positionals[0], values));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
