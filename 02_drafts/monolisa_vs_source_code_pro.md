---
title: "Comparison of MonoLisa vs. Source Code Pro"
published: YYYY-MM-DD
updated: 2026-07-03
draft: true
keywords:
  [
    "MonoLisa vs Source Code Pro",
    "Source Code Pro alternative",
    "coding fonts",
    "programming fonts",
  ]
authors: ["Juho Vepsäläinen", "Marcus Sterz"]
---

MonoLisa and Source Code Pro are both coding fonts, but they optimize for different priorities. This draft puts the visual summary and the decision table first, so the main differences are visible before the detailed specimens.

![Summary infographic comparing MonoLisa and Source Code Pro](/images/comparison-monolisa-vs-source-code-pro-summary.svg)

## Decision table

| Category                     | Better&nbsp;fit | MonoLisa Code                                                                               | Source Code Pro                                                                     |
| ---------------------------- | --------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Languages\***              | MonoLisa        | 593                                                                                         | 413                                                                                 |
| **Writing systems**          | MonoLisa        | 5 (Latin, Cyrillic, Greek, Hebrew, Armenian)                                                | 3 (Latin, Cyrillic, Greek)                                                          |
| **Italics**                  | Similar         | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>                | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>        |
| **Fixed weights**            | MonoLisa        | 10                                                                                          | 7                                                                                   |
| **Variable axes**            | MonoLisa        | 2 (`wght`, `GRAD`)                                                                          | Not measured in this pass                                                           |
| **Style control**            | MonoLisa        | 15 stylistic sets, 12 character variants                                                    | 7 stylistic sets, selected character variants                                       |
| **Coding ligatures**         | MonoLisa        | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>                | No coding ligature set measured                                                     |
| **Terminal symbols**         | Similar         | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>                | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>        |
| **Proportional counterpart** | MonoLisa        | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>, MonoLisa Text | Source Sans family relation                                                         |
| **Price**                    | Source Code Pro | Paid, including [free trial access](https://monolisa.dev/buy/trial) and a customizer        | Free and open source                                                                |
| **Source**                   | -               | [monolisa.dev](https://www.monolisa.dev/)                                                   | [Source Code Pro GitHub repository](https://github.com/adobe-fonts/source-code-pro) |

In short: MonoLisa Code wins on coverage, coding ligatures, axes, and style range. Source Code Pro wins on price.

## Reading texture

Use this specimen to judge rhythm, spacing, punctuation weight, and identifier texture.

[Marcus input: Explain the most important type-design distinction in one concrete paragraph.]

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-source-code-pro-texture-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-source-code-pro-texture.svg" alt="Rendered SVG comparing MonoLisa and Source Code Pro code texture" width="100%" />
</picture>

## Coding features

Source Code Pro has a broad OpenType feature surface for alternates, numerals, and character variants, but no coding ligature set was found in the public README or measured feature pass. MonoLisa exposes coding ligatures in addition to stylistic sets and character variants.

Measured feature summary: MonoLisa exposes `liga`, `dlig`, `calt`, `zero`, `ss01`-`ss15`, and `cv01`-`cv12`. Source Code Pro exposes `zero`, `ss01`-`ss07`, and selected `cvXX` features; no coding ligature feature set measured.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-source-code-pro-ligatures-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-source-code-pro-ligatures.svg" alt="Rendered SVG comparing MonoLisa and Source Code Pro operator and ligature behavior" width="100%" />
</picture>

## Glyph distinction

This section should compare common problem pairs such as `0O`, `1lI|`, brackets, quotes, punctuation, and operators.

[Marcus input: Add notes for intentional MonoLisa tradeoffs.]

## Italics and style range

The italic/style specimen has been rendered for review. Confirm whether the comparison should emphasize true italics, cursive forms, slant behavior, or family width/weight range.

MonoLisa Code measured as variable upright and italic files with 10 named weights: Hairline, Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, and Black. The Source Code Pro v2.042 archive includes 7 static weights: ExtraLight, Light, Regular, Medium, Semibold, Bold, and Black, each with upright and italic styles.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-source-code-pro-italics-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-source-code-pro-italics.svg" alt="Rendered SVG comparing MonoLisa and Source Code Pro italic and style samples" width="100%" />
</picture>

## Terminal and console support

Source Code Pro measured at Powerline 6/6, box drawing 128/128, and block elements 32/32. Its hhea/Windows metrics differ from OS/2 typo metrics in v2.042.

For comparison, MonoLisa measured at Powerline 6/6, box drawing 128/128, block elements 32/32, with aligned hhea, OS/2 typo, and Windows vertical metrics.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-source-code-pro-terminal-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-source-code-pro-terminal.svg" alt="Rendered SVG comparing MonoLisa and Source Code Pro terminal symbols and box drawing" width="100%" />
</picture>

## Licensing and availability

Source Code Pro is free and open source. MonoLisa is a paid typeface with [free trial access](https://monolisa.dev/buy/trial) and a customizer.

## Project activity

As of 2026-07-03, the Source Code Pro GitHub repository shows 11 non-draft, non-prerelease releases, with the latest release on 2023-04-12. Across the release history returned by the GitHub API, that is about 1.28 releases per year. The repository has 84 open issues, and the median close time for the recent closed-issue sample is 4.3 days. Treat this as a maintenance/activity signal, not a type-design quality score.

## Source links

- [MonoLisa](https://www.monolisa.dev/)
- [Source Code Pro repository](https://github.com/adobe-fonts/source-code-pro)

## Publication checklist

- [ ] Marcus design review completed.
- [ ] License/source basis checked.
- [ ] Rendered SVG specimens visually reviewed.
- [ ] Measured data verified against current font files.
- [ ] Final recommendation/conclusion written.

## Conclusion

Draft conclusion pending Marcus review. The measured data is ready; the remaining work is the qualitative design call: who should choose MonoLisa, who should choose Source Code Pro, and which tradeoff matters most.

> - Languages were measured locally with [Hyperglot 0.8.1](https://github.com/rosettatype/hyperglot) by running `.venv-hyperglot/bin/hyperglot --no-shaping --orthography primary --status living --check base <font-file>`: primary orthographies, living languages, base-character support, with shaping disabled.
