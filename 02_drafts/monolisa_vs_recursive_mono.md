---
title: "Comparison of MonoLisa vs. Recursive Mono"
published: YYYY-MM-DD
updated: 2026-09-25
draft: true
keywords:
  [
    "MonoLisa vs Recursive Mono",
    "Recursive Mono alternative",
    "coding fonts",
    "programming fonts",
  ]
authors: ["Juho Vepsäläinen", "Marcus Sterz"]
---

Recursive can move between monospaced and proportional text, restrained and more casual forms, and different slants. Here we compare the static **Rec Mono Linear** build with MonoLisa Code. Its specimens represent that build, rather than every setting available in Recursive.

## Reading texture

Follow the nested braces and repeated `input` references in `parseToken`. Compare the space inside letters and between neighboring strokes. Recursive's wider range of variable styles invites experimentation; this Linear sample gives you one consistent reference against MonoLisa.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-recursive-mono-texture-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-recursive-mono-texture.svg" alt="Rendered SVG comparing MonoLisa and Recursive Mono code texture" width="100%" />
</picture>

## Coding ligatures and character variants

Both specimens shape coding sequences such as `>=`, `->`, and `!==`. Compare the resulting joins and the gaps around them. Rec Mono Linear applies its coding substitutions through a required contextual feature, so its behavior can differ from optional ligature switches in your editor.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-recursive-mono-ligatures-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-recursive-mono-ligatures.svg" alt="Rendered SVG comparing MonoLisa and Recursive Mono operator and ligature behavior" width="100%" />
</picture>

## Characters that are easy to confuse

Recursive's zero has a diagonal slash; MonoLisa's has a square dot. Compare how each separates `0` from `O`, then check `1lI|` and `rn m`. These cues are worth trying at the size you normally use, especially inside longer identifiers.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-recursive-mono-glyphs-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-recursive-mono-glyphs.svg" alt="Enlarged zeros with circles around the square dot in MonoLisa Code and diagonal slash in Rec Mono Linear, followed by the full character sample" width="100%" />
</picture>

## Italics and style range

Compare the `a` in `alpha` and the `f` in `quickFix` across the italic samples. Beyond this static build, Recursive offers slant and cursive controls; MonoLisa supplies separate italic files and a grade control that changes stroke thickness without changing character widths.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-recursive-mono-italics-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-recursive-mono-italics.svg" alt="Rendered SVG comparing MonoLisa and Recursive Mono italic and style samples" width="100%" />
</picture>

## Terminal symbols

The measured Rec Mono Linear file includes the Powerline symbols checked here but lacks the tested box-drawing and block characters. Compare the colored prompt with the missing-glyph outlines in its table and progress bars. Your terminal may fill those gaps using another font.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-recursive-mono-terminal-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-recursive-mono-terminal.svg" alt="Matching terminal windows with colored Powerline prompts, box-drawing tables, block progress bars, and status lines in MonoLisa Code and Rec Mono Linear" width="100%" />
</picture>

## Which font should you choose?

Choose Recursive if you want a free, open-source system with several ways to vary letter style. Consider MonoLisa if you prefer its forms, need the measured box-drawing coverage, or work beyond Recursive's measured Latin language coverage. Check the specific Recursive build and settings you intend to use before making that choice.

## Try MonoLisa in your editor

The [free trial](https://www.monolisa.dev/buy/trial) includes Regular and Bold with a limited character set. Use it to judge letterforms in your editor; explore coding ligatures, OpenType features, and grade adjustment in the [online tester](https://www.monolisa.dev/tester), since those are omitted from the trial. See [checkout](https://www.monolisa.dev/buy/) for current pricing.

## Decision table

| Category                     | Better&nbsp;fit | MonoLisa Code                                                                               | Recursive Mono                                                                               |
| ---------------------------- | --------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Languages\***              | MonoLisa        | 593                                                                                         | 345                                                                                          |
| **Writing systems**          | MonoLisa        | 5 (Latin, Cyrillic, Greek, Hebrew, Armenian)                                                | 1 (Latin)                                                                                    |
| **Italics**                  | Similar         | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>                | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>                 |
| **Fixed weights**            | MonoLisa        | 10                                                                                          | 2 static Rec Mono Linear weights; variable font spans 8 named mono weights                   |
| **Variable axes**            | Recursive Mono  | 2 (`wght`, `GRAD`)                                                                          | 5 (`MONO`, `CASL`, `wght`, `slnt`, `CRSV`)                                                   |
| **Style control**            | MonoLisa        | 15 stylistic sets, 12 character variants                                                    | None measured in static Rec Mono Linear                                                      |
| **Coding ligatures**         | Similar         | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>                | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>, through `rclt` |
| **Terminal symbols**         | MonoLisa        | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>                | Powerline measured; box drawing and block elements not present in static Rec Mono Linear     |
| **Proportional counterpart** | Similar         | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>, MonoLisa Text | Sans and Mono in one system                                                                  |
| **Price**                    | Recursive Mono  | Paid, including [free trial access](https://monolisa.dev/buy/trial) and a customizer        | Free and open source                                                                         |
| **Source**                   | -               | [monolisa.dev](https://www.monolisa.dev/)                                                   | [Recursive GitHub repository](https://github.com/arrowtype/recursive)                        |

<details>
  <summary>View comparison infographic</summary>

  <img src="/images/comparison-monolisa-vs-recursive-mono-summary.svg" alt="Summary infographic comparing MonoLisa and Recursive Mono" width="100%" />
</details>

## Measurement notes

The terminal windows use identical text at a nominal 22 px with 33 px table line spacing, ligatures disabled, and the same theme colors. Powerline separators and standard Unicode block progress bars come from each font's own outlines. Segment backgrounds follow measured glyph advances; missing characters retain the font's missing-glyph outline with no fallback. Actual terminal line-height and fallback settings may change the joins. Regenerate with `node scripts/render-comparison-svgs.mjs scripts/comparison-fonts.local.json --terminal-only`.

\* Language counts use [Hyperglot 0.8.1](https://github.com/rosettatype/hyperglot), run locally with primary orthographies, living languages, and base-character support. Shaping is disabled. The command was:

```bash
.venv-hyperglot/bin/hyperglot --no-shaping --orthography primary --status living --check base <font-file>
```

Measured feature summary: MonoLisa exposes `liga`, `dlig`, `calt`, `zero`, `ss01`-`ss15`, and `cv01`-`cv12`. Recursive Mono exposes its coding forms through `calt` and `rclt`.

MonoLisa Code measured as variable upright and italic files with 10 named weights: Hairline, Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, and Black. The static Rec Mono Linear files measured here include 2 weights, Regular and Bold, each with upright and italic styles; the Recursive v1.085 variable font spans 8 named mono weights from Light through ExtraBlack.

The static Rec Mono Linear file measured at Powerline 6/6, box drawing 0/128, and block elements 0/32. Its Windows metrics differ from hhea/OS/2 typo metrics in v1.085.

For comparison, MonoLisa measured at Powerline 6/6, box drawing 128/128, block elements 32/32, with aligned hhea, OS/2 typo, and Windows vertical metrics.

The static Rec Mono Linear file shapes coding sequences through `rclt`, including `>=`, `->`, and `!==`. The wider Recursive variable system exposes `MONO`, `CASL`, `wght`, `slnt`, and `CRSV`; those axes are not demonstrated by this static specimen.

{/* Editorial review before publication: Marcus to review the design observations and recommendation; verify measured data against the intended font versions; visually review all specimens, including the added glyph comparison; confirm license/source basis and set the publication date. */}

The enlarged details use the same font files as the complete specimens, at equal nominal sizes for both fonts. Glyphs are centered independently without changing their proportions. The circles are annotations behind the original outlines; upright and italic details use their respective font files. Regenerate them with `node scripts/render-comparison-svgs.mjs scripts/comparison-fonts.local.json --focus-only`.
