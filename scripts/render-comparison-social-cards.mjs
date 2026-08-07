#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const outputDir = path.resolve(root, "social_media/comparisons");
const coverage = JSON.parse(
  readFileSync(path.resolve(root, "01_ideas/comparison_language_coverage.json"), "utf8"),
);
const localConfigPath = path.resolve(root, "scripts/comparison-fonts.local.json");
const fallbackConfigPath = path.resolve(root, "scripts/comparison-fonts.json");
const fontConfig = JSON.parse(
  readFileSync(existsSync(localConfigPath) ? localConfigPath : fallbackConfigPath, "utf8"),
);

mkdirSync(outputDir, { recursive: true });

const monoLisaFont = resolveFont(fontConfig.fonts.monolisa.regular);
const monoLisaItalicFont = resolveOptionalFont(fontConfig.fonts.monolisa.italic) ?? monoLisaFont;
const comparisons = [
  { key: "fira-code", axes: "wght", italics: "No", ligatures: "Yes" },
  { key: "jetbrains-mono", axes: "wght", italics: "Yes", ligatures: "Yes" },
  { key: "cascadia-code", axes: "wght", italics: "Yes", ligatures: "Yes" },
  { key: "hack", axes: "None", italics: "Yes", ligatures: "No" },
  { key: "source-code-pro", axes: "Not measured", italics: "Yes", ligatures: "No" },
  { key: "ibm-plex-mono", axes: "Not measured", italics: "Yes", ligatures: "No" },
  { key: "monaspace", axes: "Not measured", italics: "Yes", ligatures: "Yes" },
  { key: "recursive-mono", axes: "5 axes", italics: "Yes", ligatures: "Yes" },
].map((comparison) => {
  const font = fontConfig.fonts[comparison.key];
  const measured = coverage.fonts[comparison.key];
  if (!font || !measured) throw new Error(`Missing data for ${comparison.key}`);

  return {
    ...comparison,
    label: measured.label,
    font: resolveFont(font.regular),
    italicFont: resolveOptionalFont(font.italic) ?? resolveFont(font.regular),
    languages: measured.totalLanguages,
    writingSystems: Object.keys(measured.scripts),
  };
});

const monoLisa = {
  label: "MonoLisa Code",
  languages: coverage.fonts.monolisa.totalLanguages,
  writingSystems: Object.keys(coverage.fonts.monolisa.scripts),
  axes: "wght + GRAD",
  italics: "Yes",
  ligatures: "Yes",
};

function resolveFont(value) {
  const resolved = path.resolve(root, value || "");
  if (!value || !existsSync(resolved)) throw new Error(`Missing font file: ${value || "(unset)"}`);
  return resolved;
}

function resolveOptionalFont(value) {
  if (!value) return null;
  const resolved = path.resolve(root, value);
  return existsSync(resolved) ? resolved : null;
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeFragment(svg, prefix, fill) {
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1] || "0 0 100 100";
  const [, , width] = viewBox.split(/\s+/).map(Number);
  const baselineY = Number(svg.match(/<use[^>]*\sy="([^"]+)"/)?.[1] || 0);
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

  return { width: Math.max(0, width - 32), baselineY, inner };
}

let textIndex = 0;
function text(value, x, y, options = {}) {
  const fontSize = options.fontSize ?? 28;
  const fill = options.fill ?? "#e8f3fb";
  const font = options.font ?? monoLisaFont;
  const anchor = options.anchor ?? "start";
  const features = ["kern=1", "liga=1", "calt=1", ...(options.features || [])].join(",");
  const args = [
    "--output-format=svg",
    `--font-size=${fontSize}`,
    `--features=${features}`,
  ];
  if (options.weight) args.push(`--variations=wght=${options.weight}`);
  args.push("--", font, String(value));

  const result = spawnSync("hb-view", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `hb-view failed for ${value}`);

  const prefix = `social-${textIndex++}`;
  const fragment = normalizeFragment(result.stdout, prefix, fill);
  const offset =
    anchor === "middle" ? fragment.width / 2 : anchor === "end" ? fragment.width : 0;

  return `
    <g transform="translate(${x - offset - 16} ${y - fragment.baselineY})">
      ${fragment.inner}
    </g>`;
}

function pill(value, x, y, options = {}) {
  const width = options.width ?? Math.max(118, value.length * 15 + 42);
  const height = options.height ?? 46;
  const fill = options.fill ?? "#26465f";
  const color = options.color ?? "#bcd7ea";
  return `
    <g transform="translate(${x} ${y})">
      <rect width="${width}" height="${height}" rx="${height / 2}" fill="${fill}"/>
      ${text(value, width / 2, height / 2 + 9, {
        anchor: "middle",
        fontSize: options.fontSize ?? 21,
        fill: color,
        weight: options.weight,
      })}
    </g>`;
}

function metric(label, leftValue, rightValue, x, width, options = {}) {
  const center = width / 2;
  const valueOffset = Math.min(104, width * 0.23);
  const leftValueOffset = options.leftValueOffset ?? valueOffset;
  const rightValueOffset = options.rightValueOffset ?? valueOffset;
  const dividerOffset = options.dividerOffset ?? 0;
  const dividerY = options.dividerY ?? 100;
  const dividerFontSize = options.dividerFontSize ?? 28;
  const leftFontSize = options.leftFontSize ?? options.fontSize ?? 46;
  const rightFontSize = options.rightFontSize ?? options.fontSize ?? 46;
  return `
    <g transform="translate(${x} 0)">
      ${text(label.toUpperCase(), center, 38, {
        anchor: "middle",
        fontSize: 18,
        fill: "#7195ad",
        weight: 650,
      })}
      ${text(leftValue, center - leftValueOffset, 105, {
        anchor: "middle",
        fontSize: leftFontSize,
        fill: "#f4cc50",
        weight: 700,
      })}
      ${text("/", center + dividerOffset, dividerY, {
        anchor: "middle",
        fontSize: dividerFontSize,
        fill: "#52758d",
      })}
      ${text(rightValue, center + rightValueOffset, 105, {
        anchor: "middle",
        fontSize: rightFontSize,
        fill: "#c5def0",
        weight: 600,
      })}
    </g>`;
}

function renderCard(comparison) {
  const width = 1600;
  const height = 900;
  const leftX = 104;
  const rightX = 866;
  const codeFontSize = 34;
  const codeLines = [
    "O0 !== l1I && value <= 10",
    "value -> next => result",
    "const emphasis = readable;",
    "note = alternateStyle;",
  ];
  const competitorCodeFeatures = comparison.key === "monaspace"
    ? [
        "ss01=1",
        "ss02=1",
        "ss03=1",
        "ss04=1",
        "ss05=1",
        "ss06=1",
        "ss07=1",
        "ss08=1",
        "ss09=1",
        "ss10=1",
      ]
    : [];

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img">
  <title>${esc(monoLisa.label)} vs. ${esc(comparison.label)} social comparison card</title>
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#102f45"/>
      <stop offset="1" stop-color="#0b2436"/>
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientTransform="translate(300 330) rotate(24) scale(760 500)">
      <stop offset="0" stop-color="#2d6685" stop-opacity=".32"/>
      <stop offset="1" stop-color="#2d6685" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#8bb3ca" stroke-opacity=".045"/>
    </pattern>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#background)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  <path d="M0 0H18V900H0Z" fill="#f4cc50"/>

  <g transform="translate(70 62)">
    <path d="M0 0H48V15H0ZM0 23H32V38H0ZM0 46H16V61H0Z" fill="#f4cc50"/>
  </g>
  ${text("MonoLisa Code", 710, 145, {
    anchor: "end",
    fontSize: 58,
    fill: "#f4cc50",
    weight: 700,
  })}
  ${pill("VS", 763, 95, {
    width: 74,
    height: 48,
    fill: "#24465d",
    color: "#83a6bb",
    fontSize: 19,
    weight: 700,
  })}
  ${text(comparison.label, 890, 145, {
    fontSize: 58,
    fill: "#e8f3fb",
    font: comparison.font,
  })}
  <g transform="translate(72 185)">
    <rect width="1456" height="434" rx="24" fill="#102b3f" stroke="#42677f" stroke-opacity=".55"/>

    <g>
      <rect x="32" y="28" width="664" height="378" rx="18" fill="#0d2638"/>
      <rect x="760" y="28" width="664" height="378" rx="18" fill="#0d2638"/>
      ${text(codeLines[0], 64, 105, {
        fontSize: codeFontSize,
        fill: "#d1b64d",
        weight: 600,
        features: ["dlig=1"],
      })}
      ${text(codeLines[1], 64, 191, {
        fontSize: codeFontSize,
        fill: "#d1b64d",
        weight: 600,
        features: ["dlig=1"],
      })}
      ${text(codeLines[2], 64, 278, {
        fontSize: codeFontSize,
        fill: "#d1b64d",
        font: monoLisaItalicFont,
        features: ["dlig=1"],
      })}
      ${text(codeLines[3], 64, 365, {
        fontSize: codeFontSize,
        fill: "#d1b64d",
        font: monoLisaItalicFont,
        features: ["dlig=1", "ss01=1"],
      })}
      ${text(codeLines[0], 792, 105, {
        fontSize: codeFontSize,
        fill: "#90b4ca",
        font: comparison.font,
        features: competitorCodeFeatures,
      })}
      ${text(codeLines[1], 792, 191, {
        fontSize: codeFontSize,
        fill: "#90b4ca",
        font: comparison.font,
        features: competitorCodeFeatures,
      })}
      ${text(codeLines[2], 792, 278, {
        fontSize: codeFontSize,
        fill: "#90b4ca",
        font: comparison.italicFont,
        features: competitorCodeFeatures,
      })}
      ${text(codeLines[3], 792, 365, {
        fontSize: codeFontSize,
        fill: "#90b4ca",
        font: comparison.italicFont,
        features: competitorCodeFeatures,
      })}
    </g>

  </g>

  <g transform="translate(72 647)">
    <rect width="1456" height="144" rx="20" fill="#102b3f" stroke="#42677f" stroke-opacity=".45"/>
    <line x1="364" y1="20" x2="364" y2="124" stroke="#52758d" stroke-opacity=".45"/>
    <line x1="728" y1="20" x2="728" y2="124" stroke="#52758d" stroke-opacity=".45"/>
    <line x1="1092" y1="20" x2="1092" y2="124" stroke="#52758d" stroke-opacity=".45"/>
    ${metric("Variable axes", monoLisa.axes, comparison.axes, 0, 364, {
      dividerOffset: 18,
      dividerY: 106,
      dividerFontSize: 24,
      leftFontSize: 18,
      rightFontSize: comparison.axes.length > 8 ? 18 : 22,
    })}
    ${metric("Languages*", monoLisa.languages, comparison.languages, 364, 364)}
    ${metric("True italics", monoLisa.italics, comparison.italics, 728, 364)}
    ${metric("Coding ligatures", monoLisa.ligatures, comparison.ligatures, 1092, 364)}
  </g>

  <line x1="72" y1="811" x2="1528" y2="811" stroke="#52758d" stroke-opacity=".55"/>
  ${text("* Hyperglot 0.8.1 · primary living orthographies · base-character support", 74, 838, {
    fontSize: 16,
    fill: "#6f92a9",
  })}
  ${text("TRY MONOLISA FREE →  monolisa.dev/trial", 1526, 875, {
    anchor: "end",
    fontSize: 23,
    fill: "#f4cc50",
    weight: 700,
  })}
</svg>`;

  const outputPath = path.join(
    outputDir,
    `comparison-monolisa-vs-${comparison.key}-x-1600x900.png`,
  );
  const result = spawnSync(
    "rsvg-convert",
    ["--format=png", "--width=1600", "--height=900", "--output", outputPath],
    { cwd: root, input: svg, encoding: "utf8", maxBuffer: 1024 * 1024 * 20 },
  );
  if (result.status !== 0) throw new Error(result.stderr || `Failed to render ${outputPath}`);
  console.log(path.relative(root, outputPath));
}

const requested = new Set(process.argv.slice(2));
const selected = requested.size
  ? comparisons.filter((comparison) => requested.has(comparison.key))
  : comparisons;

if (selected.length === 0) {
  throw new Error(`No matching comparisons. Available: ${comparisons.map(({ key }) => key).join(", ")}`);
}

for (const comparison of selected) renderCard(comparison);
