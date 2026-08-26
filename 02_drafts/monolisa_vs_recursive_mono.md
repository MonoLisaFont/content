---
title: "Comparison of MonoLisa vs. Recursive Mono"
published: YYYY-MM-DD
updated: 2026-07-03
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

MonoLisa and Recursive Mono are both coding-capable typefaces, but they optimize for different priorities. This draft puts the visual summary and the decision table first, so the main differences are visible before the detailed specimens.

![Summary infographic comparing MonoLisa and Recursive Mono](/images/comparison-monolisa-vs-recursive-mono-summary.svg)

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

In short: MonoLisa Code wins on measured coverage, coding features, and terminal symbols. Recursive Mono wins on axis range and price.

## Reading texture

Use this specimen to judge rhythm, spacing, punctuation weight, and identifier texture.

[Marcus input: Explain the most important type-design distinction in one concrete paragraph.]

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-recursive-mono-texture-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-recursive-mono-texture.svg" alt="Rendered SVG comparing MonoLisa and Recursive Mono code texture" width="100%" />
</picture>

## Coding features

Recursive Mono is most interesting as a variable type system with mono/sans, casual/linear, weight, slant, and cursive axes. In the static Rec Mono Linear file measured here, `rclt` shapes coding sequences including `>=`, `->`, and `!==` by default.

Measured feature summary: MonoLisa exposes `liga`, `dlig`, `calt`, `zero`, `ss01`-`ss15`, and `cv01`-`cv12`. Recursive Mono exposes its coding forms through `calt` and `rclt`.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-recursive-mono-ligatures-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-recursive-mono-ligatures.svg" alt="Rendered SVG comparing MonoLisa and Recursive Mono operator and ligature behavior" width="100%" />
</picture>

## Glyph distinction

This section should compare common problem pairs such as `0O`, `1lI|`, brackets, quotes, punctuation, and operators.

[Marcus input: Add notes for intentional MonoLisa tradeoffs.]

## Italics and style range

The italic/style specimen has been rendered for review. Confirm whether the comparison should emphasize true italics, cursive forms, slant behavior, or family width/weight range.

MonoLisa Code measured as variable upright and italic files with 10 named weights: Hairline, Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, and Black. The static Rec Mono Linear files measured here include 2 weights, Regular and Bold, each with upright and italic styles; the Recursive v1.085 variable font spans 8 named mono weights from Light through ExtraBlack.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-recursive-mono-italics-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-recursive-mono-italics.svg" alt="Rendered SVG comparing MonoLisa and Recursive Mono italic and style samples" width="100%" />
</picture>

## Terminal and console support

The static Rec Mono Linear file measured at Powerline 6/6, box drawing 0/128, and block elements 0/32. Its Windows metrics differ from hhea/OS/2 typo metrics in v1.085.

For comparison, MonoLisa measured at Powerline 6/6, box drawing 128/128, block elements 32/32, with aligned hhea, OS/2 typo, and Windows vertical metrics.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-recursive-mono-terminal-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-recursive-mono-terminal.svg" alt="Rendered SVG comparing MonoLisa and Recursive Mono terminal symbols and box drawing" width="100%" />
</picture>

## Licensing and availability

Recursive Mono is free and open source. MonoLisa is a paid typeface with [free trial access](https://monolisa.dev/buy/trial) and a customizer.

## Project activity

As of 2026-07-03, the Recursive Mono GitHub repository shows 27 non-draft, non-prerelease releases, with the latest release on 2022-06-30. Across the release history returned by the GitHub API, that is about 12.73 releases per year. The repository has 37 open issues, and the median close time for the recent closed-issue sample is 11.3 days. Treat this as a maintenance/activity signal, not a type-design quality score.

## Source links

- [MonoLisa](https://www.monolisa.dev/)
- [Recursive repository](https://github.com/arrowtype/recursive)

## Publication checklist

- [ ] Marcus design review completed.
- [ ] License/source basis checked.
- [ ] Rendered SVG specimens visually reviewed.
- [ ] Measured data verified against current font files.
- [ ] Final recommendation/conclusion written.

## Conclusion

Draft conclusion pending Marcus review. The measured data is ready; the remaining work is the qualitative design call: who should choose MonoLisa, who should choose Recursive Mono, and which tradeoff matters most.

> - Languages were measured locally with [Hyperglot 0.8.1](https://github.com/rosettatype/hyperglot) by running `.venv-hyperglot/bin/hyperglot --no-shaping --orthography primary --status living --check base <font-file>`: primary orthographies, living languages, base-character support, with shaping disabled.
