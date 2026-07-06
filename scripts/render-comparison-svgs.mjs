#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const configPath = process.argv[2] || "scripts/comparison-fonts.local.json";
const fallbackConfigPath = "scripts/comparison-fonts.json";
const config = JSON.parse(
  readFileSync(existsSync(configPath) ? configPath : fallbackConfigPath, "utf8"),
);

const mono = config.fonts.monolisa;
const outputDir = path.resolve(root, config.outputDir || "images");
mkdirSync(outputDir, { recursive: true });

const samples = {
  texture: {
    title: "Code Texture",
    fontSize: 34,
    lineHeight: 54,
    features: "kern=1,liga=1,calt=1",
    lines: [
      "function parseToken(input, offset = 0) {",
      "  const next = input[offset + 1] ?? \"\";",
      "  if (next !== \"\" && input.length >= offset) {",
      "    return { kind: \"operator\", value: input.slice(offset) };",
      "  }",
      "  return null;",
      "}",
    ],
  },
  glyphs: {
    title: "Ambiguous Glyphs",
    fontSize: 44,
    lineHeight: 66,
    features: "kern=1,liga=0,calt=0",
    lines: [
      "0O o0 1lI| !iI []{}()",
      "<> <= >= == === != !==",
      "rn m vv w ' \" ` , . : ;",
      "/ \\ - _ + * # @ &",
    ],
  },
  ligatures: {
    title: "Coding Ligatures",
    fontSize: 42,
    lineHeight: 64,
    features: "kern=1,liga=1,calt=1",
    lines: [
      "a !== b && c <= d || e >= f",
      "value -> next => result <- input",
      "x === y ? foo::bar : baz...",
    ],
  },
  italics: {
    title: "Italic Forms",
    fontSize: 42,
    lineHeight: 64,
    style: "italic",
    features: "kern=1,liga=1,calt=1",
    lines: [
      "const emphasis = readableIdentifier;",
      "if (quickFix !== null) return quickFix;",
      "alpha beta gamma delta epsilon",
    ],
  },
  terminal: {
    title: "Terminal Symbols",
    fontSize: 34,
    lineHeight: 54,
    features: "kern=1,liga=0,calt=0",
    lines: [
      "main \uE0B0 feature/render-fonts \uE0B0 npm test",
      "+ added: src/render.ts",
      "- removed: tmp/cache.json",
      "┌────────┬────────┬────────┐",
      "│ status │ tests  │ build  │",
      "└────────┴────────┴────────┘",
    ],
  },
};

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function fontPath(font, sample) {
  if (sample.style === "italic" && font.italic && existsSync(path.resolve(root, font.italic))) {
    return font.italic;
  }
  return font.regular;
}

function variations(font, sample) {
  if (sample.style === "italic" && font.italicVariations) return font.italicVariations;
  return font.variations;
}

function features(font, sample) {
  if (font === mono && sample.features.includes("liga=1")) {
    return `${sample.features},dlig=1`;
  }
  return sample.features;
}

function renderLine(font, sample, line, prefix) {
  const file = fontPath(font, sample);
  const resolved = path.resolve(root, file || "");
  if (!file || !existsSync(resolved)) {
    throw new Error(`Missing font file for ${font.label}: ${file || "(not configured)"}`);
  }

  const args = [
    "--output-format=svg",
    `--font-size=${sample.fontSize}`,
    `--features=${features(font, sample)}`,
  ];
  const variationSettings = variations(font, sample);
  if (variationSettings) args.push(`--variations=${variationSettings}`);
  args.push("--", resolved, line);

  const result = spawnSync("hb-view", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || `hb-view failed for ${font.label}`);
  }

  return normalizeFragment(result.stdout, prefix);
}

function normalizeFragment(svg, prefix) {
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1] || "0 0 100 100";
  const [, , width, height] = viewBox.split(/\s+/).map(Number);
  let inner = svg
    .replace(/<\?xml[^>]*>\s*/g, "")
    .replace(/<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .replace(/<rect[^>]*>\s*/g, "");

  inner = inner
    .replace(/id="([^"]+)"/g, `id="${prefix}-$1"`)
    .replace(/xlink:href="#([^"]+)"/g, `xlink:href="#${prefix}-$1"`)
    .replace(/(?<!xlink:)href="#([^"]+)"/g, `href="#${prefix}-$1"`)
    .replace(/fill="rgb\(0%, 0%, 0%\)"/g, 'fill="var(--icon-primary, currentColor)"')
    .replace(/fill-opacity="1"/g, "")
    .replace(/fill="rgb\(100%, 100%, 100%\)"/g, 'fill="none"');

  return { width, height, inner };
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderSample(competitorKey, sampleKey, sample) {
  const competitor = config.fonts[competitorKey];
  if (!competitor) throw new Error(`Unknown comparison font: ${competitorKey}`);

  const margin = 52;
  const gutter = 48;
  const labelHeight = 76;
  const colWidth = 700;
  const targetLineWidth = 640;
  const fragments = [];
  const renderedLines = [];

  for (const [columnIndex, font] of [mono, competitor].entries()) {
    for (const [lineIndex, line] of sample.lines.entries()) {
      const prefix = `${competitorKey}-${sampleKey}-${columnIndex}-${lineIndex}`;
      renderedLines.push({
        columnIndex,
        lineIndex,
        fragment: renderLine(font, sample, line, prefix),
      });
    }
  }

  const scale = Math.min(
    1,
    targetLineWidth / Math.max(...renderedLines.map(({ fragment }) => fragment.width)),
  );
  const lineStep = sample.lineHeight * scale;
  const panelHeight = labelHeight + sample.lines.length * lineStep + margin;
  const width = margin * 2 + colWidth * 2 + gutter;
  const height = Math.ceil(panelHeight + margin + 72);

  for (const [columnIndex, font] of [mono, competitor].entries()) {
    const x = margin + columnIndex * (colWidth + gutter);
    fragments.push(`
      <text x="${x}" y="${margin}" class="label">${esc(font.label)}</text>`);

    renderedLines
      .filter((renderedLine) => renderedLine.columnIndex === columnIndex)
      .forEach(({ lineIndex, fragment }) => {
      const y = margin + labelHeight + lineIndex * lineStep;
      fragments.push(`
      <g transform="translate(${x}, ${y}) scale(${scale})">
        ${fragment.inner}
      </g>`);
      });
  }

  const title = `${sample.title}: MonoLisa vs. ${competitor.label}`;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="var(--icon-primary, currentColor)" style="fill-rule:nonzero;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
  <title>${esc(title)}</title>
  <style>
    .label {
      fill: var(--icon-secondary, currentColor);
      font: 600 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0;
    }
    .rule {
      stroke: var(--icon-secondary, currentColor);
      stroke-opacity: 0.35;
      stroke-width: 2;
    }
  </style>
  <line class="rule" x1="${margin + colWidth + gutter / 2}" y1="${margin - 20}" x2="${margin + colWidth + gutter / 2}" y2="${height - margin}" />
  ${fragments.join("\n")}
</svg>
`;

  const outputPath = path.join(outputDir, `comparison-monolisa-vs-${competitorKey}-${sampleKey}.svg`);
  writeFileSync(outputPath, svg);
  return outputPath;
}

const requested = process.argv.slice(3);
const comparisons = requested.length ? requested : config.comparisons;
let rendered = 0;

if (!existsSync(path.resolve(root, mono.regular))) {
  fail(`Missing MonoLisa regular font: ${mono.regular}`);
  process.exit(1);
}

for (const competitorKey of comparisons) {
  for (const [sampleKey, sample] of Object.entries(samples)) {
    try {
      const outputPath = renderSample(competitorKey, sampleKey, sample);
      console.log(path.relative(root, outputPath));
      rendered += 1;
    } catch (error) {
      console.warn(`Skipped ${competitorKey}/${sampleKey}: ${error.message}`);
    }
  }
}

if (rendered === 0) {
  fail("No SVGs rendered. Add font files under .font-sources/ or update scripts/comparison-fonts.local.json.");
}
