---
title: "Comparison of MonoLisa vs. Cascadia Code"
published: YYYY-MM-DD
updated: 2026-07-03
draft: true
keywords: ["MonoLisa vs Cascadia Code", "Cascadia Code alternative", "coding fonts", "programming fonts"]
authors: ["Juho Vepsäläinen", "Marcus Sterz"]
---

MonoLisa and Cascadia Code are both coding fonts, but they optimize for different priorities. This draft puts the visual summary and the decision table first, so the main differences are visible before the detailed specimens.

![Summary infographic comparing MonoLisa and Cascadia Code](/images/comparison-monolisa-vs-cascadia-code-summary.svg)

[Designer review: Does this opening save enough reading? Should the table feel closer to the BUY page comparison style?]

## Decision table

| Category | Better fit | MonoLisa Code | Cascadia Code |
| --- | --- | --- | --- |
| **Languages ([Hyperglot](https://github.com/rosettatype/hyperglot))** | MonoLisa | 593 | 513 |
| **Writing systems** | MonoLisa | 5 (Latin, Cyrillic, Greek, Hebrew, Armenian) | 4 (Latin, Cyrillic, Arabic, Greek) |
| **Italics** | Similar | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> |
| **Weights** | MonoLisa | 10 | 6 |
| **Variable axes** | MonoLisa | 2 (`wght`, `GRAD`) | 1 (`wght`) |
| **Style control** | MonoLisa | 15 stylistic sets, 12 character variants | 3 stylistic sets recorded |
| **Coding ligatures** | Similar | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> |
| **Terminal symbols** | MonoLisa | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span> | Box drawing and block elements measured; standard build measured without Powerline |
| **Proportional counterpart** | MonoLisa | <span style={{ color: "var(--ml-colors-primary, currentColor)" }}>Yes</span>, MonoLisa Text | No obvious proportional counterpart |
| **Price** | Cascadia Code | Paid, including free trial and customizer | Free and open source |
| **Source** | - | [monolisa.dev](https://www.monolisa.dev/) | [Cascadia Code GitHub repository](https://github.com/microsoft/cascadia-code) |

In short: MonoLisa Code wins on language coverage, style range, and measured terminal completeness. Cascadia Code wins on price.

## Reading texture

Use this specimen to judge rhythm, spacing, punctuation weight, and identifier texture.

[Marcus input: Explain the most important type-design distinction in one concrete paragraph.]

![Rendered SVG comparing MonoLisa and Cascadia Code code texture](/images/comparison-monolisa-vs-cascadia-code-texture.svg)

## Language and script coverage

MonoLisa measured at 2105 glyphs and 1784 cmap entries. Cascadia Code measured at 4319 glyphs and 2426 cmap entries.

Language coverage is one of the clearest measured differences in MonoLisa's favor. Using Hyperglot 0.8.1 with primary orthographies, living languages, base character support, and shaping disabled, MonoLisa measured at 593 publishable languages across Latin, Cyrillic, Hebrew, Greek, and Armenian. Cascadia Code measured at 513 languages across Latin, Cyrillic, Arabic, and Greek. Treat these as comparable local measurements, not universal language promises: the result depends on the tested font file, orthography settings, and whether auxiliary characters, punctuation, marks, and shaping are included.

## Coding features

Cascadia Code includes coding ligature behavior and contextual features. The measured standard Cascadia Code build includes `calt`, `rclt`, `rlig`, `zero`, `ss02`, `ss19`, and `ss20`; use a Cascadia PL build if the post needs to evaluate Powerline-specific variants.

Measured feature summary: MonoLisa exposes `liga`, `dlig`, `calt`, `zero`, `ss01`-`ss15`, and `cv01`-`cv12`. Cascadia Code exposes `calt`, `rclt`, `rlig`, `zero`, `ss02`, `ss19`, and `ss20`.

![Rendered SVG comparing MonoLisa and Cascadia Code operator and ligature behavior](/images/comparison-monolisa-vs-cascadia-code-ligatures.svg)

## Glyph distinction

The shared ambiguity specimen has been rendered for review. Use it to compare common problem pairs such as `0O`, `1lI|`, brackets, quotes, punctuation, and operators.

[Marcus input: Add notes for intentional MonoLisa tradeoffs.]

![Rendered SVG comparing MonoLisa and Cascadia Code ambiguous glyph shapes](/images/comparison-monolisa-vs-cascadia-code-glyphs.svg)

## Italics and style range

The italic/style specimen has been rendered for review. Confirm whether the comparison should emphasize true italics, cursive forms, slant behavior, or family width/weight range.

MonoLisa Code measured as variable upright and italic files with 10 named weights: Hairline, Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, and Black. The Cascadia Code v2407.024 archive includes 6 named weights: ExtraLight, Light, SemiLight, Regular, SemiBold, and Bold; the variable and static upright/italic builds expose that same weight range across the Code/Mono variants.

![Rendered SVG comparing MonoLisa and Cascadia Code italic and style samples](/images/comparison-monolisa-vs-cascadia-code-italics.svg)

## Terminal and console support

The measured standard Cascadia Code build has Powerline 0/6, box drawing 128/128, and block elements 32/32. Its Windows ascent differs from hhea/OS/2 typo metrics in v2407.024, so terminal line metrics should be checked in target apps.

For comparison, MonoLisa measured at Powerline 6/6, box drawing 128/128, block elements 32/32, with aligned hhea, OS/2 typo, and Windows vertical metrics.

![Rendered SVG comparing MonoLisa and Cascadia Code terminal symbols and box drawing](/images/comparison-monolisa-vs-cascadia-code-terminal.svg)

## Licensing and availability

Cascadia Code is free and open source. MonoLisa is a paid typeface with trial/customizer access. The rendered comparison graphics use path-based SVG output, so the published page does not require readers to have either font installed.

## Project activity

As of 2026-07-03, the Cascadia Code GitHub repository shows 19 non-draft, non-prerelease releases, with the latest release on 2024-11-27. Across the release history returned by the GitHub API, that is about 3.66 releases per year. The repository has 158 open issues, and the median close time for the recent closed-issue sample is 16.3 days. Treat this as a maintenance/activity signal, not a type-design quality score.

## Source links

- [MonoLisa](https://www.monolisa.dev/)
- [Cascadia Code repository](https://github.com/microsoft/cascadia-code)

## Measurement notes

Measurements in this draft use MonoLisa font files plus competitor font files downloaded from the official repository or release archive, fonttools metadata extraction, Hyperglot 0.8.1 language coverage with primary living orthographies and base characters, and path-based SVG specimens generated by `scripts/render-comparison-svgs.mjs`.

## Publication checklist

- [ ] Marcus design review completed.
- [ ] License/source basis checked.
- [ ] Rendered SVG specimens visually reviewed.
- [ ] Measured data verified against current font files.
- [ ] Final recommendation/conclusion written.

## Conclusion

Draft conclusion pending Marcus review. The measured data is ready; the remaining work is the qualitative design call: who should choose MonoLisa, who should choose Cascadia Code, and which tradeoff matters most.
