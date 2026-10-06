// Grade and zero alternatives use the measured font outlines, not fallback text.
const primary = "var(--comparison-primary, var(--ml-colors-text, currentColor))";
const accent = "var(--comparison-accent, var(--ml-colors-primary, #f4cc50))";
const plainFeatures = "kern=0,liga=0,dlig=0,calt=0";

function document(width, height, title, description, body, esc) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="${primary}">
  <title>${esc(title)}</title>
  <desc>${esc(description)}</desc>
  <style>
    .specimen-label, .control-caption { opacity: 0.62; }
    .focus-circle { fill: ${accent}; fill-opacity: 0.28; }
  </style>
  ${body.join("\n")}
</svg>
`;
}

export function renderComparisonControls({ kind, fonts, stacked, renderLine, renderLabel, esc }) {
  const mono = fonts[0];
  let serial = 0;
  const prefix = `jetbrains-mono-${kind}-${stacked ? "mobile" : "desktop"}`;
  const body = [];

  function fragment(font, value, settings = {}) {
    const rendered = renderLine(font, {
      fontSize: 20,
      features: plainFeatures,
      variations: "wght=400,GRAD=0",
      measureLayout: true,
      ...settings,
    }, value, `${prefix}-${serial++}`, primary);
    if (rendered.missingGlyphs) throw new Error(`Missing glyphs in ${kind}: ${font.label}`);
    return rendered;
  }

  function text(rendered, x, baseline, className = "") {
    body.push(`<g${className ? ` class="${className}"` : ""} transform="translate(${x - rendered.originX}, ${baseline - rendered.baselineY})">${rendered.inner}</g>`);
  }

  function caption(value, center, baseline) {
    const rendered = fragment(mono, value, { fontSize: 18 });
    text(rendered, center - rendered.advanceWidth / 2, baseline, "control-caption");
  }

  if (kind === "variants") {
    // Font pairs remain adjacent on mobile; each font's two forms stack.
    const panelWidth = stacked ? 264 : 560;
    const gap = stacked ? 32 : 48;
    const width = panelWidth * 2 + gap;
    const height = stacked ? 464 : 260;
    fonts.forEach((font, fontIndex) => {
      const panelX = fontIndex * (panelWidth + gap);
      body.push(renderLabel(font.label, panelX, 30, `${prefix}-label-${fontIndex}`, stacked ? 23 : 20));
      [0, 1].forEach((alternate) => {
        const center = panelX + (stacked ? panelWidth / 2 : panelWidth * (alternate + 0.5) / 2);
        const rowY = 60 + (stacked ? alternate * 204 : 0);
        const settings = { features: `${plainFeatures},zero=${alternate}` };
        caption(alternate ? "Alternate" : "Default", center, rowY + 18);

        const glyph = fragment(font, "0", { ...settings, fontSize: 88, measureInk: true });
        const { ink } = glyph;
        const origin = center - ink.x - ink.width / 2;
        const baseline = rowY + 118;
        body.push(`<circle class="focus-circle" cx="${center}" cy="${baseline + ink.y + ink.height / 2}" r="14" />`);
        body.push(`<g data-font="${esc(font.label)}" data-zero="${alternate}">`);
        text(glyph, origin, baseline);
        const code = fragment(font, "port = 8080;", settings);
        text(code, center - code.advanceWidth / 2, rowY + 172);
        body.push("</g>");
      });
    });
    return document(width, height,
      "Default and alternate zeros: MonoLisa Code vs. JetBrains Mono",
      "Both fonts' default and zero-feature alternate forms, enlarged at 88 px with circles marking the interiors. The same port = 8080; sample follows each form at 20 px. Both fonts use Regular; MonoLisa grade is zero. Font pairs remain adjacent on mobile.",
      body, esc);
  }

  if (kind !== "grade") throw new Error(`Unknown comparison control: ${kind}`);
  const width = stacked ? 560 : 1168;
  const height = stacked ? 416 : 336;
  const fontSize = stacked ? 28 : 36;
  const x = stacked ? 0 : 280;
  const rows = [-50, 0, 50].map((grade) => ({
    grade,
    rendered: fragment(mono, "const count = 100;", {
      fontSize,
      variations: `wght=400,GRAD=${grade}`,
    }),
  }));
  const advance = rows[0].rendered.advanceWidth;
  if (rows.some(({ rendered }) => Math.abs(rendered.advanceWidth - advance) > 1 / 64)) {
    throw new Error("Grade specimen changed advance width; check the font and variation settings.");
  }
  if (x + advance > width - 16) throw new Error("Grade specimen overflows its canvas.");

  body.push(renderLabel("MonoLisa Code", 0, 30, `${prefix}-label`, 20));
  rows.forEach(({ grade, rendered }, index) => {
    const baseline = stacked ? 116 + index * 112 : 96 + index * 80;
    const label = `Grade ${grade > 0 ? "+" : grade < 0 ? "−" : ""}${Math.abs(grade)}`;
    text(fragment(mono, label), 0, stacked ? baseline - 42 : baseline, "control-caption");
    body.push(`<g data-grade="${grade}" data-advance="${rendered.advanceWidth}">`);
    text(rendered, x, baseline);
    body.push("</g>");
  });
  text(fragment(mono, "Regular weight at all three grades", { fontSize: 18 }), 0,
    stacked ? 398 : 318, "control-caption");
  return document(width, height,
    "MonoLisa Code grade adjustment at a fixed Regular weight",
    `The same line at wght 400 and GRAD -50, 0, and +50, showing progressively thicker strokes at the same Regular weight. All three lines have a measured advance of ${advance} SVG units at ${fontSize} px. Fixed spacing also holds when weight changes in MonoLisa Code and JetBrains Mono; it is not a grade-specific advantage in this comparison. Ligatures are disabled; no glyphs are replaced or scaled independently.`,
    body, esc);
}
