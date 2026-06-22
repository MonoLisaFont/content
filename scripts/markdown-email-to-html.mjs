#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";

const inputPath = process.argv[2];
const outputPath = process.argv[3] || defaultOutputPath(inputPath);

if (!inputPath) {
  console.error("Usage: node scripts/markdown-email-to-html.mjs <input.md> [output.html]");
  process.exit(1);
}

const markdown = await readFile(inputPath, "utf8");
const content = stripHeadmatter(markdown);
const html = renderDocument(content, titleFromPath(inputPath));

await writeFile(outputPath, html);
console.log(`Wrote ${outputPath}`);

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
