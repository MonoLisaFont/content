import { buildCampaignLink, isWebsiteCampaignUrl, tagEmailCampaignLinks } from "./campaign-links.mjs";
import { transformMarkdownOutsideCode } from "./publish-content-to-blob.mjs";

export function devToCampaign(slug) {
  return {
    source: "devto",
    medium: "syndication",
    campaign: "blog-syndication",
    content: slug.replaceAll("_", "-"),
  };
}

/** Tag website destinations in syndicated prose, leaving media and code alone. */
export function tagDevToMarkdownLinks(markdown, slug) {
  const campaign = devToCampaign(slug);
  return transformMarkdownOutsideCode(markdown, (prose) => {
    const taggedLinks = prose.replace(
      /(?<!!)\[([^\]\n]+)\](\(\s*<?)(https:\/\/[^\s)>]+)(>?)(?=\s*(?:"[^"]*"|'[^']*')?\s*\))/g,
      (match, label, opening, href, closing) => {
        let url;
        try {
          url = new URL(href);
        } catch {
          return match;
        }
        if (!isWebsiteCampaignUrl(url)) return match;
        return `[${label}]${opening}${buildCampaignLink(href, campaign)}${closing}`;
      },
    );
    return tagEmailCampaignLinks(taggedLinks, campaign);
  });
}
