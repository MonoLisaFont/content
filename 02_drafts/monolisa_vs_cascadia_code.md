---
title: "Comparison of MonoLisa vs. Cascadia Code"
published: YYYY-MM-DD
updated: 2026-09-25
draft: true
keywords:
  [
    "MonoLisa vs Cascadia Code",
    "Cascadia Code alternative",
    "coding fonts",
    "programming fonts",
  ]
authors: ["Juho Vepsäläinen", "Marcus Sterz"]
---

If you want a free font with italics and coding ligatures, Cascadia Code covers both. The specimens show how its tighter lines and round punctuation compare with MonoLisa's wider letters and square dots; terminal users should also check the Powerline difference below.

## Reading texture

The first `parseToken` line runs farther across the MonoLisa panel at the same nominal size. Cascadia's narrower characters make a more compact block; the square brackets around `input[offset + 1]` give you another place to see the difference in width.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-cascadia-code-texture-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-cascadia-code-texture.svg" alt="Rendered SVG comparing MonoLisa and Cascadia Code code texture" width="100%" />
</picture>

## Coding ligatures and character variants

In `<=` and `>=`, MonoLisa's lower stroke follows the angle, while Cascadia places a horizontal bar beneath it. Both fonts join the arrows and `!==`, so you can compare the operator shapes without changing the underlying code.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-cascadia-code-ligatures-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-cascadia-code-ligatures.svg" alt="Rendered SVG comparing MonoLisa and Cascadia Code operator and ligature behavior" width="100%" />
</picture>

## Characters that are easy to confuse

Look at the periods and colons: MonoLisa's dots are square, while Cascadia's are round. Then compare `1lI|` to see how each font separates one, lowercase l, capital I, and the vertical bar. This specimen disables ligatures.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-cascadia-code-glyphs-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-cascadia-code-glyphs.svg" alt="Enlarged square and round punctuation dots highlighted with circles in MonoLisa Code and Cascadia Code, followed by the full character sample" width="100%" />
</picture>

## Italics and style range

Both fonts give italic `f` a curved ending below the baseline, visible in `if`. The surrounding letters differ in shape and slant; `alpha` and the longer `readableIdentifier` show how those choices look across a whole word.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-cascadia-code-italics-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-cascadia-code-italics.svg" alt="Rendered SVG comparing MonoLisa and Cascadia Code italic and style samples" width="100%" />
</picture>

## Terminal symbols

The files shown here both include table borders and block characters. Cascadia's standard Code build lacks the Powerline symbols in the prompt and status line; its separate PL build provides them, so these missing glyphs describe the standard build only.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-cascadia-code-terminal-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-cascadia-code-terminal.svg" alt="Matching terminal windows with colored Powerline prompts, box-drawing tables, block progress bars, and status lines in MonoLisa Code and Cascadia Code" width="100%" />
</picture>

## Which font should you choose?

Cascadia Code is a free option with both italics and ligatures. Try MonoLisa if you prefer its wider letterforms and square punctuation, or want to fine-tune stroke thickness without changing line lengths; judge those differences at the size you normally use.

## Try MonoLisa in your editor

The [free trial](https://www.monolisa.dev/buy/trial) includes Regular and Bold with a limited character set. Use it to judge letterforms in your editor; explore coding ligatures, OpenType features, and grade adjustment in the [online tester](https://www.monolisa.dev/tester), since those are omitted from the trial. See [checkout](https://www.monolisa.dev/buy/) for current pricing.

## At a glance

| Category | MonoLisa Code | Cascadia Code |
| ---------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Languages\*** | 593 | 513 |
| **Writing systems** | 5 (Latin, Cyrillic, Greek, Hebrew, Armenian) | 4 (Latin, Cyrillic, Arabic, Greek) |
| **Italics** | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> |
| **Fixed weights** | 10 | 6 |
| **Variable axes** | 2 (`wght`, `GRAD`) | 1 (`wght`) |
| **Style control** | 15 stylistic sets, 12 character variants | 3 stylistic sets recorded |
| **Coding ligatures** | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> |
| **Terminal symbols** | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> | Box drawing and block elements measured; standard build measured without Powerline |
| **Proportional counterpart** | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>, MonoLisa Text | No obvious proportional counterpart |
| **Price** | Paid, including [free trial access](https://monolisa.dev/buy/trial) and a customizer | Free and open source |
| **Source** | [monolisa.dev](https://www.monolisa.dev/) | [Cascadia Code GitHub repository](https://github.com/microsoft/cascadia-code) |

<details>
  <summary>View comparison infographic</summary>

  <img src="/images/comparison-monolisa-vs-cascadia-code-summary.svg" alt="Summary infographic comparing MonoLisa and Cascadia Code" width="100%" />
</details>

## Measurement notes

The terminal windows use identical text at a nominal 22 px with 33 px table line spacing, ligatures disabled, and the same theme colors. Powerline separators and standard Unicode block progress bars come from each font's own outlines. Segment backgrounds follow measured glyph advances; missing characters retain the font's missing-glyph outline with no fallback. Actual terminal line-height and fallback settings may change the joins. Regenerate with `node scripts/render-comparison-svgs.mjs scripts/comparison-fonts.local.json --terminal-only`.

\* Language counts use [Hyperglot 0.8.1](https://github.com/rosettatype/hyperglot), run locally with primary orthographies, living languages, and base-character support. Shaping is disabled. The command was:

```bash
.venv-hyperglot/bin/hyperglot --no-shaping --orthography primary --status living --check base <font-file>
```

Measured feature summary: MonoLisa exposes `liga`, `dlig`, `calt`, `zero`, `ss01`-`ss15`, and `cv01`-`cv12`. Cascadia Code exposes `calt`, `rclt`, `rlig`, `zero`, `ss02`, `ss19`, and `ss20`.

MonoLisa Code measured as variable upright and italic files with 10 named weights: Hairline, Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, and Black. The Cascadia Code v2407.024 archive includes 6 named weights: ExtraLight, Light, SemiLight, Regular, SemiBold, and Bold; the variable and static upright/italic builds expose that same weight range across the Code/Mono variants.

The measured standard Cascadia Code build has Powerline 0/6, box drawing 128/128, and block elements 32/32. Its Windows ascent differs from hhea/OS/2 typo metrics in v2407.024, so terminal line metrics should be checked in target apps.

For comparison, MonoLisa measured at Powerline 6/6, box drawing 128/128, block elements 32/32, with aligned hhea, OS/2 typo, and Windows vertical metrics.

{/* Editorial review before publication: Marcus to review the design observations and recommendation; verify measured data against the intended font versions; visually review all specimens, including the added glyph comparison; confirm license/source basis and set the publication date. */}

The enlarged details use the same font files as the complete specimens, at equal nominal sizes for both fonts. Glyphs are centered independently without changing their proportions. The circles are annotations behind the original outlines; upright and italic details use their respective font files. Regenerate them with `node scripts/render-comparison-svgs.mjs scripts/comparison-fonts.local.json --focus-only`.
