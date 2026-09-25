// The landing page's terminal treatment, using each compared font's own
// outlines. Only window chrome and colored segment backgrounds are drawn.
const colors = {
  background: "var(--ml-colors-background, #122a40)",
  text: "var(--ml-colors-text, #cce5ff)",
  muted: "var(--ml-colors-muted, #1b3850)",
  border: "var(--ml-colors-border, #33516b)",
  comment: "var(--ml-colors-comment, #839db6)",
  blue: "var(--ml-colors-attribute, #82b8ff)",
  green: "var(--ml-colors-string, #b8d4a0)",
  yellow: "var(--ml-colors-keyword, #e8c44a)",
  orange: "var(--ml-colors-number, #e18d5f)",
};

const table = [
  "┌──────────┬──────┬───────┐",
  "│ File     │ Test │ Lines │",
  "├──────────┼──────┼───────┤",
  "│ index.ts │ pass │   142 │",
  "│ utils.ts │ pass │    38 │",
  "└──────────┴──────┴───────┘",
];

export function renderTerminalComparison({ competitorKey, fonts, stacked, renderLine, esc }) {
  const panelWidth = 440;
  const panelHeight = 638;
  const gap = 28;
  const width = stacked ? panelWidth : panelWidth * 2 + gap;
  const height = stacked ? panelHeight * 2 + gap : panelHeight;
  const sample = { fontSize: 22, features: "kern=0,liga=0,calt=0", measureLayout: true };
  const lineHeight = 33;
  const baselineOffset = 24.2;

  const panels = fonts.map((font, fontIndex) => {
    const prefix = `${competitorKey}-terminal-${stacked ? "mobile" : "desktop"}-${fontIndex}`;
    const elements = [];
    let serial = 0;
    let missing = 0;

    function text(value, x, baseline, fill = colors.text, role = "sample", settings = {}) {
      const fragment = renderLine(font, { ...sample, ...settings }, value, `${prefix}-${serial++}`, fill);
      if (role === "sample") missing += fragment.missingGlyphs;
      elements.push(`<g class="terminal-${role}" data-text="${esc(value)}" transform="translate(${x - fragment.originX}, ${baseline - fragment.baselineY})">${fragment.inner}</g>`);
      return fragment.advanceWidth;
    }

    function rect(x, y, w, h, fill) {
      elements.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" />`);
    }

    function label(value, y) {
      text(value, 20, y, colors.comment, "section-label", { fontSize: 17 });
    }

    function segments(items, x, y) {
      const painted = [];
      // Paint every background before glyphs, preserving any deliberate
      // outline overlap at the joins between adjacent character cells.
      for (const [index, item] of items.entries()) {
        const fragment = renderLine(font, sample, item.value, `${prefix}-${serial++}`, item.fg);
        missing += fragment.missingGlyphs;
        rect(x, y, fragment.advanceWidth, lineHeight, item.bg);
        painted.push(`<g class="terminal-sample" data-text="${esc(item.value)}" transform="translate(${x - fragment.originX}, ${y + baselineOffset - fragment.baselineY})">${fragment.inner}</g>`);
        x += fragment.advanceWidth;
        const arrow = renderLine(font, sample, "\uE0B0", `${prefix}-${serial++}`, item.bg);
        missing += arrow.missingGlyphs;
        rect(x, y, arrow.advanceWidth, lineHeight, items[index + 1]?.bg ?? colors.background);
        painted.push(`<g class="terminal-sample terminal-separator" data-text="\uE0B0" transform="translate(${x - arrow.originX}, ${y + baselineOffset - arrow.baselineY})">${arrow.inner}</g>`);
        x += arrow.advanceWidth;
      }
      elements.push(...painted);
      if (x > panelWidth - 16) throw new Error(`Terminal prompt overflows for ${font.label}`);
    }

    const labelText = competitorKey === "monaspace" && fontIndex === 1 ? "Monaspace Neon" : font.label;
    rect(0, 0, panelWidth, panelHeight, colors.background);
    rect(0, 0, panelWidth, 46, colors.muted);
    [colors.orange, colors.green, colors.yellow].forEach((fill, i) => {
      elements.push(`<circle cx="${18 + i * 17}" cy="23" r="5" fill="${fill}" />`);
    });
    // Window labels use MonoLisa consistently; specimens use the named font.
    const title = renderLine(fonts[0], { ...sample, fontSize: 17 }, labelText, `${prefix}-title`, colors.text);
    elements.push(`<g class="terminal-title" transform="translate(${(panelWidth - title.advanceWidth) / 2 - title.originX}, ${29 - title.baselineY})">${title.inner}</g>`);

    label("Shell prompt", 77);
    segments([
      { value: " dev ", bg: colors.blue, fg: colors.background },
      { value: " ~/app ", bg: colors.green, fg: colors.background },
      { value: " \uE0A0 main ", bg: colors.muted, fg: colors.text },
    ], 20, 91);

    label("Box drawing", 167);
    table.forEach((line, index) => {
      const advance = text(line, 20, 202 + index * lineHeight);
      if (advance > panelWidth - 40) throw new Error(`Terminal table overflows for ${font.label}`);
    });

    label("Block elements", 413);
    for (const [index, row] of [
      ["Build ", "█████░░░", "  62%", colors.blue],
      ["Tests ", "████████", " 100%", colors.green],
    ].entries()) {
      const baseline = 452 + index * (lineHeight + 7);
      let x = 20;
      x += text(row[0], x, baseline, colors.comment);
      x += text(row[1], x, baseline, row[3]);
      text(row[2], x, baseline, colors.orange);
    }

    label("Status line", 539);
    segments([
      { value: " NORMAL ", bg: colors.yellow, fg: colors.background },
      { value: " index.ts ", bg: colors.blue, fg: colors.background },
      { value: " 42:15 ", bg: colors.muted, fg: colors.text },
    ], 20, 555);

    if (missing) text("Missing glyphs: no fallback", 20, 618, colors.comment, "coverage-note", { fontSize: 14 });
    const x = stacked ? 0 : fontIndex * (panelWidth + gap);
    const y = stacked ? fontIndex * (panelHeight + gap) : 0;
    return `<g class="terminal-window" data-font="${esc(labelText)}" data-missing-glyphs="${missing}" transform="translate(${x}, ${y})">
      <defs><clipPath id="${prefix}-clip"><rect x="0.5" y="0.5" width="${panelWidth - 1}" height="${panelHeight - 1}" rx="9" /></clipPath></defs>
      <g clip-path="url(#${prefix}-clip)">${elements.join("\n")}</g>
      <rect x="0.5" y="0.5" width="${panelWidth - 1}" height="${panelHeight - 1}" rx="9" fill="none" stroke="${colors.border}" />
    </g>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  <title>Terminal symbols: ${esc(fonts[0].label)} vs. ${esc(fonts[1].label)}</title>
  <desc>Matching terminal windows with a colored Powerline prompt, box-drawing table, Unicode block progress bars, and a status line. Both fonts use the same text at 22 units with a 33-unit line height. Missing characters use the measured font's missing-glyph outline, with no fallback font. Progress bars use standard Unicode blocks, not MonoLisa-specific symbols.</desc>
  ${panels.join("\n")}
</svg>
`;
}
