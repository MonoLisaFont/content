---
title: "Comparison of MonoLisa vs. Hack"
published: YYYY-MM-DD
updated: 2026-07-03
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

MonoLisa and Hack are both coding fonts, but they optimize for different priorities. This draft puts the visual summary and the decision table first, so the main differences are visible before the detailed specimens.

![Summary infographic comparing MonoLisa and Hack](/images/comparison-monolisa-vs-hack-summary.svg)

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

In short: MonoLisa Code wins on coverage, ligatures, variable axes, and style control. Hack wins on price and remains a strong no-frills baseline.

## Reading texture

Use this specimen to judge rhythm, spacing, punctuation weight, and identifier texture.

[Marcus input: Explain the most important type-design distinction in one concrete paragraph.]

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-hack-texture-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-hack-texture.svg" alt="Rendered SVG comparing MonoLisa and Hack code texture" width="100%" />
</picture>

## Coding features

Hack is a useful no-frills baseline because no coding ligature feature set was measured. MonoLisa exposes coding ligatures, stylistic sets, and character variants; Hack keeps the feature surface smaller.

Measured feature summary: MonoLisa exposes `liga`, `dlig`, `calt`, `zero`, `ss01`-`ss15`, and `cv01`-`cv12`. Hack exposes `aalt`, `frac`, `locl`, `ordn`, `sinf`, `subs`, and `sups`; no coding ligature feature set measured.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-hack-ligatures-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-hack-ligatures.svg" alt="Rendered SVG comparing MonoLisa and Hack operator and ligature behavior" width="100%" />
</picture>

## Glyph distinction

This section should compare common problem pairs such as `0O`, `1lI|`, brackets, quotes, punctuation, and operators.

[Marcus input: Add notes for intentional MonoLisa tradeoffs.]

## Italics and style range

The italic/style specimen has been rendered for review. Confirm whether the comparison should emphasize true italics, cursive forms, slant behavior, or family width/weight range.

MonoLisa Code measured as variable upright and italic files with 10 named weights: Hairline, Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, and Black. The Hack v3.003 TTF archive includes 2 weights, Regular and Bold, each with upright and italic styles.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-hack-italics-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-hack-italics.svg" alt="Rendered SVG comparing MonoLisa and Hack italic and style samples" width="100%" />
</picture>

## Terminal and console support

Hack measured at Powerline 6/6, box drawing 128/128, and block elements 32/32. Its typo metrics and line gap differ from hhea/Windows metrics in v3.003.

For comparison, MonoLisa measured at Powerline 6/6, box drawing 128/128, block elements 32/32, with aligned hhea, OS/2 typo, and Windows vertical metrics.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-hack-terminal-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-hack-terminal.svg" alt="Rendered SVG comparing MonoLisa and Hack terminal symbols and box drawing" width="100%" />
</picture>

## Licensing and availability

Hack is free and open source. MonoLisa is a paid typeface with [free trial access](https://monolisa.dev/buy/trial) and a customizer.

## Project activity

As of 2026-07-03, the Hack GitHub repository shows 15 non-draft, non-prerelease releases, with the latest release on 2018-03-06. Across the release history returned by the GitHub API, that is about 5.55 releases per year. The repository has 144 open issues, and the median close time for the recent closed-issue sample is 5.2 days. Treat this as a maintenance/activity signal, not a type-design quality score.

## Source links

- [MonoLisa](https://www.monolisa.dev/)
- [Hack repository](https://github.com/source-foundry/Hack)

## Publication checklist

- [ ] Marcus design review completed.
- [ ] License/source basis checked.
- [ ] Rendered SVG specimens visually reviewed.
- [ ] Measured data verified against current font files.
- [ ] Final recommendation/conclusion written.

## Conclusion

Draft conclusion pending Marcus review. The measured data is ready; the remaining work is the qualitative design call: who should choose MonoLisa, who should choose Hack, and which tradeoff matters most.

> - Languages were measured locally with [Hyperglot 0.8.1](https://github.com/rosettatype/hyperglot) by running `.venv-hyperglot/bin/hyperglot --no-shaping --orthography primary --status living --check base <font-file>`: primary orthographies, living languages, base-character support, with shaping disabled.
