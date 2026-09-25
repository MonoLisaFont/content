#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "social_media/devto");
const designs = JSON.parse(readFileSync(resolve(root, "scripts/devto-cover-designs.json")));
const config = JSON.parse(readFileSync(resolve(root, process.env.COMPARISON_FONT_CONFIG ||
  (existsSync(resolve(root, "scripts/comparison-fonts.local.json"))
    ? "scripts/comparison-fonts.local.json" : "scripts/comparison-fonts.json"))));
const fonts = {
  code: config.fonts.monolisa.regular,
  italic: config.fonts.monolisa.italic,
  text: process.env.MONOLISA_TEXT_FONT || "/Library/Fonts/MonoLisaTextUpright.ttf",
  serif: process.env.SERIF_FONT || "/System/Library/Fonts/Supplemental/Georgia.ttf",
};
const C = { navy: "#102f45", cream: "#f6efdf", gold: "#f4cc50", blue: "#a9c5d5", muted: "#416378", line: "#315369" };
let serial = 0;
const escape = (v) => String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const rect = (x, y, w, h, fill, radius = 0, stroke = "none", sw = 1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const circle = (x, y, r, fill, opacity = 1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${opacity}"/>`;
const path = (d, stroke = C.gold, width = 4, extra = "") =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

// HarfBuzz shapes the actual font; SVG stores outlines, never font files.
function type(value, x, y, size, options = {}) {
  const file = resolve(root, options.font || fonts.text);
  if (!existsSync(file)) throw new Error(`Missing font: ${file}`);
  const args = ["--output-format=svg", `--font-size=${size}`,
    `--features=${options.features || "kern=1,liga=1,calt=1"}`,
    `--variations=wght=${options.weight || 500}`];
  if (options.slant) args.push(`--font-slant=${Math.tan(options.slant * Math.PI / 180)}`);
  const result = spawnSync("hb-view", [...args, "--", file, value], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "Install HarfBuzz (hb-view).");
  const svg = result.stdout;
  const width = Number(svg.match(/viewBox="[^"]*? ([\d.]+) [\d.]+"/)?.[1]) - 32;
  const baseline = Number(svg.match(/<use[^>]*\sy="([^"]+)"/)?.[1]);
  if (!Number.isFinite(width) || !Number.isFinite(baseline)) throw new Error("Unexpected hb-view SVG.");
  const id = `cover-${serial++}`;
  const fill = options.fill || C.navy;
  const inner = svg.replace(/<\?xml[^>]*>\s*/g, "").replace(/<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "").replace(/<rect[^>]*>\s*/g, "")
    .replace(/id="([^"]+)"/g, `id="${id}-$1"`)
    .replace(/(xlink:href|href)="#([^"]+)"/g, `$1="#${id}-$2"`)
    .replace(/fill="rgb\(0%, 0%, 0%\)"/g, `fill="${fill}"`)
    .replace(/fill="rgb\(100%, 100%, 100%\)"/g, 'fill="none"');
  const scale = Math.min(1, (options.maxWidth || Infinity) / width);
  const offset = options.center ? width * scale / 2 : 0;
  return `<g transform="translate(${x - offset} ${y}) scale(${scale}) translate(-16 ${-baseline})">${inner}</g>`;
}

function bars(x, y, widths, color = C.blue, gap = 19) {
  return widths.map((w, i) => rect(x + (i % 3 === 1 ? 20 : 0), y + gap * i, w, 7, color, 3)).join("");
}

function motif(kind) {
  const code = (s, x, y, size = 90, opts = {}) => type(s, x, y, size, { font: fonts.code, fill: C.cream, ...opts });
  switch (kind) {
    case "editor":
      return rect(606, 88, 326, 246, C.navy, 9, C.muted, 2) +
        path("M606 123H932", C.muted, 2) + [627, 644, 661].map(x => circle(x, 106, 4, C.blue)).join("") +
        code("Aa", 639, 228, 100) + rect(779, 152, 3, 83, C.gold) +
        bars(639, 264, [199, 147, 174], C.muted, 17);
    case "release":
      return code("Aa", 608, 211, 140, { fill: C.blue }) +
        type("Aa", 754, 328, 152, { font: fonts.text, fill: C.gold }) +
        code("CODE", 619, 260, 15, { fill: C.blue }) + code("TEXT", 819, 358, 15, { fill: C.gold });
    case "ligatures":
      return code("!=", 759, 179, 126, { center: true, features: "liga=0,calt=0" }) +
        path("M744 214L759 229L774 214 M759 203V229", C.blue, 3) +
        code("!=", 759, 354, 126, { center: true, features: "liga=1,calt=1,dlig=1", fill: C.gold });
    case "serifs":
      return circle(691, 313, 39, C.gold, 0.2) + circle(802, 141, 39, C.gold, 0.2) +
        type("I", 750, 320, 280, { font: fonts.serif, fill: C.cream, center: true });
    case "typography":
      return circle(664, 215, 59, C.gold, 0.13) + code("0Ol", 602, 257, 138) +
        path("M615 289H909", C.muted, 2);
    case "visual":
      return bars(611, 122, [220, 158, 249, 180, 214, 137, 240, 169, 226], C.muted, 23) +
        circle(779, 215, 81, C.blue, 0.1) + path("M703 215H849", C.gold, 9) +
        `<circle cx="779" cy="215" r="81" fill="none" stroke="${C.blue}" stroke-width="2"/>`;
    case "cognitive":
      return path("M621 305C866 306 654 89 801 111C920 129 630 292 729 321C820 348 878 275 898 125", C.muted, 3) +
        path("M621 305C677 305 646 196 731 205S809 125 898 125", C.gold, 5) +
        circle(621, 305, 8, C.cream) + circle(898, 125, 8, C.gold);
    case "mechanical":
      return [[650, 162, "↑"], [650, 246, "↓"], [566, 246, "←"], [734, 246, "→"]].map(([x, y, s], i) =>
        rect(x + 5, y + 6, 74, 69, C.line, 9) + rect(x, y, 74, 69, i === 3 ? C.gold : C.navy, 9, C.muted, 2) +
        code(s, x + 37, y + 45, 30, { center: true, fill: i === 3 ? C.navy : C.cream })).join("") +
        path("M845 283H905 M891 269L905 283L891 297", C.gold, 3);
    case "context":
      return [[611, 106], [658, 161], [705, 216]].map(([x, y], i) =>
        rect(x, y, 207, 118, C.navy, 4, i === 2 ? C.gold : C.muted, 2) +
        path(`M${x} ${y + 27}H${x + 207}`, i === 2 ? C.gold : C.muted, 2) +
        bars(x + 22, y + 50, [108, 133, 89], i === 2 ? C.blue : C.muted, 18)).join("");
    case "process":
      return [153, 212, 271].map(y => path(`M604 ${y}H709Q735 ${y} 753 212H909`, C.muted, 3)).join("") +
        path("M604 212H909", C.gold, 5) + rect(781, 153, 26, 118, C.navy) +
        path("M784 139V194 M784 230V286", C.blue, 5) + circle(696, 212, 9, C.gold) +
        circle(665, 212, 9, C.gold) + circle(634, 212, 9, C.gold);
    case "toolchain":
      return path("M660 213H714 M811 213H867", C.muted, 5) +
        [[600, 172, 0], [718, 133, 1], [852, 225, 2]].map(([x, y, i]) =>
          rect(x, y, 65, 79, C.navy, 7, i === 1 ? C.gold : C.blue, 3) +
          code(i === 0 ? "{ }" : i === 1 ? ">_" : "✓", x + 32, y + 50, 23, { center: true, fill: i === 1 ? C.gold : C.cream })).join("") +
        path("M786 173H822V264H852", C.gold, 3, 'stroke-dasharray="7 8"');
    case "communication":
      return path("M610 111H798V204H678L649 232V204H610Z", C.blue, 3) +
        bars(634, 140, [133, 93], C.blue, 23) +
        rect(720, 220, 196, 94, C.navy) +
        path("M720 220H916V314H879V340L850 314H720Z", C.gold, 3) +
        bars(744, 249, [126, 86], C.gold, 23);
    case "organizational":
      return [621, 750, 879].map(x => path(`M${x} 104V325`, C.muted, 2, 'stroke-dasharray="4 10"')).join("") +
        path("M621 134V213H750V282H879", C.gold, 4) +
        [[621, 134], [621, 282], [750, 134], [750, 213], [879, 134], [879, 282]].map(([x, y], i) =>
          rect(x - 15, y - 15, 30, 30, [0, 3, 5].includes(i) ? C.gold : C.navy, 5, C.blue, 2)).join("");
    case "overview":
      return [135, 211, 287].map((y, i) => path(`M599 ${y}H665L683 ${y - 19}L701 ${y + 19}L719 ${y - 19}L737 ${y + 19}L755 ${y}H910`, i === 1 ? C.gold : C.muted, i === 1 ? 5 : 3)).join("") +
        circle(845, 211, 10, C.gold);
    default: throw new Error(`Unknown motif: ${kind}`);
  }
}

function render(design) {
  let art;
  if (design.kind === "comparison") {
    const other = config.fonts[design.font];
    art = rect(0, 0, 1000, 420, C.navy) +
      type("MonoLisa", 68, 61, 22, { fill: C.cream, weight: 650 }) +
      type("FONT COMPARISON", 770, 60, 14, { fill: C.blue });
    art += path("M500 122V349", C.line, 2) +
      type("MonoLisa Code", 271, 137, 32, { fill: C.cream, center: true }) +
      type(design.label, 735, 137, 32, { fill: C.cream, center: true }) +
      circle(224, 252, 62, C.gold, 0.13) + circle(688, 252, 62, C.gold, 0.13) +
      type("af", 271, 299, 182, { font: fonts.italic, center: true, fill: C.gold, weight: 400 }) +
      type("af", 735, 299, 182, { font: other.italic || other.regular, center: true, fill: C.gold, weight: 400,
        slant: design.font === "fira-code" ? 10 : 0 }) +
      type("Drawn italics", 271, 365, 19, { fill: C.blue, center: true }) +
      type(design.caption, 735, 365, 19, { fill: C.blue, center: true });
  } else {
    art = rect(0, 0, 1000, 420, C.cream) + rect(554, 0, 446, 420, C.navy) +
      type("MonoLisa", 64, 59, 22, { weight: 650 }) +
      type(design.category, 64, 116, 14, { fill: C.muted, weight: 600 });
    const three = design.lines.length === 3;
    design.lines.forEach((line, i) => {
      art += type(line, 61, (three ? 185 : 205) + i * (three ? 63 : 72), 62, { weight: 550, maxWidth: 451 });
    });
    art += type(design.slug.endsWith("_friction") ? "IN SOFTWARE DEVELOPMENT" : "monolisa.dev", 64, 365, 14, { fill: C.muted });
    art += motif(design.kind);
  }
  const title = design.kind === "comparison" ? `MonoLisa Code vs. ${design.label}` : design.lines.join(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="2000" height="840" viewBox="0 0 1000 420" role="img" aria-labelledby="title"><title id="title">${escape(title)}</title>${art}</svg>\n`;
}

const requested = process.argv.slice(2);
if (requested.some(slug => !designs.some(d => d.slug === slug))) throw new Error("Unknown cover slug.");
mkdirSync(output, { recursive: true });
for (const design of designs.filter(d => !requested.length || requested.includes(d.slug))) {
  serial = 0;
  const svg = render(design);
  const base = resolve(output, design.slug);
  writeFileSync(`${base}.svg`, svg);
  const result = spawnSync("rsvg-convert", ["--format=png", "--width=2000", "--height=840", "--output", `${base}.png`], { input: svg });
  if (result.status !== 0) throw new Error(result.stderr?.toString() || "Install librsvg (rsvg-convert).");
  console.log(`Rendered social_media/devto/${design.slug}.{svg,png}`);
}
