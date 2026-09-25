#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { comparisonFocus } from "./comparison-focus.mjs";

const root = process.cwd();
const configPath = process.argv[2] || "scripts/comparison-fonts.local.json";
const fallbackConfigPath = "scripts/comparison-fonts.json";
const config = JSON.parse(
  readFileSync(existsSync(configPath) ? configPath : fallbackConfigPath, "utf8"),
);

const mono = config.fonts.monolisa;
const outputDir = path.resolve(root, config.outputDir || "images");
mkdirSync(outputDir, { recursive: true });

// Blog specimens are displayed at full width, so their effective type size and
// canvas width must match even though they are shaped at different base sizes.
const codeExampleFontSize = 20;

const samples = {
  texture: {
    title: "Code Texture",
    codeExample: true,
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
    codeExample: true,
    fontSize: 42,
    lineHeight: 64,
    features: "kern=1,liga=1,calt=1",
    syntax: true,
    lines: [
      "a !== b && c <= d || e >= f",
      "value -> next => result <- input",
      "x === y ? foo::bar : baz...",
    ],
  },
  italics: {
    title: "Italic Forms",
    codeExample: true,
    fontSize: 42,
    lineHeight: 60,
    marginY: 24,
    labelHeight: 28,
    blankLineScale: 0.45,
    style: "italic",
    features: "kern=1,liga=1,calt=1",
    syntax: true,
    lines: [
      "const emphasis = readableIdentifier;",
      "",
      "if (quickFix !== null) return quickFix;",
      "",
      "alpha beta gamma delta epsilon",
    ],
  },
  terminal: {
    title: "Terminal Symbols",
    codeExample: true,
    fontSize: 34,
    lineHeight: 54,
    features: "kern=1,liga=0,calt=0",
    terminal: true,
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

const sampleOverrides = {
  monaspace: {
    italics: {
      style: "normal",
      lines: [
        "UPRIGHT",
        "const affinity = glyphStyle;",
        "",
        "ITALIC",
        "const affinity = glyphStyle;",
      ],
      lineStyles: ["normal", "normal", "normal", "italic", "italic"],
    },
  },
};

const themeFills = {
  accent: "var(--comparison-accent, var(--ml-colors-primary, #f4cc50))",
  primary: "var(--comparison-primary, var(--ml-colors-text, currentColor))",
};

// Some fonts expose their primary coding ligatures through opt-in features.
// Apply them to every ligatures-on sample, including texture and italics,
// without enabling unrelated character-shape preferences for every font.
const fontFeatureProfiles = {
  monolisa: {
    liga: ["dlig=1"],
  },
  monaspace: {
    liga: [
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
    ],
  },
};

const fontKeys = new Map(
  Object.entries(config.fonts).map(([key, font]) => [font, key]),
);

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
  if (sample.variations) return sample.variations;
  if (sample.style === "italic" && font.italicVariations) return font.italicVariations;
  return font.variations;
}

function features(font, sample) {
  const profile = fontFeatureProfiles[fontKeys.get(font)] || {};
  const additions = [
    ...(sample.features.includes("liga=1") ? profile.liga || [] : []),
  ];
  return [sample.features, ...additions].join(",");
}

function renderLine(font, sample, line, prefix, fill = themeFills.primary) {
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

  const fragment = normalizeFragment(result.stdout, prefix, fill);
  if (sample.measureInk) {
    const shaped = spawnSync("hb-shape", [
      ...args.filter((arg) => arg !== "--output-format=svg").slice(0, -3),
      "--output-format=json", "--show-extents", "--", resolved, line,
    ], { cwd: root, encoding: "utf8" });
    if (shaped.status !== 0) throw new Error(shaped.stderr || "Could not measure focus glyph");
    const glyphs = JSON.parse(shaped.stdout);
    if (glyphs.length !== 1 || glyphs[0].g === ".notdef") {
      throw new Error(`Expected one supported focus glyph: ${font.label} ${line}`);
    }
    const { xb, yb, w, h } = glyphs[0];
    fragment.ink = { x: xb, y: -yb, width: w, height: -h };
  }
  return fragment;
}

function normalizeFragment(svg, prefix, fill) {
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1] || "0 0 100 100";
  const [, , width, height] = viewBox.split(/\s+/).map(Number);
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

  return { width, height, advanceWidth: Math.max(0, width - 32), baselineY, inner };
}

const syntaxFills = {
  keyword: "var(--comparison-syntax-keyword, var(--ml-colors-primary, #b7791f))",
  function: "var(--comparison-syntax-function, var(--ml-colors-text, currentColor))",
  property: "var(--comparison-syntax-property, var(--ml-colors-text, currentColor))",
  string: "var(--comparison-syntax-string, var(--ml-colors-primary, #b7791f))",
  number: "var(--comparison-syntax-number, var(--ml-colors-primary, #b7791f))",
  operator: "var(--comparison-syntax-operator, var(--ml-colors-text, currentColor))",
  punctuation: "var(--comparison-syntax-punctuation, var(--ml-colors-comment, currentColor))",
  identifier: "var(--comparison-syntax-identifier, var(--ml-colors-text, currentColor))",
  whitespace: "var(--comparison-syntax-identifier, var(--ml-colors-text, currentColor))",
  terminalBranch: "var(--comparison-terminal-branch, var(--ml-colors-primary, #b7791f))",
  terminalPath: "var(--comparison-terminal-path, var(--ml-colors-text, currentColor))",
  terminalCommand: "var(--comparison-terminal-command, var(--ml-colors-text, currentColor))",
  terminalAdd: "var(--comparison-terminal-add, var(--ml-colors-primary, #b7791f))",
  terminalRemove: "var(--comparison-terminal-remove, var(--ml-colors-text, currentColor))",
  terminalBox: "var(--comparison-terminal-box, var(--ml-colors-text, currentColor))",
};

function tokenizeCode(line) {
  const tokens = [];
  let index = 0;

  while (index < line.length) {
    const rest = line.slice(index);
    const match =
      rest.match(/^\s+/) ||
      rest.match(/^"(?:\\.|[^"])*"/) ||
      rest.match(/^(?:!==|===|=>|->|<-|::|<=|>=|&&|\|\||\?\?|\.\.\.|[=+<>?:.])/) ||
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
    } else if (/^(?:!==|===|=>|->|<-|::|<=|>=|&&|\|\||\?\?|\.\.\.|[=+<>?:.])$/.test(value)) {
      type = "operator";
    } else if (/^[{}()[\],;]$/.test(value)) {
      type = "punctuation";
    }

    tokens.push({ value, type });
    index += value.length;
  }

  return tokens;
}

function tokenizeTerminal(line) {
  if (line.startsWith("+")) {
    return [
      { value: "+", type: "terminalAdd" },
      ...tokenizeCode(line.slice(1)).map((token) => ({
        ...token,
        type: token.type === "identifier" ? "terminalAdd" : token.type,
      })),
    ];
  }

  if (line.startsWith("-")) {
    return [
      { value: "-", type: "terminalRemove" },
      ...tokenizeCode(line.slice(1)).map((token) => ({
        ...token,
        type: token.type === "identifier" ? "terminalRemove" : token.type,
      })),
    ];
  }

  if (/^[┌┬┐│└┴┘─\sstatusbuildtes]+$/.test(line)) {
    return tokenizeCode(line).map((token) => ({
      ...token,
      type: /[┌┬┐│└┴┘─]/.test(token.value) ? "terminalBox" : token.type,
    }));
  }

  const tokens = [];
  let index = 0;
  const tokenPattern = /\s+|\uE0B0|[^\s\uE0B0]+/gu;
  for (const match of line.matchAll(tokenPattern)) {
    const value = match[0];
    let type = "identifier";
    if (/^\s+$/.test(value)) type = "whitespace";
    else if (value === "\uE0B0") type = "operator";
    else if (index === 0) type = "terminalBranch";
    else if (value.includes("/")) type = "terminalPath";
    else type = "terminalCommand";
    tokens.push({ value, type });
    index += 1;
  }

  return tokens;
}

function isTerminalTableLine(line) {
  return /^[┌┬┐│└┴┘─\sstatusbuildtes]+$/.test(line);
}

function tokensForLine(sample, line) {
  if (sample.terminal) return tokenizeTerminal(line);
  return tokenizeCode(line);
}

function renderCodeLine(font, sample, line, prefix) {
  if (line.length === 0) {
    return { width: 0, height: sample.fontSize, tokens: [] };
  }

  if (!sample.syntax && !sample.terminal) {
    const fragment = renderLine(font, sample, line, prefix);
    return {
      width: fragment.width,
      height: fragment.height,
      tokens: [{ x: 16, fragment }],
    };
  }

  if (sample.terminal && isTerminalTableLine(line)) {
    const fragment = renderLine(font, sample, line, prefix, syntaxFills.terminalBox);
    return {
      width: fragment.width,
      height: fragment.height,
      tokens: [{ x: 16, fragment }],
    };
  }

  let x = 0;
  const tokens = tokensForLine(sample, line).map((token, tokenIndex) => {
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

function renderLabel(label, x, y, prefix, fontSize) {
  const fragment = renderLine(
    mono,
    {
      fontSize,
      features: "kern=1,liga=1,calt=1",
      variations: "wght=700",
    },
    label,
    prefix,
    themeFills.primary,
  );

  return `
      <g class="specimen-label" transform="translate(${x - 16}, ${y - fragment.baselineY})">
        ${fragment.inner}
      </g>`;
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function focusLabel(label, center, baseline, prefix, size = 24) {
  const fragment = renderLine(mono, { fontSize: size, features: "kern=1,liga=0,calt=0", variations: "wght=400" }, label, prefix);
  return `<g class="focus-caption" transform="translate(${center - fragment.advanceWidth / 2 - 16}, ${baseline - fragment.baselineY})">${fragment.inner}</g>`;
}

function renderFocus(competitorKey, sampleKey, fonts, stacked, width, colWidth, gutter) {
  const focus = comparisonFocus[competitorKey]?.[sampleKey];
  if (!focus) return { height: 0, body: "", description: "" };
  const pairedStyles = focus.details.some((detail) => detail.styles);
  const size = pairedStyles ? 108 : 140;
  const captionSize = pairedStyles ? (stacked ? 22 : 20) : (stacked ? 28 : 24);
  const prepared = fonts.map((font, fontIndex) => focus.details.map((detail, detailIndex) =>
    (detail.styles ?? ["normal"]).map((style, styleIndex) => {
      const prefix = `${competitorKey}-${sampleKey}-focus-${fontIndex}-${detailIndex}-${styleIndex}`;
      const fragment = renderLine(font, { fontSize: size, features: "kern=1,liga=0,calt=0", style, measureInk: true }, detail.char, prefix);
      const { ink } = fragment;
      const bottom = Math.max(ink.y + ink.height, ...detail.marks.map((mark) => ink.y + ink.height * mark.y + size * mark.radius));
      return { fragment, prefix, bottom };
    }),
  ));
  const lowestInk = Math.max(...prepared.flat(2).map(({ bottom }) => bottom));
  // Captions clear both descenders and their circle, at a shared baseline.
  const captionOffset = Math.max(166, 124 + lowestInk + 20 + captionSize);
  const rowHeight = captionOffset + 56;
  const height = 58 + rowHeight * (stacked ? focus.details.length : 1);
  const body = [];
  for (const [fontIndex, font] of fonts.entries()) {
    const panelWidth = stacked ? (width - 32) / 2 : colWidth;
    const panelX = stacked ? fontIndex * (panelWidth + 32) : fontIndex * (colWidth + gutter);
    const label = competitorKey === "monaspace" && fontIndex === 1 ? "Monaspace Neon" : font.label;
    body.push(renderLabel(label, panelX, 30, `${competitorKey}-${sampleKey}-focus-label-${fontIndex}`, stacked ? 26 : 24));
    for (const [detailIndex, detail] of focus.details.entries()) {
      const itemWidth = stacked ? panelWidth : panelWidth / focus.details.length;
      const itemX = panelX + (stacked ? 0 : detailIndex * itemWidth);
      const rowY = 50 + (stacked ? detailIndex * rowHeight : 0);
      const styles = detail.styles ?? ["normal"];
      const baseline = rowY + 124;
      const captionY = rowY + captionOffset;
      for (const [styleIndex, style] of styles.entries()) {
        const { fragment, prefix } = prepared[fontIndex][detailIndex][styleIndex];
        const { ink } = fragment;
        const center = itemX + itemWidth * (styleIndex + 0.5) / styles.length;
        const originX = center - ink.x - ink.width / 2;
        const circles = detail.marks.map((mark) => `<circle class="focus-circle" cx="${originX + ink.x + ink.width * mark.x}" cy="${baseline + ink.y + ink.height * mark.y}" r="${size * mark.radius}" />`).join("");
        body.push(`<g class="focus-detail" data-character="${esc(detail.char)}" data-style="${style}">${circles}<g transform="translate(${originX - 16}, ${baseline - fragment.baselineY})">${fragment.inner}</g></g>`);
        if (pairedStyles) body.push(focusLabel(style === "italic" ? "Italic" : "Upright", center, captionY, `${prefix}-style`, captionSize));
      }
      if (!pairedStyles) body.push(focusLabel(detail.captions[fontIndex], itemX + itemWidth / 2, captionY, `${competitorKey}-${sampleKey}-focus-caption-${fontIndex}-${detailIndex}`, captionSize));
    }
  }
  body.push(`<line class="focus-divider" x1="0" y1="${height - 12}" x2="${width}" y2="${height - 12}" />`);
  return { height, body: `<g class="comparison-focus" aria-hidden="true">${body.join("\n")}</g>`.replace(/[ \t]+$/gm, ""), description: focus.description };
}

function renderSample(competitorKey, sampleKey, sample, options = {}) {
  const competitor = config.fonts[competitorKey];
  if (!competitor) throw new Error(`Unknown comparison font: ${competitorKey}`);
  const stacked = options.layout === "stacked";

  const marginX = 0;
  const marginY = sample.marginY ?? 32;
  const labelHeight = sample.labelHeight ?? 28;
  const bottomPadding = sample.bottomPadding ?? 28;
  const fragments = [];
  const renderedLines = [];
  const fonts = sample.style === "italic" && !competitor.italic ? [mono] : [mono, competitor];

  for (const [columnIndex, font] of fonts.entries()) {
    for (const [lineIndex, line] of sample.lines.entries()) {
      const prefix = `${competitorKey}-${sampleKey}-${columnIndex}-${lineIndex}`;
      const lineSample = sample.lineStyles?.[lineIndex]
        ? { ...sample, style: sample.lineStyles[lineIndex] }
        : sample;
      renderedLines.push({
        columnIndex,
        lineIndex,
        line: renderCodeLine(font, lineSample, line, prefix),
      });
    }
  }

  const sampleLayout = sample.codeExample
    ? { colWidth: 560, targetLineWidth: 530, gutter: 48 }
    : { colWidth: 700, targetLineWidth: 640, gutter: 48 };
  const colWidth = sampleLayout.colWidth;
  const targetLineWidth = sampleLayout.targetLineWidth;
  const gutter = sampleLayout.gutter;
  const labelFontSize = 20 * (colWidth / 560);
  const columnCount = fonts.length;
  const visibleColumnCount = stacked ? 1 : Math.max(2, columnCount);
  const fitScale = targetLineWidth / Math.max(...renderedLines.map(({ line }) => line.width));
  const codeExampleScale = sample.codeExample ? codeExampleFontSize / sample.fontSize : 1;
  const scale = Math.min(1, codeExampleScale, fitScale);
  const lineStep = sample.lineHeight * scale;
  const lineOffsets = [];
  let lineCursor = 0;
  for (const line of sample.lines) {
    lineOffsets.push(lineCursor);
    lineCursor += line === "" ? lineStep * (sample.blankLineScale ?? 1) : lineStep;
  }
  const effectiveLabelHeight = stacked ? Math.min(labelHeight, 16) : labelHeight;
  const columnGapY = stacked ? 68 : 0;
  const blockHeight = effectiveLabelHeight + lineCursor;
  const width = marginX * 2 + colWidth * visibleColumnCount + gutter * (visibleColumnCount - 1);
  const specimenHeight = stacked
    ? Math.ceil(marginY + blockHeight * columnCount + columnGapY * (columnCount - 1) + bottomPadding)
    : Math.ceil(marginY + blockHeight + bottomPadding);
  const focus = renderFocus(competitorKey, sampleKey, fonts, stacked, width, colWidth, gutter);
  const height = specimenHeight + focus.height;

  for (const [columnIndex, font] of fonts.entries()) {
    const x = stacked
      ? marginX
      : marginX +
        (columnCount === 1 ? (width - colWidth) / 2 : columnIndex * (colWidth + gutter));
    const yStart = stacked ? marginY + columnIndex * (blockHeight + columnGapY) : marginY;
    fragments.push(
      renderLabel(
        font.label,
        x,
        yStart,
        `${competitorKey}-${sampleKey}-${columnIndex}-label`,
        labelFontSize,
      ),
    );

    renderedLines
      .filter((renderedLine) => renderedLine.columnIndex === columnIndex)
      .forEach(({ lineIndex, line }) => {
      if (line.tokens.length === 0) return;

      const y = yStart + effectiveLabelHeight + lineOffsets[lineIndex];
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

  const title = `${sample.title}: ${mono.label} vs. ${competitor.label}`;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="${themeFills.primary}" style="fill-rule:nonzero;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
  <title>${esc(title)}</title>
  ${focus.description ? `<desc>${esc(focus.description)}</desc>` : ""}
  <style>
    .specimen-label {
      opacity: 0.62;
    }
    .rule {
      stroke: ${themeFills.accent};
      stroke-opacity: 0.55;
      stroke-width: 2;
    }
    .focus-circle {
      fill: ${themeFills.accent};
      fill-opacity: 0.28;
    }
    .focus-caption { opacity: 0.8; }
    .focus-divider {
      stroke: ${themeFills.primary};
      stroke-opacity: 0.14;
      stroke-width: 1;
    }
  </style>
  ${focus.body}
  <g class="comparison-specimen" transform="translate(0, ${focus.height})">${fragments.join("\n")}</g>
</svg>
`;

  const outputPath = path.join(
    outputDir,
    `comparison-monolisa-vs-${competitorKey}-${sampleKey}${stacked ? "-mobile" : ""}.svg`,
  );
  writeFileSync(outputPath, svg);
  return outputPath;
}

const focusOnly = process.argv.includes("--focus-only");
const requested = process.argv.slice(3).filter((arg) => arg !== "--focus-only");
const comparisons = requested.length ? requested : config.comparisons;
let rendered = 0;

if (!existsSync(path.resolve(root, mono.regular))) {
  fail(`Missing MonoLisa regular font: ${mono.regular}`);
  process.exit(1);
}

for (const competitorKey of comparisons) {
  for (const [sampleKey, sample] of Object.entries(samples)) {
    if (focusOnly && !comparisonFocus[competitorKey]?.[sampleKey]) continue;
    const comparisonSample = {
      ...sample,
      ...sampleOverrides[competitorKey]?.[sampleKey],
    };
    try {
      const outputPath = renderSample(competitorKey, sampleKey, comparisonSample);
      console.log(path.relative(root, outputPath));
      const mobileOutputPath = renderSample(
        competitorKey,
        sampleKey,
        comparisonSample,
        { layout: "stacked" },
      );
      console.log(path.relative(root, mobileOutputPath));
      rendered += 1;
    } catch (error) {
      console.warn(`Skipped ${competitorKey}/${sampleKey}: ${error.message}`);
      if (focusOnly) process.exitCode = 1;
    }
  }
}

if (rendered === 0) {
  fail("No SVGs rendered. Add font files under .font-sources/ or update scripts/comparison-fonts.local.json.");
}
