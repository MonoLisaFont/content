---
title: "Comparison of MonoLisa vs. IBM Plex Mono"
published: YYYY-MM-DD
updated: 2026-09-25
draft: true
keywords:
  [
    "MonoLisa vs IBM Plex Mono",
    "IBM Plex Mono alternative",
    "coding fonts",
    "programming fonts",
  ]
authors: ["Juho Vepsäläinen", "Marcus Sterz"]
---

If you use code snippets in documentation, IBM Plex gives you Mono, Sans, and Serif companions. MonoLisa pairs Code with Text. For the editor itself, the specimens highlight two differences: operator ligatures and the Powerline symbols used in prompts.

## Reading texture

The colons in `kind:` and `value:` use square dots in MonoLisa and round dots in Plex. MonoLisa's wider character cells also make the same lines run longer, a difference to consider when code and prose share a narrow documentation column.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-ibm-plex-mono-texture-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-ibm-plex-mono-texture.svg" alt="Rendered SVG comparing MonoLisa and IBM Plex Mono code texture" width="100%" />
</picture>

## Coding ligatures and character variants

Plex keeps `!==` as three characters and `->` as a hyphen followed by an angle; MonoLisa joins each sequence in this specimen. MonoLisa's ligatures are optional, so you can choose whether to join operators without changing the code itself.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-ibm-plex-mono-ligatures-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-ibm-plex-mono-ligatures.svg" alt="Rendered SVG comparing MonoLisa and IBM Plex Mono operator and ligature behavior" width="100%" />
</picture>

## Characters that are easy to confuse

Compare the square dot inside MonoLisa's zero with Plex's round dot, then inspect the feet and bars in `1lI|`. Periods and colons also give the punctuation a different character: square dots in MonoLisa, round ones in Plex.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-ibm-plex-mono-glyphs-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-ibm-plex-mono-glyphs.svg" alt="Enlarged zero and colon dots highlighted with circles in MonoLisa Code and IBM Plex Mono, followed by the full character sample" width="100%" />
</picture>

## Italics and style range

Both fonts give italic `f` a hook below the baseline, visible in `if`. The longer `readableIdentifier` shows that shape among repeated shorter letters; try the same identifier in italic comments to judge how the letters work together at your reading size.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-ibm-plex-mono-italics-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-ibm-plex-mono-italics.svg" alt="Rendered SVG comparing MonoLisa and IBM Plex Mono italic and style samples" width="100%" />
</picture>

## Terminal symbols

Both fonts include the table borders and block characters shown here. Plex's sampled file lacks the Powerline symbols used in the colored prompt and status line, so those rows contain missing-glyph boxes; MonoLisa supplies the separators and branch symbol.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-ibm-plex-mono-terminal-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-ibm-plex-mono-terminal.svg" alt="Matching terminal windows with colored Powerline prompts, box-drawing tables, block progress bars, and status lines in MonoLisa Code and IBM Plex Mono" width="100%" />
</picture>

## Which font should you choose?

Choose IBM Plex Mono if you want a free type family for code, documentation, and headings. Try MonoLisa if coding ligatures or built-in Powerline symbols matter in your editor and terminal; both offer related fonts for ordinary text.

## Try MonoLisa in your editor

The [free trial](https://www.monolisa.dev/buy/trial) includes Regular and Bold with a limited character set. Use it to judge letterforms in your editor; explore coding ligatures, OpenType features, and grade adjustment in the [online tester](https://www.monolisa.dev/tester), since those are omitted from the trial. See [checkout](https://www.monolisa.dev/buy/) for current pricing.

## At a glance

| Category | MonoLisa Code | IBM Plex Mono |
| ---------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Languages\*** | 593 | 410 |
| **Writing systems** | 5 (Latin, Cyrillic, Greek, Hebrew, Armenian) | 2 (Latin, Cyrillic) |
| **Italics** | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> |
| **Fixed weights** | 10 | 8 |
| **Variable axes** | 2 (`wght`, `GRAD`) | Not recorded in this pass |
| **Style control** | 15 stylistic sets, 12 character variants | 9 stylistic sets recorded |
| **Coding ligatures** | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> | No coding ligature set measured |
| **Terminal symbols** | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> | Box drawing and block elements measured; Powerline not measured in regular build |
| **Proportional counterpart** | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>, MonoLisa Text | IBM Plex Sans / Serif / Sans Condensed |
| **Price** | Paid, including [free trial access](https://monolisa.dev/buy/trial) and a customizer | Free and open source |
| **Source** | [monolisa.dev](https://www.monolisa.dev/) | [IBM Plex GitHub repository](https://github.com/IBM/plex) |

<details>
  <summary>View comparison infographic</summary>

  <img src="/images/comparison-monolisa-vs-ibm-plex-mono-summary.svg" alt="Summary infographic comparing MonoLisa and IBM Plex Mono" width="100%" />
</details>

## Measurement notes

The terminal windows use identical text at a nominal 22 px with 33 px table line spacing, ligatures disabled, and the same theme colors. Powerline separators and standard Unicode block progress bars come from each font's own outlines. Segment backgrounds follow measured glyph advances; missing characters retain the font's missing-glyph outline with no fallback. Actual terminal line-height and fallback settings may change the joins. Regenerate with `node scripts/render-comparison-svgs.mjs scripts/comparison-fonts.local.json --terminal-only`.

\* Language counts use [Hyperglot 0.8.1](https://github.com/rosettatype/hyperglot), run locally with primary orthographies, living languages, and base-character support. Shaping is disabled. The command was:

```bash
.venv-hyperglot/bin/hyperglot --no-shaping --orthography primary --status living --check base <font-file>
```

Measured feature summary: MonoLisa exposes `liga`, `dlig`, `calt`, `zero`, `ss01`-`ss15`, and `cv01`-`cv12`. IBM Plex Mono exposes `zero` and `ss01`-`ss09`; no coding ligature feature set measured.

MonoLisa Code measured as variable upright and italic files with 10 named weights: Hairline, Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, and Black. The official IBM Plex Mono TTF set includes 8 weights: Thin, ExtraLight, Light, Regular, Text, Medium, SemiBold, and Bold, each with upright and italic styles.

IBM Plex Mono measured at Powerline 0/6, box drawing 128/128, and block elements 32/32. Its typo metrics and line gap differ from hhea/Windows metrics in v2.005.

For comparison, MonoLisa measured at Powerline 6/6, box drawing 128/128, block elements 32/32, with aligned hhea, OS/2 typo, and Windows vertical metrics.

{/* Editorial review before publication: Marcus to review the design observations and recommendation; verify measured data against the intended font versions; visually review all specimens, including the added glyph comparison; confirm license/source basis and set the publication date. */}

The enlarged details use the same font files as the complete specimens, at equal nominal sizes for both fonts. Glyphs are centered independently without changing their proportions. The circles are annotations behind the original outlines; upright and italic details use their respective font files. Regenerate them with `node scripts/render-comparison-svgs.mjs scripts/comparison-fonts.local.json --focus-only`.
