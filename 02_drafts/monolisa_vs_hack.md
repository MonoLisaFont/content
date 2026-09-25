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

Hack offers a straightforward setup with Regular, Bold, and their italics. MonoLisa adds coding ligatures and more control over weight and letter variants. The specimens below show whether those differences—and the shapes themselves—would matter in your editor.

## Reading texture

Read the same `parseToken` function in both fonts, following the brackets and commas as well as the letters. Notice the gaps in identifiers and around operators; the combination of dark strokes and empty space gives each block its texture.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-hack-texture-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-hack-texture.svg" alt="Rendered SVG comparing MonoLisa and Hack code texture" width="100%" />
</picture>

## Coding ligatures and character variants

Hack keeps the operators as separate characters; no coding ligature set was measured. Compare its `!==` and arrows with MonoLisa's joined forms. MonoLisa's coding ligatures are optional, so you can also keep the separate-character appearance if that is easier for you to read.

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

Both fonts include italics: compare the `f` in `quickFix` and the repeated letters in `readableIdentifier`. Hack's measured family has two weights; MonoLisa has ten named weights plus variable adjustment, giving you more choices when Regular feels too light or Bold too heavy.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-hack-italics-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-hack-italics.svg" alt="Rendered SVG comparing MonoLisa and Hack italic and style samples" width="100%" />
</picture>

## Terminal symbols

Both fonts cover the Powerline, box-drawing, and block symbols checked here. Compare the colored prompt joins, continuous table borders, and progress bars. Hack's vertical metrics differ between font tables, so also check line spacing in your terminal.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-hack-terminal-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-hack-terminal.svg" alt="Matching terminal windows with colored Powerline prompts, box-drawing tables, block progress bars, and status lines in MonoLisa Code and Hack" width="100%" />
</picture>

## Which font should you choose?

Choose Hack if you like its letterforms and want a free, open-source font with a small set of styles and separate operators. Consider MonoLisa if you prefer its forms, want coding ligatures or finer weight control, or need broader language coverage. Its customizer can save alternate-letter choices for editors with limited feature support.

## Try MonoLisa in your editor

The [free trial](https://www.monolisa.dev/buy/trial) includes Regular and Bold with a limited character set. Use it to judge letterforms in your editor; explore coding ligatures, OpenType features, and grade adjustment in the [online tester](https://www.monolisa.dev/tester), since those are omitted from the trial. See [checkout](https://www.monolisa.dev/buy/) for current pricing.

## Decision table

| Category                     | Better&nbsp;fit | MonoLisa Code                                                                               | Hack                                                                         |
| ---------------------------- | --------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Languages\***              | MonoLisa        | 593                                                                                         | 382                                                                          |
| **Writing systems**          | MonoLisa        | 5 (Latin, Cyrillic, Greek, Hebrew, Armenian)                                                | 4 (Latin, Cyrillic, Armenian, Greek)                                         |
| **Italics**                  | Similar         | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>                | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> |
| **Fixed weights**            | MonoLisa        | 10                                                                                          | 2                                                                            |
| **Variable axes**            | MonoLisa        | 2 (`wght`, `GRAD`)                                                                          | None measured                                                                |
| **Style control**            | MonoLisa        | 15 stylistic sets, 12 character variants                                                    | None measured                                                                |
| **Coding ligatures**         | MonoLisa        | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>                | No                                                                           |
| **Terminal symbols**         | Similar         | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>                | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> |
| **Proportional counterpart** | MonoLisa        | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>, MonoLisa Text | No obvious proportional counterpart                                          |
| **Price**                    | Hack            | Paid, including [free trial access](https://monolisa.dev/buy/trial) and a customizer        | Free and open source                                                         |
| **Source**                   | -               | [monolisa.dev](https://www.monolisa.dev/)                                                   | [Hack GitHub repository](https://github.com/source-foundry/Hack)             |

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
