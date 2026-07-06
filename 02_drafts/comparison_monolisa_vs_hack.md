---
title: "Comparison of MonoLisa vs. Hack"
published: YYYY-MM-DD
updated: 2026-07-03
draft: true
keywords: ["MonoLisa vs Hack", "Hack font alternative", "coding fonts", "programming fonts"]
authors: ["Juho Vepsäläinen", "Marcus Sterz"]
---

MonoLisa and Hack are both coding fonts, but they optimize for different priorities. This comparison looks at glyph clarity, ligatures, italics, language coverage, terminal support, customization, and licensing.

## Quick comparison

| Category | MonoLisa | Hack |
| --- | --- | --- |
| Pricing | Paid, with trial/customizer | Free and open source |
| Coding ligatures | Yes | No |
| Italics | Yes | Yes |
| Language coverage | 593 publishable languages measured | 382 publishable languages measured |
| Writing systems | Latin, Cyrillic, Greek, Hebrew, and Armenian measured | Latin, Cyrillic, Armenian, and Greek measured |
| Weights included | 10 named weights in Code upright and italic variable files | 2 weights, Regular and Bold, with italics |
| Variable font | Yes | No |
| Variable axes | `wght`, `GRAD` measured | None measured |
| Stylistic sets | Yes; `ss01`-`ss15` measured, including `ss01` script variant | None measured |
| Character variants | Yes; `cv01`-`cv12` measured | None measured |
| Proportional counterpart | Yes, MonoLisa Text | No obvious proportional counterpart |
| Terminal symbols | Powerline, box drawing, and block elements measured | Powerline, box drawing, and block elements measured |

## Design intent and reading comfort

The code texture specimen has been rendered for review. Marcus should still add the type-design interpretation before publication.

[Marcus input: Explain the most important type-design distinction in one concrete paragraph.]

![Rendered SVG comparing MonoLisa and Hack code texture](/images/comparison-monolisa-vs-hack-texture.svg)

## Language and script coverage

MonoLisa measured at 2105 glyphs and 1784 cmap entries. Hack measured at 1573 glyphs and 1548 cmap entries.

Language coverage is one of the clearest measured differences in MonoLisa's favor. Using Hyperglot 0.8.1 with primary orthographies, living languages, base character support, and shaping disabled, MonoLisa measured at 593 publishable languages across Latin, Cyrillic, Hebrew, Greek, and Armenian. Hack measured at 382 languages across Latin, Cyrillic, Armenian, and Greek. Treat these as comparable local measurements, not universal language promises: the result depends on the tested font file, orthography settings, and whether auxiliary characters, punctuation, marks, and shaping are included.

## Coding features

Hack is a useful no-frills baseline because no coding ligature feature set was measured. MonoLisa exposes coding ligatures, stylistic sets, and character variants; Hack keeps the feature surface smaller.

Measured feature summary: MonoLisa exposes `liga`, `dlig`, `calt`, `zero`, `ss01`-`ss15`, and `cv01`-`cv12`. Hack exposes `aalt`, `frac`, `locl`, `ordn`, `sinf`, `subs`, and `sups`; no coding ligature feature set measured.

![Rendered SVG comparing MonoLisa and Hack operator and ligature behavior](/images/comparison-monolisa-vs-hack-ligatures.svg)

## Glyph distinction

The shared ambiguity specimen has been rendered for review. Use it to compare common problem pairs such as `0O`, `1lI|`, brackets, quotes, punctuation, and operators.

[Marcus input: Add notes for intentional MonoLisa tradeoffs.]

![Rendered SVG comparing MonoLisa and Hack ambiguous glyph shapes](/images/comparison-monolisa-vs-hack-glyphs.svg)

## Italics and style range

The italic/style specimen has been rendered for review. Confirm whether the comparison should emphasize true italics, cursive forms, slant behavior, or family width/weight range.

MonoLisa Code measured as variable upright and italic files with 10 named weights: Hairline, Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, and Black. The Hack v3.003 TTF archive includes 2 weights, Regular and Bold, each with upright and italic styles.

![Rendered SVG comparing MonoLisa and Hack italic and style samples](/images/comparison-monolisa-vs-hack-italics.svg)

## Terminal and console support

Hack measured at Powerline 6/6, box drawing 128/128, and block elements 32/32. Its typo metrics and line gap differ from hhea/Windows metrics in v3.003.

For comparison, MonoLisa measured at Powerline 6/6, box drawing 128/128, block elements 32/32, with aligned hhea, OS/2 typo, and Windows vertical metrics.

![Rendered SVG comparing MonoLisa and Hack terminal symbols and box drawing](/images/comparison-monolisa-vs-hack-terminal.svg)

## Licensing and availability

Hack is free and open source. MonoLisa is a paid typeface with trial/customizer access. The rendered comparison graphics use path-based SVG output, so the published page does not require readers to have either font installed.

## Project activity

As of 2026-07-03, the Hack GitHub repository shows 15 non-draft, non-prerelease releases, with the latest release on 2018-03-06. Across the release history returned by the GitHub API, that is about 5.55 releases per year. The repository has 144 open issues, and the median close time for the recent closed-issue sample is 5.2 days. Treat this as a maintenance/activity signal, not a type-design quality score.

## Source links

- [MonoLisa](https://www.monolisa.dev/)
- [Hack repository](https://github.com/source-foundry/Hack)

## Measurement notes

Measurements in this draft use MonoLisa font files plus competitor font files downloaded from the official repository or release archive, fonttools metadata extraction, Hyperglot 0.8.1 language coverage with primary living orthographies and base characters, and path-based SVG specimens generated by `scripts/render-comparison-svgs.mjs`.

## Publication checklist

- [ ] Marcus design review completed.
- [ ] License/source basis checked.
- [ ] Rendered SVG specimens visually reviewed.
- [ ] Measured data verified against current font files.
- [ ] Final recommendation/conclusion written.

## Conclusion

Draft conclusion pending Marcus review. The measured data is ready; the remaining work is the qualitative design call: who should choose MonoLisa, who should choose Hack, and which tradeoff matters most.
