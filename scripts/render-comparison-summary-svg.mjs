#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.resolve(root, "images");
const coveragePath = path.resolve(root, "01_ideas/comparison_language_coverage.json");
const coverage = JSON.parse(readFileSync(coveragePath, "utf8"));
mkdirSync(outputDir, { recursive: true });

const monoLisaCoverage = coverage.fonts.monolisa;
const firaCodeCoverage = coverage.fonts["fira-code"];
const baselineCoverage = coverage.baseline;

const comparison = {
  key: "fira-code",
  title: "MonoLisa Code vs. Fira Code",
  subtitle: "Comparison signals for coding font selection",
  baseline: {
    label: "Hyperglot baseline",
    languages: baselineCoverage.totalLanguages,
    speakers: baselineCoverage.totalSpeakers,
  },
  left: {
    label: "MonoLisa Code",
    descriptor: "Paid coding type system",
    languages: monoLisaCoverage.publicationTotalLanguages ?? monoLisaCoverage.totalLanguages,
    speakers: monoLisaCoverage.totalSpeakers,
    scripts: Object.keys(monoLisaCoverage.publicationScripts ?? monoLisaCoverage.scripts),
    weights: "10 named weights",
    italics: "Yes",
    axes: ["wght", "GRAD"],
    features: ["liga", "dlig", "calt", "zero", "ss01-ss15", "cv01-cv12"],
    terminal: "Powerline, box drawing, block elements",
  },
  right: {
    label: "Fira Code",
    descriptor: "Free ligature-focused font",
    languages: firaCodeCoverage.totalLanguages,
    speakers: firaCodeCoverage.totalSpeakers,
    scripts: Object.keys(firaCodeCoverage.scripts),
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
  const width = Math.max(58, label.length * 9 + 24);
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
    const width = Math.max(58, item.length * 9 + 24);
    if (cursorX + width > x + maxWidth) {
      cursorX = x;
      cursorY += 38;
    }
    parts.push(chip(item, cursorX, cursorY, options));
    cursorX += width + 10;
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

function speakerLong(value) {
  return `${speakerBillions(value).toFixed(2)} billion`;
}

function speakerBar({ label, value, y, width, variant = "neutral", suffix }) {
  const valueInside = width > 900;
  const valueX = valueInside ? width - 16 : width + 18;
  const valueClass = valueInside ? "bar-value inside" : "bar-value";

  return `
    <g transform="translate(66 ${y})">
      <rect width="${width}" height="42" rx="0" class="speaker-bar ${variant}"/>
      <text x="16" y="28" class="bar-label">${esc(label)}: ${esc(suffix)}</text>
      <text x="${valueX}" y="28" class="${valueClass}">${value}</text>
    </g>`;
}

function render() {
  const { baseline, left, right } = comparison;
  const baselineSpeakers = speakerBillions(baseline.speakers);
  const leftSpeakers = speakerBillions(left.speakers);
  const rightSpeakers = speakerBillions(right.speakers);
  const barScale = 1018 / baselineSpeakers;
  const baselineSpeakerWidth = Math.round(baselineSpeakers * barScale);
  const leftSpeakerWidth = Math.round(leftSpeakers * barScale);
  const rightSpeakerWidth = Math.round(rightSpeakers * barScale);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1150" height="720" viewBox="0 0 1150 720" version="1.1" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">${esc(comparison.title)} summary infographic</title>
  <desc id="desc">A compact comparative infographic showing speaker coverage, script coverage, and OpenType feature signals for MonoLisa Code and Fira Code.</desc>
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
      font-size: 50px;
      font-weight: 800;
      letter-spacing: 0;
    }

    .subtitle {
      font-size: 20px;
      fill: var(--icon-secondary, currentColor);
    }

    .name {
      font-size: 34px;
      font-weight: 800;
    }

    .descriptor,
    .meta {
      font-size: 17px;
      fill: var(--icon-secondary, currentColor);
    }

    .bar-label {
      font-size: 24px;
      font-weight: 750;
    }

    .bar-value {
      font-size: 20px;
      fill: var(--icon-secondary, currentColor);
    }

    .bar-value.inside {
      text-anchor: end;
    }

    .group-label {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 1.7px;
      text-transform: uppercase;
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
      font-size: 22px;
      font-weight: 750;
    }

    .chip {
      font-size: 14px;
      font-weight: 800;
    }

    .section-title {
      font-size: 24px;
      font-weight: 850;
    }

    .body {
      font-size: 16px;
      fill: var(--icon-secondary, currentColor);
    }

    .rule {
      stroke: var(--icon-secondary, currentColor);
      stroke-opacity: 0.35;
      stroke-width: 1.25;
    }

    .top-rule {
      fill: var(--icon-primary, currentColor);
    }

    .speaker-bar,
    .chip-box rect {
      fill: var(--icon-primary, currentColor);
    }

    .speaker-bar.neutral,
    .chip-box.plain rect {
      opacity: 0.12;
    }

    .speaker-bar.left,
    .chip-box.strong rect {
      fill: var(--ml-colors-primary, var(--icon-primary, currentColor));
      opacity: 0.28;
    }

    .speaker-bar.right {
      opacity: 0.18;
    }
  </style>

  <path d="M66 40H1084" class="top-rule"/>
  <text x="66" y="78" class="eyebrow">Coding font comparison</text>
  <text x="66" y="138" class="title">${esc(comparison.title)}</text>
  <text x="66" y="174" class="subtitle">${esc(comparison.subtitle)}</text>

  <g transform="translate(0 222)">
    <text x="66" y="-24" class="group-label">Hyperglot speaker coverage</text>
    ${speakerBar({
      label: baseline.label,
      value: `${baseline.languages} languages`,
      suffix: speakerLong(baseline.speakers),
      y: 0,
      width: baselineSpeakerWidth,
    })}
    ${speakerBar({
      label: left.label,
      value: `${left.languages} languages`,
      suffix: speakerLong(left.speakers),
      y: 48,
      width: leftSpeakerWidth,
      variant: "left",
    })}
    ${speakerBar({
      label: right.label,
      value: `${right.languages} languages`,
      suffix: speakerLong(right.speakers),
      y: 96,
      width: rightSpeakerWidth,
      variant: "right",
    })}
  </g>

  <g transform="translate(66 406)">
    <text x="0" y="0" class="name">${esc(left.label)}</text>
    <text x="574" y="0" class="name">${esc(right.label)}</text>
    <text x="0" y="32" class="meta">${left.languages} languages · 10 weights · italics</text>
    <text x="574" y="32" class="meta">${right.languages} languages · 5 variable weights · no italics</text>

    <text x="0" y="88" class="group-label">Writing systems</text>
    <text x="574" y="88" class="group-label">Writing systems</text>
    ${chipRow(left.scripts, 0, 108, 460, { variant: "strong" })}
    ${chipRow(right.scripts, 574, 108, 444, { variant: "plain" })}

    <text x="0" y="218" class="group-label">OpenType features</text>
    <text x="574" y="218" class="group-label">OpenType features</text>
    ${chipRow(left.features, 0, 238, 500, { variant: "strong" })}
    ${chipRow(right.features, 574, 238, 444, { variant: "plain" })}
  </g>

  <g transform="translate(66 680)">
    <line x1="0" y1="0" x2="1018" y2="0" class="rule"/>
    <text x="0" y="24" class="body">Language counts: Hyperglot 0.8.1, primary living orthographies, base character support.</text>
  </g>
</svg>
`;

  const outputPath = path.join(outputDir, `comparison-monolisa-vs-${comparison.key}-summary.svg`);
  writeFileSync(outputPath, svg.replace(/[ \t]+$/gm, ""));
  console.log(path.relative(root, outputPath));
}

render();
