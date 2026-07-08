---
title: "Comparison of MonoLisa vs. Recursive Mono"
published: YYYY-MM-DD
updated: 2026-07-03
draft: true
keywords: ["MonoLisa vs Recursive Mono", "Recursive Mono alternative", "coding fonts", "programming fonts"]
authors: ["Juho Vepsäläinen", "Marcus Sterz"]
---

MonoLisa and Recursive Mono are both coding-capable typefaces, but they optimize for different priorities. This draft puts the visual summary and the decision table first, so the main differences are visible before the detailed specimens.

![Summary infographic comparing MonoLisa and Recursive Mono](/images/comparison-monolisa-vs-recursive-mono-summary.svg)

[Designer review: Does this opening save enough reading? Should the table feel closer to the BUY page comparison style?]

## Decision table

| Category | Better fit | MonoLisa Code | Recursive Mono |
| --- | --- | --- | --- |
| **Languages ([Hyperglot](https://github.com/rosettatype/hyperglot))** | MonoLisa | 593 | 345 |
| **Writing systems** | MonoLisa | 5 (Latin, Cyrillic, Greek, Hebrew, Armenian) | 1 (Latin) |
| **Italics** | Similar | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> |
| **Weights** | MonoLisa | 10 | 2 static Rec Mono Linear weights; variable font spans 8 named mono weights |
| **Variable axes** | Recursive Mono | 2 (`wght`, `GRAD`) | 5 (`MONO`, `CASL`, `wght`, `slnt`, `CRSV`) |
| **Style control** | MonoLisa | 15 stylistic sets, 12 character variants | None measured in static Rec Mono Linear |
| **Coding ligatures** | MonoLisa | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> | `calt` and `rclt`; no standard coding ligature set measured |
| **Terminal symbols** | MonoLisa | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> | Powerline measured; box drawing and block elements not present in static Rec Mono Linear |
| **Proportional counterpart** | Similar | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>, MonoLisa Text | Sans and Mono in one system |
| **Price** | Recursive Mono | Paid, including free trial and customizer | Free and open source |
| **Source** | - | [monolisa.dev](https://www.monolisa.dev/) | [Recursive GitHub repository](https://github.com/arrowtype/recursive) |

In short: MonoLisa Code wins on measured coverage, coding features, and terminal symbols. Recursive Mono wins on axis range and price.

## Reading texture

Use this specimen to judge rhythm, spacing, punctuation weight, and identifier texture.

[Marcus input: Explain the most important type-design distinction in one concrete paragraph.]

<picture>
  <source media="(max-width: 640px)" srcset="/images/comparison-monolisa-vs-recursive-mono-texture-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-recursive-mono-texture.svg" alt="Rendered SVG comparing MonoLisa and Recursive Mono code texture" width="100%" />
</picture>

## Language and script coverage

MonoLisa measured at 2105 glyphs and 1784 cmap entries. Recursive Mono measured at 1379 glyphs and 783 cmap entries.

Language and writing-system coverage is one of the clearest measured differences in MonoLisa's favor. Using Hyperglot 0.8.1 with primary orthographies, living languages, base character support, and shaping disabled, MonoLisa measured at 593 publishable languages across Latin, Cyrillic, Hebrew, Greek, and Armenian. Recursive Mono measured at 345 languages across Latin. Treat these as comparable local measurements, not universal language promises: the result depends on the tested font file, orthography settings, and whether auxiliary characters, punctuation, marks, and shaping are included.

## Coding features

Recursive Mono is most interesting as a variable type system with mono/sans, casual/linear, weight, slant, and cursive axes. In the static Rec Mono Linear file measured here, only `calt` and `rclt` were measured for coding-related behavior.

Measured feature summary: MonoLisa exposes `liga`, `dlig`, `calt`, `zero`, `ss01`-`ss15`, and `cv01`-`cv12`. Recursive Mono exposes `calt` and `rclt`; no standard coding ligature set measured in static Rec Mono Linear.

<picture>
  <source media="(max-width: 640px)" srcset="/images/comparison-monolisa-vs-recursive-mono-ligatures-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-recursive-mono-ligatures.svg" alt="Rendered SVG comparing MonoLisa and Recursive Mono operator and ligature behavior" width="100%" />
</picture>

## Glyph distinction

The shared ambiguity specimen has been rendered for review. Use it to compare common problem pairs such as `0O`, `1lI|`, brackets, quotes, punctuation, and operators.

[Marcus input: Add notes for intentional MonoLisa tradeoffs.]

<picture>
  <source media="(max-width: 640px)" srcset="/images/comparison-monolisa-vs-recursive-mono-glyphs-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-recursive-mono-glyphs.svg" alt="Rendered SVG comparing MonoLisa and Recursive Mono ambiguous glyph shapes" width="100%" />
</picture>

## Italics and style range

The italic/style specimen has been rendered for review. Confirm whether the comparison should emphasize true italics, cursive forms, slant behavior, or family width/weight range.

MonoLisa Code measured as variable upright and italic files with 10 named weights: Hairline, Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, and Black. The static Rec Mono Linear files measured here include 2 weights, Regular and Bold, each with upright and italic styles; the Recursive v1.085 variable font spans 8 named mono weights from Light through ExtraBlack.

<picture>
  <source media="(max-width: 640px)" srcset="/images/comparison-monolisa-vs-recursive-mono-italics-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-recursive-mono-italics.svg" alt="Rendered SVG comparing MonoLisa and Recursive Mono italic and style samples" width="100%" />
</picture>

## Terminal and console support

The static Rec Mono Linear file measured at Powerline 6/6, box drawing 0/128, and block elements 0/32. Its Windows metrics differ from hhea/OS/2 typo metrics in v1.085.

For comparison, MonoLisa measured at Powerline 6/6, box drawing 128/128, block elements 32/32, with aligned hhea, OS/2 typo, and Windows vertical metrics.

<picture>
  <source media="(max-width: 640px)" srcset="/images/comparison-monolisa-vs-recursive-mono-terminal-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-recursive-mono-terminal.svg" alt="Rendered SVG comparing MonoLisa and Recursive Mono terminal symbols and box drawing" width="100%" />
</picture>

## Licensing and availability

Recursive Mono is free and open source. MonoLisa is a paid typeface with trial/customizer access. The rendered comparison graphics use path-based SVG output, so the published page does not require readers to have either font installed.

## Project activity

As of 2026-07-03, the Recursive Mono GitHub repository shows 27 non-draft, non-prerelease releases, with the latest release on 2022-06-30. Across the release history returned by the GitHub API, that is about 12.73 releases per year. The repository has 37 open issues, and the median close time for the recent closed-issue sample is 11.3 days. Treat this as a maintenance/activity signal, not a type-design quality score.

## Source links

- [MonoLisa](https://www.monolisa.dev/)
- [Recursive repository](https://github.com/arrowtype/recursive)

## Measurement notes

Measurements in this draft use MonoLisa font files plus competitor font files downloaded from the official repository or release archive, fonttools metadata extraction, Hyperglot 0.8.1 language coverage with primary living orthographies and base characters, and path-based SVG specimens generated by `scripts/render-comparison-svgs.mjs`.

## Publication checklist

- [ ] Marcus design review completed.
- [ ] License/source basis checked.
- [ ] Rendered SVG specimens visually reviewed.
- [ ] Measured data verified against current font files.
- [ ] Final recommendation/conclusion written.

## Conclusion

Draft conclusion pending Marcus review. The measured data is ready; the remaining work is the qualitative design call: who should choose MonoLisa, who should choose Recursive Mono, and which tradeoff matters most.
