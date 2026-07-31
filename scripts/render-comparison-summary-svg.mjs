#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const outputDir = path.resolve(root, "images");
const coveragePath = path.resolve(root, "01_ideas/comparison_language_coverage.json");
const coverage = JSON.parse(readFileSync(coveragePath, "utf8"));
const configPath = path.resolve(root, "scripts/comparison-fonts.local.json");
const fallbackConfigPath = path.resolve(root, "scripts/comparison-fonts.json");
const fontConfig = JSON.parse(
  readFileSync(existsSync(configPath) ? configPath : fallbackConfigPath, "utf8"),
);
mkdirSync(outputDir, { recursive: true });

const monoLisaCoverage = coverage.fonts.monolisa;
const monoLisaCodeFontPath = path.resolve(root, fontConfig.fonts.monolisa.regular);
const monoLisaCodeItalicPath = fontConfig.fonts.monolisa.italic
  ? path.resolve(root, fontConfig.fonts.monolisa.italic)
  : null;
const monoLisaTextFontPath = resolveFontPath(
  [
    fontConfig.fonts.monolisa.textRegular,
    ".font-sources/monolisa/MonoLisaTextUpright.ttf",
    "/Library/Fonts/monolisa/MonoLisaTextUpright.ttf",
  ],
  monoLisaCodeFontPath,
);
const monoLisaTextItalicPath = resolveFontPath(
  [
    fontConfig.fonts.monolisa.textItalic,
    ".font-sources/monolisa/MonoLisaTextItalic.ttf",
    "/Library/Fonts/monolisa/MonoLisaTextItalic.ttf",
  ],
  monoLisaCodeItalicPath ?? monoLisaTextFontPath,
);

const leftComparison = {
  label: "MonoLisa Code",
  shortLabel: "MonoLisa",
  descriptor: "Paid coding type system",
  languages: monoLisaCoverage.totalLanguages,
  speakers: monoLisaCoverage.totalSpeakers,
  scripts: Object.keys(monoLisaCoverage.scripts),
  weights: "10 named weights",
  italics: "Yes",
  axes: ["wght", "GRAD"],
  features: ["liga", "dlig", "calt", "zero", "ss01-ss15", "cv01-cv12"],
  terminal: "Powerline, box drawing, block elements",
};

const rightComparisons = [
  {
    key: "fira-code",
    title: "MonoLisa Code vs. Fira Code",
    descriptor: "Free ligature-focused font",
    weights: "6 static, 5 variable",
    italics: "No",
    axes: ["wght"],
    features: ["calt", "zero", "ss01-ss10", "cv01-cv32"],
    terminal: "Powerline, box drawing, block elements",
  },
  {
    key: "jetbrains-mono",
    title: "MonoLisa Code vs. JetBrains Mono",
    descriptor: "Free coding typeface",
    weights: "8 named weights",
    italics: "Yes",
    axes: ["wght"],
    features: ["calt", "zero", "ss01-ss02", "ss19-ss20", "cv01-cv20", "cv99"],
    terminal: "Powerline, box drawing, block elements",
  },
  {
    key: "cascadia-code",
    title: "MonoLisa Code vs. Cascadia Code",
    descriptor: "Free coding typeface",
    weights: "6 named weights",
    italics: "Yes",
    axes: ["wght"],
    features: ["calt", "rclt", "rlig", "zero", "ss02", "ss19-ss20"],
    terminal: "Box drawing, block elements",
  },
  {
    key: "hack",
    title: "MonoLisa Code vs. Hack",
    descriptor: "Free no-frills coding font",
    weights: "2 named weights",
    italics: "Yes",
    axes: [],
    features: ["aalt", "frac", "locl", "ordn", "sinf", "subs", "sups"],
    terminal: "Powerline, box drawing, block elements",
  },
  {
    key: "source-code-pro",
    title: "MonoLisa Code vs. Source Code Pro",
    descriptor: "Free Adobe coding font",
    weights: "7 named weights",
    italics: "Yes",
    axes: [],
    features: ["zero", "ss01-ss07", "cvXX"],
    terminal: "Powerline, box drawing, block elements",
  },
  {
    key: "ibm-plex-mono",
    title: "MonoLisa Code vs. IBM Plex Mono",
    descriptor: "Free mono family member",
    weights: "8 named weights",
    italics: "Yes",
    axes: [],
    features: ["zero", "ss01-ss09"],
    terminal: "Box drawing, block elements",
  },
  {
    key: "monaspace",
    title: "MonoLisa Code vs. Monaspace",
    descriptor: "Free coding superfamily",
    weights: "7 named weights",
    italics: "Yes",
    axes: [],
    features: ["calt", "liga", "ss01-ss10", "cvXX"],
    terminal: "Powerline, box drawing, block elements",
  },
  {
    key: "recursive-mono",
    title: "MonoLisa Code vs. Recursive Mono",
    descriptor: "Free variable type system",
    weights: "2 static, 8 variable",
    italics: "Yes",
    axes: ["MONO", "CASL", "wght", "slnt", "CRSV"],
    features: ["calt", "rclt"],
    terminal: "Powerline",
  },
].map((comparison) => {
  const rightCoverage = coverage.fonts[comparison.key];

  return {
    ...comparison,
    left: leftComparison,
    right: {
      label: rightCoverage.label,
      shortLabel: rightCoverage.label,
      languages: rightCoverage.totalLanguages,
      speakers: rightCoverage.totalSpeakers,
      scripts: Object.keys(rightCoverage.scripts),
      descriptor: comparison.descriptor,
      weights: comparison.weights,
      italics: comparison.italics,
      axes: comparison.axes,
      features: comparison.features,
      terminal: comparison.terminal,
    },
  };
});

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveFontPath(candidates, fallback) {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const candidatePath = path.resolve(root, candidate);
    if (existsSync(candidatePath)) return candidatePath;
  }

  return fallback;
}

function fontPathFor(options = {}) {
  if (options.family === "code") {
    return options.style === "italic" && monoLisaCodeItalicPath && existsSync(monoLisaCodeItalicPath)
      ? monoLisaCodeItalicPath
      : monoLisaCodeFontPath;
  }

  return options.style === "italic" && monoLisaTextItalicPath && existsSync(monoLisaTextItalicPath)
    ? monoLisaTextItalicPath
    : monoLisaTextFontPath;
}

function normalizeFragment(svg, prefix, fill) {
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1] || "0 0 100 100";
  const [, , width] = viewBox.split(/\s+/).map(Number);
  const baselineY = Number(svg.match(/<use[^>]*\sy="([^"]+)"/)?.[1] || 0);
  const glyphYBounds = new Map();

  for (const glyphMatch of svg.matchAll(/<g id="([^"]+)">([\s\S]*?)<\/g>/g)) {
    const [, id, body] = glyphMatch;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const pathMatch of body.matchAll(/<path[^>]*\sd="([^"]+)"/g)) {
      const values = pathMatch[1].match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
      for (let index = 1; index < values.length; index += 2) {
        minY = Math.min(minY, values[index]);
        maxY = Math.max(maxY, values[index]);
      }
    }

    if (Number.isFinite(minY) && Number.isFinite(maxY)) {
      glyphYBounds.set(id, { minY, maxY });
    }
  }

  let inkMinY = Infinity;
  let inkMaxY = -Infinity;
  for (const useMatch of svg.matchAll(/<use[^>]*(?:xlink:href|href)="#([^"]+)"[^>]*\sy="([^"]+)"/g)) {
    const [, id, y] = useMatch;
    const bounds = glyphYBounds.get(id);
    if (!bounds) continue;
    const useY = Number(y);
    inkMinY = Math.min(inkMinY, useY + bounds.minY);
    inkMaxY = Math.max(inkMaxY, useY + bounds.maxY);
  }

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

  const inkCenterY = Number.isFinite(inkMinY) && Number.isFinite(inkMaxY)
    ? (inkMinY + inkMaxY) / 2
    : baselineY;

  return { advanceWidth: Math.max(0, width - 32), baselineY, inkCenterY, inner };
}

function renderText(text, x, y, options = {}) {
  const fontSize = options.fontSize ?? 20;
  const fill = options.fill ?? "var(--icon-primary, currentColor)";
  const anchor = options.anchor ?? "start";
  const prefix = options.prefix ?? `text-${fontSize}-${String(text).replace(/\W+/g, "-")}`;
  const className = options.className ? ` class="${esc(options.className)}"` : "";
  const fontPath = fontPathFor(options);
  const features = ["kern=1", "liga=1", "calt=1", ...(options.features ?? [])].join(",");
  const args = [
    "--output-format=svg",
    `--font-size=${fontSize}`,
    `--features=${features}`,
    "--",
    fontPath,
    String(text),
  ];
  const result = spawnSync("hb-view", args, { cwd: root, encoding: "utf8" });

  if (result.status !== 0) {
    throw new Error(result.stderr || `hb-view failed for ${text}`);
  }

  const fragment = normalizeFragment(result.stdout, prefix, fill);
  const offset =
    anchor === "middle" ? fragment.advanceWidth / 2 :
    anchor === "end" ? fragment.advanceWidth :
    0;

  const translateY = options.centerY == null
    ? y - fragment.baselineY
    : options.centerY - fragment.inkCenterY;

  return `
    <g${className} transform="translate(${x - offset - 16} ${translateY})">
      ${fragment.inner}
    </g>`;
}

function orderedScripts(scripts) {
  const preferredOrder = ["Latin", "Cyrillic", "Greek", "Armenian", "Hebrew", "Braille"];
  return [...scripts].sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a);
    const bIndex = preferredOrder.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });
}

function chipWidth(label, options = {}) {
  const fontSize = options.fontSize ?? 14;
  const paddingX = options.paddingX ?? 24;
  const minWidth = options.minWidth ?? 58;
  return Math.max(minWidth, Math.round(label.length * fontSize * 0.72 + paddingX));
}

function chip(label, x, y, options = {}) {
  const width = chipWidth(label, options);
  const height = options.height ?? 30;
  const radius = options.radius ?? height / 2;
  const fontSize = options.fontSize ?? 14;
  const variant = options.variant || "plain";
  return `
    <g class="chip-box ${variant}" transform="translate(${x} ${y})">
      <rect width="${width}" height="${height}" rx="${radius}"/>
      ${renderText(label, width / 2, 0, {
        anchor: "middle",
        fontSize,
        centerY: height / 2,
        fill: "var(--icon-primary, currentColor)",
        className: "chip-label",
        prefix: `chip-${variant}-${label}`,
        family: "code",
      })}
    </g>`;
}

function chipRow(items, x, y, maxWidth, options = {}) {
  let cursorX = x;
  let cursorY = y;
  const parts = [];

  for (const item of items) {
    const width = chipWidth(item, options);
    if (cursorX + width > x + maxWidth) {
      cursorX = x;
      cursorY += options.rowGap ?? 38;
    }
    parts.push(chip(item, cursorX, cursorY, options));
    cursorX += width + (options.columnGap ?? 10);
  }

  return parts.join("\n");
}

function speakerBillions(value) {
  const match = String(value).match(/^([0-9.]+)B$/);
  if (!match) {
    throw new Error(`Expected speaker total in billions, got ${value}`);
  }

  return Number(match[1]);
}

function speakerLabel(value) {
  return `${speakerBillions(value).toFixed(1)} billion`;
}

function speakerRow({ label, value, width, y, variant = "plain" }) {
  const height = 46;
  const fontSize = 30;

  return `
    <g transform="translate(0 ${y})">
      <rect width="${width}" height="${height}" class="speaker-bar ${variant}"/>
      ${renderText(`${label}: ${value}`, 24, 0, {
        fontSize,
        centerY: height / 2,
        fill: "var(--icon-primary, currentColor)",
        className: "speaker-label",
        prefix: `speaker-${variant}-${label}`,
      })}
    </g>`;
}

function render(comparison) {
  const { left, right } = comparison;
  const fullWidth = 1150;
  const fullHeight = 1120;
  const footnoteY = 1084;
  const lowerRightColumnX = 640;
  const lowerBlockY = 700;
  const writingChipY = 42;
  const opentypeLabelY = 230;
  const opentypeChipY = 272;
  const worldSpeakers = 8.3;
  const speakerScale = fullWidth / worldSpeakers;
  const leftSpeakerWidth = Math.round(speakerBillions(left.speakers) * speakerScale);
  const rightSpeakerWidth = Math.round(speakerBillions(right.speakers) * speakerScale);
  const text = (value, x, y, options) => renderText(value, x, y, options);
  const strongChipOptions = {
    variant: "strong",
    fontSize: 22,
    height: 40,
    minWidth: 78,
    paddingX: 34,
    rowGap: 52,
    columnGap: 12,
  };
  const plainChipOptions = {
    variant: "plain",
    fontSize: 22,
    height: 40,
    minWidth: 78,
    paddingX: 34,
    rowGap: 52,
    columnGap: 12,
  };

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${fullWidth}" height="${fullHeight}" viewBox="0 0 ${fullWidth} ${fullHeight}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img" aria-labelledby="title desc">
  <title id="title">${esc(comparison.title)} summary infographic</title>
  <desc id="desc">A compact comparative infographic showing measured language counts, script coverage, and OpenType feature signals for ${esc(comparison.title)}.</desc>
  <style>
    .rule {
      stroke: var(--icon-secondary, currentColor);
      stroke-opacity: 0.35;
      stroke-width: 1.25;
    }

    .top-rule {
      fill: var(--icon-primary, currentColor);
    }

    .chip-box rect {
      fill: var(--icon-primary, currentColor);
    }

    .chip-box.plain rect {
      opacity: 0.12;
    }

    .chip-box.strong rect {
      fill: var(--ml-colors-primary, var(--icon-primary, currentColor));
      opacity: 0.28;
    }

    .speaker-bar {
      fill: var(--icon-primary, currentColor);
      opacity: 0.12;
    }

    .speaker-bar.strong {
      fill: var(--ml-colors-primary, var(--icon-primary, currentColor));
      opacity: 0.45;
    }

    .speaker-bar.plain {
      fill: var(--icon-primary, currentColor);
      opacity: 0.22;
    }
  </style>

  ${text("LANGUAGES", 0, 32, {
    fontSize: 24,
    fill: "var(--icon-secondary, currentColor)",
    prefix: "language-section-title",
  })}

  <g transform="translate(0 118)">
    ${text(left.shortLabel, 0, 0, {
      fontSize: 54,
      fill: "var(--ml-colors-primary, var(--icon-secondary, currentColor))",
      prefix: "language-left-label",
    })}
    ${text(right.shortLabel, lowerRightColumnX, 0, {
      fontSize: 54,
      fill: "var(--icon-primary, currentColor)",
      prefix: "language-right-label",
    })}
    ${text(left.languages, 0, 136, {
      fontSize: 136,
      fill: "var(--ml-colors-primary, var(--icon-primary, currentColor))",
      prefix: "language-left-value",
      family: "code",
      features: ["tnum=1"],
    })}
    ${text(right.languages, lowerRightColumnX, 136, {
      fontSize: 136,
      fill: "var(--icon-primary, currentColor)",
      prefix: "language-right-value",
      family: "code",
      features: ["tnum=1"],
    })}
    ${text("Languages measured with Hyperglot*", 0, 244, {
      fontSize: 28,
      style: "italic",
      fill: "var(--ml-colors-comment, var(--icon-secondary, currentColor))",
      prefix: "language-note",
    })}
    ${speakerRow({
      label: "Speakers worldwide",
      value: "8.3 billion",
      width: fullWidth,
      y: 320,
    })}
    ${speakerRow({
      label: left.label,
      value: speakerLabel(left.speakers),
      width: leftSpeakerWidth,
      y: 376,
      variant: "strong",
    })}
    ${speakerRow({
      label: right.label,
      value: speakerLabel(right.speakers),
      width: rightSpeakerWidth,
      y: 432,
    })}
  </g>

  <g transform="translate(0 ${lowerBlockY})">
    ${text("WRITING SYSTEMS", 0, 0, {
      fontSize: 24,
      fill: "var(--icon-secondary, currentColor)",
      prefix: "writing-systems-label",
    })}
    ${chipRow(orderedScripts(left.scripts), 0, writingChipY, 500, strongChipOptions)}
    ${chipRow(orderedScripts(right.scripts), lowerRightColumnX, writingChipY, 460, plainChipOptions)}

    ${text("OPENTYPE FEATURES", 0, opentypeLabelY, {
      fontSize: 24,
      fill: "var(--icon-secondary, currentColor)",
      prefix: "opentype-features-label",
    })}
    ${chipRow(left.features, 0, opentypeChipY, 560, strongChipOptions)}
    ${chipRow(right.features.length ? right.features : ["none measured"], lowerRightColumnX, opentypeChipY, 460, plainChipOptions)}
  </g>

  <g transform="translate(0 ${footnoteY})">
    <line x1="0" y1="0" x2="${fullWidth}" y2="0" class="rule"/>
    ${text("Language counts: Hyperglot 0.8.1, primary living orthographies, base character support.", 0, 24, {
      fontSize: 16,
      fill: "var(--icon-secondary, currentColor)",
      prefix: "footnote",
    })}
  </g>
</svg>
`;

  const outputPath = path.join(outputDir, `comparison-monolisa-vs-${comparison.key}-summary.svg`);
  writeFileSync(outputPath, svg.replace(/[ \t]+$/gm, ""));
  console.log(path.relative(root, outputPath));
}

for (const comparison of rightComparisons) {
  render(comparison);
}
