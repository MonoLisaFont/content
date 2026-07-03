#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const configPath = process.argv[2] || "scripts/comparison-fonts.local.json";
const fallbackConfigPath = "scripts/comparison-fonts.json";
const config = JSON.parse(
  readFileSync(existsSync(configPath) ? configPath : fallbackConfigPath, "utf8"),
);

function pythonCommand() {
  const fonttoolsPath = spawnSync("zsh", ["-lc", "command -v fonttools"], {
    cwd: root,
    encoding: "utf8",
  }).stdout.trim();

  if (fonttoolsPath && existsSync(fonttoolsPath)) {
    const firstLine = readFileSync(fonttoolsPath, "utf8").split(/\n/)[0];
    if (firstLine.startsWith("#!")) return firstLine.slice(2).trim();
  }

  return "python3";
}

const python = String.raw`
import json
import sys
from fontTools.ttLib import TTFont

font_path = sys.argv[1]
font = TTFont(font_path, lazy=False)

def names(name_id):
    values = []
    for n in font["name"].names:
        if n.nameID == name_id:
            try:
                value = n.toUnicode()
            except Exception:
                continue
            if value not in values:
                values.append(value)
    return values

features = set()
for table_name in ("GSUB", "GPOS"):
    if table_name in font:
        table = font[table_name].table
        if getattr(table, "FeatureList", None):
            for record in table.FeatureList.FeatureRecord:
                features.add(record.FeatureTag)

cmap = {}
for table in font["cmap"].tables:
    cmap.update(table.cmap)

metrics = {}
if "hhea" in font:
    metrics["hhea_ascent"] = font["hhea"].ascent
    metrics["hhea_descent"] = font["hhea"].descent
    metrics["hhea_line_gap"] = font["hhea"].lineGap
if "OS/2" in font:
    os2 = font["OS/2"]
    metrics["typo_ascender"] = os2.sTypoAscender
    metrics["typo_descender"] = os2.sTypoDescender
    metrics["typo_line_gap"] = os2.sTypoLineGap
    metrics["win_ascent"] = os2.usWinAscent
    metrics["win_descent"] = os2.usWinDescent

coverage_checks = {
    "powerline": [0xE0A0, 0xE0A1, 0xE0B0, 0xE0B1, 0xE0B2, 0xE0B3],
    "box_drawing": list(range(0x2500, 0x2580)),
    "block_elements": list(range(0x2580, 0x25A0)),
}

coverage = {}
for key, codepoints in coverage_checks.items():
    present = sum(1 for cp in codepoints if cp in cmap)
    coverage[key] = {"present": present, "total": len(codepoints)}

print(json.dumps({
    "family": names(1),
    "subfamily": names(2),
    "full_name": names(4),
    "version": names(5),
    "features": sorted(features),
    "glyph_count": len(font.getGlyphOrder()),
    "cmap_count": len(cmap),
    "metrics": metrics,
    "coverage": coverage,
}, indent=2, ensure_ascii=False))
`;

for (const [key, font] of Object.entries(config.fonts)) {
  const regular = font.regular && path.resolve(root, font.regular);
  if (!regular || !existsSync(regular)) {
    console.warn(`Skipping ${key}: missing ${font.regular || "(not configured)"}`);
    continue;
  }

  const result = spawnSync(pythonCommand(), ["-c", python, regular], {
    cwd: root,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    console.warn(`Could not inspect ${key}: ${result.stderr.trim()}`);
    continue;
  }

  console.log(`\n# ${font.label} (${key})`);
  console.log(result.stdout.trim());
}
