#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.resolve(root, "images");
mkdirSync(outputDir, { recursive: true });

const comparison = {
  key: "fira-code",
  title: "MonoLisa Code vs. Fira Code",
  subtitle: "Comparison signals for coding font selection",
  left: {
    label: "MonoLisa Code",
    descriptor: "Paid coding type system",
    languages: 593,
    scripts: ["Latin", "Cyrillic", "Greek", "Hebrew", "Armenian"],
    weights: "10 named weights",
    italics: "Yes",
    axes: ["wght", "GRAD"],
    features: ["liga", "dlig", "calt", "zero", "ss01-ss15", "cv01-cv12"],
    terminal: "Powerline, box drawing, block elements",
  },
  right: {
    label: "Fira Code",
    descriptor: "Free ligature-focused font",
    languages: 395,
    scripts: ["Latin", "Cyrillic", "Greek"],
    weights: "6 static, 5 variable",
    italics: "No",
    axes: ["wght"],
    features: ["calt", "zero", "ss01-ss10", "cv01-cv32"],
    terminal: "Powerline, box drawing, block elements",
  },
};

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function chip(label, x, y, options = {}) {
  const width = Math.max(58, label.length * 8.5 + 24);
  const variant = options.variant || "plain";
  return `
    <g class="chip-box ${variant}" transform="translate(${x} ${y})">
      <rect width="${width}" height="30" rx="15"/>
      <text x="${width / 2}" y="20" text-anchor="middle" class="chip">${esc(label)}</text>
    </g>`;
}

function chipRow(items, x, y, maxWidth, options = {}) {
  let cursorX = x;
  let cursorY = y;
  const parts = [];

  for (const item of items) {
    const width = Math.max(58, item.length * 8.5 + 24);
    if (cursorX + width > x + maxWidth) {
      cursorX = x;
      cursorY += 38;
    }
    parts.push(chip(item, cursorX, cursorY, options));
    cursorX += width + 10;
  }

  return parts.join("\n");
}

function metricBand({ label, left, right, y, tone = "neutral" }) {
  const tones = {
    left: { className: "advantage-left", note: "MonoLisa advantage" },
    right: { className: "advantage-right", note: "Fira Code advantage" },
    neutral: { className: "advantage-neutral", note: "Comparable" },
  };
  const selected = tones[tone];

  return `
    <g transform="translate(66 ${y})">
      <text x="0" y="0" class="metric-label">${esc(label)}</text>
      <text x="0" y="35" class="metric-value">${esc(left)}</text>
      <text x="1018" y="35" class="metric-value right">${esc(right)}</text>
      <line x1="0" y1="56" x2="1018" y2="56" class="rule"/>
      <rect x="397" y="16" width="224" height="34" rx="17" class="${selected.className}"/>
      <text x="509" y="38" text-anchor="middle" class="band-note">${esc(selected.note)}</text>
    </g>`;
}

function render() {
  const { left, right } = comparison;
  const languageScale = 340 / Math.max(left.languages, right.languages);
  const leftLanguageWidth = Math.round(left.languages * languageScale);
  const rightLanguageWidth = Math.round(right.languages * languageScale);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1150" height="1180" viewBox="0 0 1150 1180" version="1.1" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">${esc(comparison.title)} summary infographic</title>
  <desc id="desc">A comparative infographic showing headline metrics, script coverage, feature coverage, and style range for MonoLisa and Fira Code.</desc>
  <style>
    text {
      font-family: "MonoLisa", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      fill: var(--icon-primary, currentColor);
    }

    .eyebrow {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 2.6px;
      text-transform: uppercase;
      fill: var(--icon-secondary, currentColor);
    }

    .title {
      font-size: 58px;
      font-weight: 800;
      letter-spacing: 0;
    }

    .subtitle {
      font-size: 22px;
      fill: var(--icon-secondary, currentColor);
    }

    .name {
      font-size: 32px;
      font-weight: 800;
    }

    .descriptor,
    .meta {
      font-size: 17px;
      fill: var(--icon-secondary, currentColor);
    }

    .number {
      font-size: 96px;
      font-weight: 900;
    }

    .number-label {
      font-size: 18px;
      fill: var(--icon-secondary, currentColor);
    }

    .metric-label {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 1.8px;
      text-transform: uppercase;
      fill: var(--icon-secondary, currentColor);
    }

    .metric-value {
      font-size: 23px;
      font-weight: 750;
    }

    .metric-value.right {
      text-anchor: end;
    }

    .band-note,
    .chip {
      font-size: 13px;
      font-weight: 800;
    }

    .section-title {
      font-size: 22px;
      font-weight: 850;
    }

    .body {
      font-size: 18px;
      fill: var(--icon-secondary, currentColor);
    }

    .rule {
      stroke: var(--icon-secondary, currentColor);
      stroke-opacity: 0.35;
      stroke-width: 1.25;
    }

    .panel,
    .language-track,
    .chip-box rect,
    .advantage-left,
    .advantage-right,
    .advantage-neutral {
      fill: none;
      stroke: var(--icon-primary, currentColor);
      stroke-width: 1.75;
    }

    .panel {
      stroke-width: 2;
    }

    .panel-rule,
    .bar-left,
    .bar-right,
    .top-rule {
      fill: var(--icon-primary, currentColor);
    }

    .panel-rule,
    .bar-right,
    .chip-box.plain rect {
      opacity: 0.22;
    }

    .bar-left,
    .chip-box.strong rect,
    .advantage-left {
      opacity: 0.9;
    }

    .chip-box.strong rect,
    .advantage-left,
    .advantage-right {
      fill: var(--icon-primary, currentColor);
      fill-opacity: 0.1;
    }

    .advantage-neutral {
      stroke: var(--icon-secondary, currentColor);
      stroke-opacity: 0.55;
    }

    .divider {
      stroke: var(--icon-primary, currentColor);
      stroke-width: 2;
      stroke-opacity: 0.5;
    }
  </style>

  <path d="M66 46H1084" class="top-rule"/>
  <text x="66" y="84" class="eyebrow">Coding font comparison</text>
  <text x="66" y="158" class="title">${esc(comparison.title)}</text>
  <text x="66" y="196" class="subtitle">${esc(comparison.subtitle)}</text>
  <line x1="66" y1="232" x2="1084" y2="232" class="rule"/>

  <g transform="translate(66 280)">
    <rect width="478" height="260" rx="0" class="panel"/>
    <rect width="478" height="12" class="panel-rule"/>
    <text x="28" y="58" class="name">${esc(left.label)}</text>
    <text x="28" y="86" class="descriptor">${esc(left.descriptor)}</text>
    <text x="28" y="180" class="number">${left.languages}</text>
    <text x="30" y="236" class="number-label">Hyperglot languages</text>
  </g>

  <g transform="translate(606 280)">
    <rect width="478" height="260" rx="0" class="panel"/>
    <rect width="478" height="12" class="panel-rule"/>
    <text x="28" y="58" class="name">${esc(right.label)}</text>
    <text x="28" y="86" class="descriptor">${esc(right.descriptor)}</text>
    <text x="28" y="180" class="number">${right.languages}</text>
    <text x="30" y="236" class="number-label">Hyperglot languages</text>
  </g>

  <g transform="translate(66 584)">
    <text x="0" y="0" class="section-title">Language coverage (Hyperglot)</text>
    <line x1="0" y1="28" x2="1018" y2="28" class="rule"/>
    <text x="0" y="72" class="meta">${esc(left.label)}</text>
    <rect x="142" y="52" width="340" height="26" class="language-track"/>
    <rect x="142" y="52" width="${leftLanguageWidth}" height="26" class="bar-left"/>
    <text x="542" y="72" class="metric-value right">${left.languages}</text>
    <text x="0" y="118" class="meta">${esc(right.label)}</text>
    <rect x="142" y="98" width="340" height="26" class="language-track"/>
    <rect x="142" y="98" width="${rightLanguageWidth}" height="26" class="bar-right"/>
    <text x="542" y="118" class="metric-value right">${right.languages}</text>
    <text x="594" y="72" class="meta">Writing systems: ${left.scripts.length} vs ${right.scripts.length}</text>
    ${chipRow(left.scripts, 594, 90, 430, { variant: "strong" })}
    ${chipRow(right.scripts, 594, 174, 430, { variant: "plain" })}
  </g>

  <g transform="translate(66 834)">
    <text x="0" y="0" class="metric-label">OpenType feature surface</text>
    <line x1="509" y1="0" x2="509" y2="112" class="divider"/>
    <text x="0" y="32" class="meta">${esc(left.label)}</text>
    <text x="548" y="32" class="meta">${esc(right.label)}</text>
    ${chipRow(left.features, 0, 52, 470, { variant: "strong" })}
    ${chipRow(right.features, 548, 52, 470, { variant: "plain" })}
  </g>

  ${metricBand({ label: "Italics", left: left.italics, right: right.italics, y: 978, tone: "left" })}
  ${metricBand({ label: "Weight range", left: left.weights, right: right.weights, y: 1052, tone: "left" })}

  <g transform="translate(66 1132)">
    <rect width="1018" height="1.5" class="panel-rule"/>
    <text x="0" y="24" class="body">Language counts: Hyperglot 0.8.1. Specimen SVGs below show the evidence.</text>
  </g>
</svg>
`;

  const outputPath = path.join(outputDir, `comparison-monolisa-vs-${comparison.key}-summary.svg`);
  writeFileSync(outputPath, svg.replace(/[ \t]+$/gm, ""));
  console.log(path.relative(root, outputPath));
}

render();
