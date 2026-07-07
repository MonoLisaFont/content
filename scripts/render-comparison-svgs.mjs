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
    fontSize: 44,
    lineHeight: 64,
    features: "kern=1,liga=1,calt=1",
    syntax: true,
    lines: [
      "function parseToken(input, offset = 0) {",
      "  const next = input[offset + 1] ?? \"\";",
      "",
      "  if (next !== \"\") {",
      "    if (offset < input.length) {",
      "      return {",
      "        kind: \"operator\",",
      "        value: input.slice(offset),",
      "      };",
      "    }",
      "  }",
      "",
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

function renderLine(font, sample, line, prefix, fill = "var(--icon-primary, currentColor)") {
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

  return normalizeFragment(result.stdout, prefix, fill);
}

function normalizeFragment(svg, prefix, fill) {
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
    .replace(/fill="rgb\(0%, 0%, 0%\)"/g, `fill="${fill}"`)
    .replace(/fill-opacity="1"/g, "")
    .replace(/fill="rgb\(100%, 100%, 100%\)"/g, 'fill="none"');

  return { width, height, advanceWidth: Math.max(0, width - 32), inner };
}

const syntaxFills = {
  keyword: "var(--comparison-syntax-keyword, var(--icon-secondary, #f4cc50))",
  function: "var(--comparison-syntax-function, #8dbdff)",
  property: "var(--comparison-syntax-property, #9fd7ff)",
  string: "var(--comparison-syntax-string, #f7d875)",
  number: "var(--comparison-syntax-number, #f2a66a)",
  operator: "var(--comparison-syntax-operator, #d8e7f7)",
  punctuation: "var(--comparison-syntax-punctuation, #7ea0b9)",
  identifier: "var(--comparison-syntax-identifier, var(--icon-primary, currentColor))",
  whitespace: "var(--comparison-syntax-identifier, var(--icon-primary, currentColor))",
};

function tokenizeCode(line) {
  const tokens = [];
  let index = 0;

  while (index < line.length) {
    const rest = line.slice(index);
    const match =
      rest.match(/^\s+/) ||
      rest.match(/^"(?:\\.|[^"])*"/) ||
      rest.match(/^(?:!==|===|=>|<=|>=|&&|\|\||\?\?|[=+<>?:.])/) ||
      rest.match(/^[{}()[\],;]/) ||
      rest.match(/^\d+(?:\.\d+)?/) ||
      rest.match(/^[A-Za-z_$][\w$]*/) ||
      rest.match(/^./);
    const value = match[0];
    const previous = tokens[tokens.length - 1];
    let type = "identifier";

    if (/^\s+$/.test(value)) {
      type = "whitespace";
    } else if (/^"/.test(value)) {
      type = "string";
    } else if (/^\d/.test(value)) {
      type = "number";
    } else if (/^(?:function|const|if|return|null)$/.test(value)) {
      type = "keyword";
    } else if (/^(?:parseToken|slice)$/.test(value)) {
      type = "function";
    } else if (/^(?:kind|value|length)$/.test(value) || previous?.value === ".") {
      type = "property";
    } else if (/^(?:!==|===|=>|<=|>=|&&|\|\||\?\?|[=+<>?:.])$/.test(value)) {
      type = "operator";
    } else if (/^[{}()[\],;]$/.test(value)) {
      type = "punctuation";
    }

    tokens.push({ value, type });
    index += value.length;
  }

  return tokens;
}

function renderCodeLine(font, sample, line, prefix) {
  if (line.length === 0) {
    return { width: 0, height: sample.fontSize, tokens: [] };
  }

  if (!sample.syntax) {
    const fragment = renderLine(font, sample, line, prefix);
    return {
      width: fragment.width,
      height: fragment.height,
      tokens: [{ x: 16, fragment }],
    };
  }

  let x = 0;
  const tokens = tokenizeCode(line).map((token, tokenIndex) => {
    const fragment = renderLine(
      font,
      sample,
      token.value,
      `${prefix}-${tokenIndex}`,
      syntaxFills[token.type] || syntaxFills.identifier,
    );
    const renderedToken = { x, fragment };
    x += fragment.advanceWidth;
    return renderedToken;
  });

  return {
    width: x,
    height: Math.max(...tokens.map(({ fragment }) => fragment.height)),
    tokens,
  };
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
  const labelHeight = 76;
  const fragments = [];
  const renderedLines = [];

  for (const [columnIndex, font] of [mono, competitor].entries()) {
    for (const [lineIndex, line] of sample.lines.entries()) {
      const prefix = `${competitorKey}-${sampleKey}-${columnIndex}-${lineIndex}`;
      renderedLines.push({
        columnIndex,
        lineIndex,
        line: renderCodeLine(font, sample, line, prefix),
      });
    }
  }

  const sampleLayout = sample.syntax
    ? { colWidth: 560, targetLineWidth: 530, gutter: 48 }
    : { colWidth: 700, targetLineWidth: 640, gutter: 48 };
  const colWidth = sampleLayout.colWidth;
  const targetLineWidth = sampleLayout.targetLineWidth;
  const gutter = sampleLayout.gutter;
  const scale = Math.min(
    1,
    targetLineWidth / Math.max(...renderedLines.map(({ line }) => line.width)),
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
      .forEach(({ lineIndex, line }) => {
      const y = margin + labelHeight + lineIndex * lineStep;
      const tokenFragments = line.tokens
        .map(({ x: tokenX, fragment }) => `
          <g transform="translate(${tokenX - 16}, 0)">
            ${fragment.inner}
          </g>`)
        .join("\n");
      fragments.push(`
      <g transform="translate(${x}, ${y}) scale(${scale})">
        ${tokenFragments}
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
