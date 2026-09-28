#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { tagEmailCampaignLinks } from "./campaign-links.mjs";

export function renderEmailHtml(markdown, inputPath) {
  const content = stripHeadmatter(markdown);
  const campaign = campaignFromHeadmatter(markdown);
  if (basename(dirname(inputPath)) === "drafts" && !campaign) {
    throw new Error("Planned emails in drafts/ must define all four UTM fields.");
  }
  const rendered = renderDocument(content, titleFromPath(inputPath));
  return campaign ? tagEmailCampaignLinks(rendered, campaign) : rendered;
}

export function buildEmailPreviewPayload(markdown, inputPath) {
  const headmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  if (!headmatter) throw new Error(`${inputPath} needs email front matter.`);
  const field = (name) =>
    headmatter.match(new RegExp(`^${name}:\\s*(.*?)\\s*$`, "m"))?.[1]?.trim();
  const subject = field("subject");
  const preheader = field("preheader");
  if (!subject || !preheader) {
    throw new Error(`${inputPath} needs a subject and preheader for preview.`);
  }
  return {
    schemaVersion: 1,
    title: field("title") || titleFromPath(inputPath),
    subject,
    preheader,
    html: renderEmailHtml(markdown, inputPath),
  };
}

async function main(argv = process.argv.slice(2)) {
  const inputPath = argv[0];
  if (!inputPath || argv.length > 2) {
    throw new Error("Usage: node scripts/markdown-email-to-html.mjs <input.md> [output.html]");
  }
  const outputPath = argv[1] || defaultOutputPath(inputPath);
  const markdown = await readFile(inputPath, "utf8");
  await writeFile(outputPath, renderEmailHtml(markdown, inputPath));
  console.log(`Wrote ${outputPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

function defaultOutputPath(path) {
  if (!path) {
    return undefined;
  }

  return join(dirname(path), `${basename(path, extname(path))}.html`);
}

function titleFromPath(path) {
  return basename(path, extname(path))
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function stripHeadmatter(markdown) {
  if (!markdown.startsWith("---\n")) {
    return markdown.trim();
  }

  const closing = markdown.indexOf("\n---", 4);

  if (closing === -1) {
    return markdown.trim();
  }

  const afterClosing = markdown.indexOf("\n", closing + 1);

  if (afterClosing === -1) {
    return "";
  }

  return markdown.slice(afterClosing + 1).trim();
}

function campaignFromHeadmatter(markdown) {
  const headmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  if (!headmatter) return null;
  const campaign = {};
  for (const field of ["source", "medium", "campaign", "content"]) {
    campaign[field] = headmatter.match(new RegExp(`^utm_${field}:\\s*(.*?)\\s*$`, "m"))?.[1];
  }
  if (Object.values(campaign).every((value) => value === undefined)) return null;
  return campaign;
}

function renderDocument(markdown, title) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin: 0; padding: 0; background: #ffffff; color: #111111; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.55;">
    <main style="max-width: 680px; margin: 0 auto; padding: 32px 20px;">
${renderBlocks(markdown)}
    </main>
  </body>
</html>
`;
}

function renderBlocks(markdown) {
  const blocks = [];
  const lines = markdown.split(/\r?\n/);
  let paragraph = [];
  let list = [];

  function flushParagraph() {
    if (paragraph.length === 0) {
      return;
    }

    const rendered = paragraph[0] === "--"
      ? paragraph.map(renderInline).join("<br>\n        ")
      : renderInline(paragraph.join(" "));

    blocks.push(`      <p>\n        ${rendered}\n      </p>`);
    paragraph = [];
  }

  function flushList() {
    if (list.length === 0) {
      return;
    }

    blocks.push(`      <ul>\n${list.map((item) => `        <li>${renderInline(item)}</li>`).join("\n")}\n      </ul>`);
    list = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (trimmed === "---") {
      flushParagraph();
      flushList();
      blocks.push('      <hr style="border: 0; border-top: 1px solid #dddddd; margin: 28px 0;">');
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push(`      <h2 style="font-size: 22px; line-height: 1.3; margin: 32px 0 12px;">${renderInline(trimmed.slice(3))}</h2>`);
      continue;
    }

    const image = trimmed.match(/^!\[([^\]]+)\]\((https:\/\/[^\s)]+)\)$/);
    if (image) {
      flushParagraph();
      flushList();
      const [, alt, source] = image;
      blocks.push(`      <img src="${escapeHtml(source)}" alt="${escapeHtml(alt)}" width="640" style="display: block; width: 100%; max-width: 640px; height: auto; margin: 20px 0; border: 1px solid #d8e3e9; border-radius: 6px;">`);
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph();
      list.push(trimmed.slice(2));
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();

  return blocks.join("\n\n");
}

function renderInline(text) {
  let rendered = escapeHtml(text);

  rendered = rendered.replace(/`([^`]+)`/g, "<code>$1</code>");
  rendered = rendered.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  rendered = rendered.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #005bd3;">$1</a>');

  return rendered;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
