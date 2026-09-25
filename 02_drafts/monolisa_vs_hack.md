---
title: "Comparison of MonoLisa vs. Hack"
published: YYYY-MM-DD
updated: 2026-09-25
draft: true
keywords:
  [
    "MonoLisa vs Hack",
    "Hack font alternative",
    "coding fonts",
    "programming fonts",
  ]
authors: ["Juho Vepsäläinen", "Marcus Sterz"]
---

If Regular looks too light and Bold too heavy in your editor, these fonts give you different choices: Hack supplies those two weights, while MonoLisa offers intermediate weights and variable adjustment. The code samples also show Hack's separate operators beside MonoLisa's optional ligatures.

## Reading texture

The `next !== ""` condition shows one difference in the code: MonoLisa joins `!==` into one symbol, while Hack leaves three characters. Hack's version of the same function also occupies less horizontal space at this size, visible along the first line.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-hack-texture-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-hack-texture.svg" alt="Rendered SVG comparing MonoLisa and Hack code texture" width="100%" />
</picture>

## Coding ligatures and character variants

Hack displays `!==` as three characters and `->` as a hyphen followed by an angle. MonoLisa's optional ligatures join each sequence while preserving the code you typed; turn them off if you prefer to see the separate operators.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-hack-ligatures-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-hack-ligatures.svg" alt="Rendered SVG comparing MonoLisa and Hack operator and ligature behavior" width="100%" />
</picture>

## Characters that are easy to confuse

Compare the zeros: Hack has an oval fill, while MonoLisa has a small square dot. Then follow `1lI|` and `rn m` to see which details keep the characters distinct. Ligatures are disabled in this specimen.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-hack-glyphs-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-hack-glyphs.svg" alt="Enlarged zeros with circles around the square dot in MonoLisa Code and oval fill in Hack, followed by the full character sample" width="100%" />
</picture>

## Italics and style range

MonoLisa's italic `f` curls below the baseline; Hack's ends on it, as `if` shows. Weight is another practical difference: Hack's measured family has Regular and Bold, while MonoLisa offers weights between them for adjusting how dark your comments and code appear.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-hack-italics-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-hack-italics.svg" alt="Rendered SVG comparing MonoLisa and Hack italic and style samples" width="100%" />
</picture>

## Terminal symbols

Both fonts include the prompt separators, table borders, and block characters shown here. Use the vertical table edges to check whether the borders remain continuous at your terminal's line-height setting; extra space between rows can change the result you see.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-hack-terminal-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-hack-terminal.svg" alt="Matching terminal windows with colored Powerline prompts, box-drawing tables, block progress bars, and status lines in MonoLisa Code and Hack" width="100%" />
</picture>

## Which font should you choose?

Choose Hack for a free font with a small set of styles and separate operators. Try MonoLisa if you want joined operators or finer control over stroke weight. Start with the operator shapes above, then use the tester to explore weights between Regular and Bold.

## Try MonoLisa in your editor

The [free trial](https://www.monolisa.dev/buy/trial) includes Regular and Bold with a limited character set. Use it to judge letterforms in your editor; explore coding ligatures, OpenType features, and grade adjustment in the [online tester](https://www.monolisa.dev/tester), since those are omitted from the trial. See [checkout](https://www.monolisa.dev/buy/) for current pricing.

## At a glance

| Category | MonoLisa Code | Hack |
| ---------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Languages\*** | 593 | 382 |
| **Writing systems** | 5 (Latin, Cyrillic, Greek, Hebrew, Armenian) | 4 (Latin, Cyrillic, Armenian, Greek) |
| **Italics** | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> |
| **Fixed weights** | 10 | 2 |
| **Variable axes** | 2 (`wght`, `GRAD`) | None measured |
| **Style control** | 15 stylistic sets, 12 character variants | None measured |
| **Coding ligatures** | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> | No |
| **Terminal symbols** | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> |
| **Proportional counterpart** | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>, MonoLisa Text | No obvious proportional counterpart |
| **Price** | Paid, including [free trial access](https://monolisa.dev/buy/trial) and a customizer | Free and open source |
| **Source** | [monolisa.dev](https://www.monolisa.dev/) | [Hack GitHub repository](https://github.com/source-foundry/Hack) |

<details>
  <summary>View comparison infographic</summary>

  <img src="/images/comparison-monolisa-vs-hack-summary.svg" alt="Summary infographic comparing MonoLisa and Hack" width="100%" />
</details>

## Measurement notes

The terminal windows use identical text at a nominal 22 px with 33 px table line spacing, ligatures disabled, and the same theme colors. Powerline separators and standard Unicode block progress bars come from each font's own outlines. Segment backgrounds follow measured glyph advances; missing characters retain the font's missing-glyph outline with no fallback. Actual terminal line-height and fallback settings may change the joins. Regenerate with `node scripts/render-comparison-svgs.mjs scripts/comparison-fonts.local.json --terminal-only`.

\* Language counts use [Hyperglot 0.8.1](https://github.com/rosettatype/hyperglot), run locally with primary orthographies, living languages, and base-character support. Shaping is disabled. The command was:

```bash
.venv-hyperglot/bin/hyperglot --no-shaping --orthography primary --status living --check base <font-file>
```

Measured feature summary: MonoLisa exposes `liga`, `dlig`, `calt`, `zero`, `ss01`-`ss15`, and `cv01`-`cv12`. Hack exposes `aalt`, `frac`, `locl`, `ordn`, `sinf`, `subs`, and `sups`; no coding ligature feature set measured.

MonoLisa Code measured as variable upright and italic files with 10 named weights: Hairline, Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, and Black. The Hack v3.003 TTF archive includes 2 weights, Regular and Bold, each with upright and italic styles.

Hack measured at Powerline 6/6, box drawing 128/128, and block elements 32/32. Its typo metrics and line gap differ from hhea/Windows metrics in v3.003.

For comparison, MonoLisa measured at Powerline 6/6, box drawing 128/128, block elements 32/32, with aligned hhea, OS/2 typo, and Windows vertical metrics.

{/* Editorial review before publication: Marcus to review the design observations and recommendation; verify measured data against the intended font versions; visually review all specimens, including the added glyph comparison; confirm license/source basis and set the publication date. */}

The enlarged details use the same font files as the complete specimens, at equal nominal sizes for both fonts. Glyphs are centered independently without changing their proportions. The circles are annotations behind the original outlines; upright and italic details use their respective font files. Regenerate them with `node scripts/render-comparison-svgs.mjs scripts/comparison-fonts.local.json --focus-only`.
