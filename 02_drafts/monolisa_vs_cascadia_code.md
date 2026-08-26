---
title: "Comparison of MonoLisa vs. Cascadia Code"
published: YYYY-MM-DD
updated: 2026-07-03
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

MonoLisa and Cascadia Code are both coding fonts, but they optimize for different priorities. This draft puts the visual summary and the decision table first, so the main differences are visible before the detailed specimens.

![Summary infographic comparing MonoLisa and Cascadia Code](/images/comparison-monolisa-vs-cascadia-code-summary.svg)

## Decision table

| Category                     | Better&nbsp;fit | MonoLisa Code                                                                               | Cascadia Code                                                                      |
| ---------------------------- | --------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Languages\***              | MonoLisa        | 593                                                                                         | 513                                                                                |
| **Writing systems**          | MonoLisa        | 5 (Latin, Cyrillic, Greek, Hebrew, Armenian)                                                | 4 (Latin, Cyrillic, Arabic, Greek)                                                 |
| **Italics**                  | Similar         | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>                | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>       |
| **Fixed weights**            | MonoLisa        | 10                                                                                          | 6                                                                                  |
| **Variable axes**            | MonoLisa        | 2 (`wght`, `GRAD`)                                                                          | 1 (`wght`)                                                                         |
| **Style control**            | MonoLisa        | 15 stylistic sets, 12 character variants                                                    | 3 stylistic sets recorded                                                          |
| **Coding ligatures**         | Similar         | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>                | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>       |
| **Terminal symbols**         | MonoLisa        | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>                | Box drawing and block elements measured; standard build measured without Powerline |
| **Proportional counterpart** | MonoLisa        | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>, MonoLisa Text | No obvious proportional counterpart                                                |
| **Price**                    | Cascadia Code   | Paid, including [free trial access](https://monolisa.dev/buy/trial) and a customizer        | Free and open source                                                               |
| **Source**                   | -               | [monolisa.dev](https://www.monolisa.dev/)                                                   | [Cascadia Code GitHub repository](https://github.com/microsoft/cascadia-code)      |

In short: MonoLisa Code wins on language coverage, style range, and measured terminal completeness. Cascadia Code wins on price.

## Reading texture

Use this specimen to judge rhythm, spacing, punctuation weight, and identifier texture.

[Marcus input: Explain the most important type-design distinction in one concrete paragraph.]

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-cascadia-code-texture-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-cascadia-code-texture.svg" alt="Rendered SVG comparing MonoLisa and Cascadia Code code texture" width="100%" />
</picture>

## Coding features

Cascadia Code includes coding ligature behavior and contextual features. The measured standard Cascadia Code build includes `calt`, `rclt`, `rlig`, `zero`, `ss02`, `ss19`, and `ss20`; use a Cascadia PL build if the post needs to evaluate Powerline-specific variants.

Measured feature summary: MonoLisa exposes `liga`, `dlig`, `calt`, `zero`, `ss01`-`ss15`, and `cv01`-`cv12`. Cascadia Code exposes `calt`, `rclt`, `rlig`, `zero`, `ss02`, `ss19`, and `ss20`.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-cascadia-code-ligatures-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-cascadia-code-ligatures.svg" alt="Rendered SVG comparing MonoLisa and Cascadia Code operator and ligature behavior" width="100%" />
</picture>

## Glyph distinction

This section should compare common problem pairs such as `0O`, `1lI|`, brackets, quotes, punctuation, and operators.

[Marcus input: Add notes for intentional MonoLisa tradeoffs.]

## Italics and style range

The italic/style specimen has been rendered for review. Confirm whether the comparison should emphasize true italics, cursive forms, slant behavior, or family width/weight range.

MonoLisa Code measured as variable upright and italic files with 10 named weights: Hairline, Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, and Black. The Cascadia Code v2407.024 archive includes 6 named weights: ExtraLight, Light, SemiLight, Regular, SemiBold, and Bold; the variable and static upright/italic builds expose that same weight range across the Code/Mono variants.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-cascadia-code-italics-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-cascadia-code-italics.svg" alt="Rendered SVG comparing MonoLisa and Cascadia Code italic and style samples" width="100%" />
</picture>

## Terminal and console support

The measured standard Cascadia Code build has Powerline 0/6, box drawing 128/128, and block elements 32/32. Its Windows ascent differs from hhea/OS/2 typo metrics in v2407.024, so terminal line metrics should be checked in target apps.

For comparison, MonoLisa measured at Powerline 6/6, box drawing 128/128, block elements 32/32, with aligned hhea, OS/2 typo, and Windows vertical metrics.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-cascadia-code-terminal-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-cascadia-code-terminal.svg" alt="Rendered SVG comparing MonoLisa and Cascadia Code terminal symbols and box drawing" width="100%" />
</picture>

## Licensing and availability

Cascadia Code is free and open source. MonoLisa is a paid typeface with [free trial access](https://monolisa.dev/buy/trial) and a customizer.

## Project activity

As of 2026-07-03, the Cascadia Code GitHub repository shows 19 non-draft, non-prerelease releases, with the latest release on 2024-11-27. Across the release history returned by the GitHub API, that is about 3.66 releases per year. The repository has 158 open issues, and the median close time for the recent closed-issue sample is 16.3 days. Treat this as a maintenance/activity signal, not a type-design quality score.

## Source links

- [MonoLisa](https://www.monolisa.dev/)
- [Cascadia Code repository](https://github.com/microsoft/cascadia-code)

## Publication checklist

- [ ] Marcus design review completed.
- [ ] License/source basis checked.
- [ ] Rendered SVG specimens visually reviewed.
- [ ] Measured data verified against current font files.
- [ ] Final recommendation/conclusion written.

## Conclusion

Draft conclusion pending Marcus review. The measured data is ready; the remaining work is the qualitative design call: who should choose MonoLisa, who should choose Cascadia Code, and which tradeoff matters most.

> - Languages were measured locally with [Hyperglot 0.8.1](https://github.com/rosettatype/hyperglot) by running `.venv-hyperglot/bin/hyperglot --no-shaping --orthography primary --status living --check base <font-file>`: primary orthographies, living languages, base-character support, with shaping disabled.
