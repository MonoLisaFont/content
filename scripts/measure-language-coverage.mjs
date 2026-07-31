#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const configPath = process.argv[2] || "scripts/comparison-fonts.local.json";
const fallbackConfigPath = "scripts/comparison-fonts.json";
const outputPath = process.argv[3] || "01_ideas/comparison_language_coverage.json";
const hyperglotPath = path.join(root, ".venv-hyperglot", "bin", "hyperglot");

if (!existsSync(hyperglotPath)) {
  fail("Hyperglot is not installed. Run: python3 -m venv .venv-hyperglot && .venv-hyperglot/bin/python -m pip install hyperglot");
}

const config = JSON.parse(
  readFileSync(existsSync(configPath) ? configPath : fallbackConfigPath, "utf8"),
);

const options = [
  "--no-shaping",
  "--orthography",
  "primary",
  "--status",
  "living",
  "--check",
  "base",
];

const results = {
  generated: new Date().toISOString().slice(0, 10),
  tool: "Hyperglot 0.8.1",
  command:
    ".venv-hyperglot/bin/hyperglot --no-shaping --orthography primary --status living --check base <font-file>",
  methodology: "Primary orthographies, living languages, base character support, shaping disabled.",
  languageListMethodology:
    "For each font, the recorded command is run and language names are parsed from Hyperglot's supported-language summary, then grouped by script. Entries represent orthography-script matches, so a language can appear under more than one script.",
  options,
  fonts: {},
};

for (const [key, font] of Object.entries(config.fonts || {})) {
  const regularPath = font.regular ? path.resolve(root, font.regular) : null;
  if (!regularPath || !existsSync(regularPath)) {
    results.fonts[key] = {
      label: font.label || key,
      skipped: true,
      reason: "regular font file not found",
    };
    continue;
  }

  const result = spawnSync(hyperglotPath, [...options, regularPath], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
  });

  if (result.status !== 0) {
    results.fonts[key] = {
      label: font.label || key,
      skipped: true,
      reason: result.stderr.trim() || result.stdout.trim() || "Hyperglot failed",
    };
    continue;
  }

  results.fonts[key] = parseSummary(font.label || key, regularPath, result.stdout);
}

mkdirSync(path.dirname(path.resolve(root, outputPath)), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`);
console.log(outputPath);

for (const [key, item] of Object.entries(results.fonts)) {
  if (item.skipped) {
    console.log(`${key}: skipped (${item.reason})`);
    continue;
  }
  const totalLanguages = item.totalLanguages;
  const scripts = Object.entries(item.scripts)
    .map(([script, count]) => `${script} ${count}`)
    .join(", ");
  console.log(`${key}: ${totalLanguages} languages; ${scripts}`);
}

function parseSummary(label, fontPath, stdout) {
  const scripts = {};
  const languagesByScript = {};
  const scriptPattern = /(\d+) languages? of ([^\n]+?) script:\n-+\n([^\n]+)/g;
  for (const match of stdout.matchAll(scriptPattern)) {
    const count = Number(match[1]);
    const script = match[2].trim();
    const languages = match[3].split(", ").map((language) => language.trim());

    if (languages.length !== count) {
      fail(
        `Hyperglot listed ${languages.length} ${script} languages for ${label}, expected ${count}`,
      );
    }

    scripts[script] = count;
    languagesByScript[script] = languages;
  }

  const totalMatch = stdout.match(/(\d+) languages supported in total\./);
  const speakersMatch = stdout.match(/([0-9.]+[KMBT]?) speakers in total\./);

  return {
    label,
    path: displayPath(fontPath),
    totalLanguages: totalMatch ? Number(totalMatch[1]) : null,
    totalSpeakers: speakersMatch ? speakersMatch[1] : null,
    scripts,
    languagesByScript,
  };
}

function displayPath(fontPath) {
  const relative = path.relative(root, fontPath);
  if (!relative.startsWith("..") && !path.isAbsolute(relative)) return relative;
  return `[system font] ${path.basename(fontPath)}`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
