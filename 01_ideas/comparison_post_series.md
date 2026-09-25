---
title: "Comparison post series"
published: 2026-07-03
updated: 2026-09-25
keywords: ["typefaces", "coding fonts", "font comparison"]
authors: ["Juho Vepsäläinen", "Marcus Sterz"]
---

This file is the planning and data layer for a series of SEO-oriented comparison posts, based on [GitHub issue #12](https://github.com/MonoLisaFont/content/issues/12). Each final post should compare MonoLisa against one well-known coding typeface using the same categories, visual comparison slots, and designer-review prompts.

## Recommended post list

Use the exact comparison phrase in the title because it matches likely search intent:

- Comparison of MonoLisa vs. JetBrains Mono
- Comparison of MonoLisa vs. Fira Code
- Comparison of MonoLisa vs. Cascadia Code
- Comparison of MonoLisa vs. Hack
- Comparison of MonoLisa vs. Source Code Pro
- Comparison of MonoLisa vs. IBM Plex Mono
- Comparison of MonoLisa vs. Monaspace
- Comparison of MonoLisa vs. Recursive Mono
- Comparison of MonoLisa vs. Dank Mono
- Comparison of MonoLisa vs. Operator Mono
- Comparison of MonoLisa vs. PragmataPro
- Comparison of MonoLisa vs. Berkeley Mono

Berkeley Mono has a draft at `02_drafts/monolisa_vs_berkeley_mono.md`. It uses public documentation through 2.004 and a credited vector specimen excerpt rather than trial-font rendering. Its feature summary is consolidated into the comparison table; omit the redundant infographic for this post. Regenerate its MonoLisa specimen SVG with `scripts/render-berkeley-comparison.mjs`; preserve the vendor attribution and the distinction between vendor documentation and local measurements.

## Shared comparison categories

Aim for 300–500 words of main prose, excluding headings, the table, infographic disclosure, and Measurement notes. Start with the main visible difference, then give each specimen one or two sentences pointing to specific letters, operators, or spacing. Use the landing page's focus on distinction, italic construction, width, and spacing as inspiration, but base every observation on the fonts actually shown. Keep feature-tag lists and weight inventories in the table or notes. Avoid repeating the same specifications in the introduction, body, and recommendation.

Use this order, combining sections when the specimens support it:

1. Short introduction
2. Design intent and reading comfort, with specimens
3. Coding features, with an operator specimen
4. Glyph distinction, with a specimen
5. Italics and style range, with a specimen
6. Terminal symbols, with a specimen
7. Recommendation and trial links
8. Comparison table, including language coverage, customization, and availability
9. Optional summary infographic in a collapsed disclosure
10. Measurement notes

## Post template

````markdown
---
title: "Comparison of MonoLisa vs. TYPEFACE"
published: YYYY-MM-DD
updated: YYYY-MM-DD
keywords: ["MonoLisa vs TYPEFACE", "TYPEFACE alternative", "coding fonts", "programming fonts"]
authors: ["Juho Vepsäläinen", "Marcus Sterz"]
---

[Write a short introduction naming the main difference the specimens will show.]

## Design intent and reading comfort

Point to one visible difference in the code sample, such as letter width, punctuation weight, or the space between strokes. Name a token the reader can find in the image.

![MonoLisa and TYPEFACE code texture comparison](/images/comparison-monolisa-vs-TYPEFACE-texture.png)

## Coding features

Point to a specific operator or arrow and explain the visible difference. Put complete OpenType tag lists in Measurement notes.

![MonoLisa and TYPEFACE ligature comparison](/images/comparison-monolisa-vs-TYPEFACE-ligatures.png)

## Glyph distinction

Use a fixed specimen that exposes common ambiguity:

```text
0O o0 1lI| !iI []{}() <> <= >= == === != !==
rn m vv w ' " ` , . : ; / \ - _ + * # @ &
```

Name one or two distinguishing cues in the specimen, such as the mark inside zero or the foot on lowercase l.

![MonoLisa and TYPEFACE ambiguous glyph comparison](/images/comparison-monolisa-vs-TYPEFACE-glyphs.png)

## Italics and style range

Point to a letter that changes between the shown styles. Explain how that affects the appearance of italic syntax; keep full style inventories in the table or notes.

![MonoLisa and TYPEFACE italic comparison](/images/comparison-monolisa-vs-TYPEFACE-italics.png)

## Terminal and console support

Direct attention to the colored prompt joins, table borders, or block progress bars. Use the landing page's terminal-window styling and the same sample in both fonts. Briefly identify any missing symbols and the measured build; put counts and vertical-metric details in Measurement notes.

![MonoLisa and TYPEFACE terminal comparison](/images/comparison-monolisa-vs-TYPEFACE-terminal.png)

## Conclusion

Give a brief recommendation based on the main differences shown. State whether the competing font is free or paid without repeating the full feature list.

Include trial and tester links so readers can evaluate the fonts in their own setup.

## Quick comparison

| Category | MonoLisa | TYPEFACE |
| --- | --- | --- |
| Pricing | Paid, with trial/customizer | TBD |
| Coding ligatures | Yes, opt-in coding ligatures plus whitespace ligatures | TBD |
| Italics | Yes | TBD |
| Variable font | TBD | TBD |
| Stylistic sets | Yes | TBD |
| Character variants | Yes | TBD |
| Proportional counterpart | Yes, MonoLisa Text | TBD |
| Terminal symbols | Powerline/box drawing: TBD | TBD |

<details>
  <summary>View comparison infographic</summary>

  <img src="/images/comparison-monolisa-vs-TYPEFACE-summary.svg" alt="Summary infographic comparing MonoLisa and TYPEFACE" width="100%" />
</details>

## Measurement notes

Place methodology at the end, after the comparison table and infographic disclosure. Record measured font versions, tools and commands, feature settings, and limitations. Keep reproducible details here instead of interrupting the comparison; mark pending measurements explicitly.

{/* Editorial review: Marcus to review the design observations and recommendation; verify data, sources, permissions, specimens, and the 300–500-word main-prose target before publication. Deferred comparisons must not invent observations to fill the target length. */}
````

## Graphics system

Lead with the detailed specimens and move the comparison table near the end, after the recommendation and trial links. Every published comparison must include a summary infographic in a collapsed `<details>` element after the table and before Measurement notes. Label its `<summary>` "View comparison infographic", and omit the `open` attribute. Keep it when revising the post. Use verified data matching the font version and family shown in the article, and explain coverage or speaker-count estimates alongside the graphic inside the disclosure. Deferred drafts must complete this graphic before publication, except Berkeley Mono, whose summary is consolidated into its comparison table.

Each post should use the following graphics so the series feels consistent:

- Summary infographic: an optional visual reference inside the disclosure, saved as `/images/comparison-monolisa-vs-<typeface>-summary.svg`.

- Texture image: the same 10-15 lines of real code in both fonts, same point size, same line height, same foreground/background.
- Glyph ambiguity image: a two-column specimen of `0O`, `1lI|`, punctuation, brackets, quotes, operators, and symbols.
- Ligature/control image: the same operator-heavy snippet with ligatures off and on where possible.
- Terminal image: matching terminal windows with a colored Powerline prompt, box-drawing table, standard Unicode block progress bars, and a compact status line, following the landing page's “Symbols for Terminal” treatment. Keep the same content, font size, line height, and colors in both panels; stack the panels on mobile.

Use enlarged details to connect graphics to specific observations in the copy. Keep the full specimen below the enlargement; limit the emphasis to one or two features, with the same soft circle treatment on both fonts. Circle fills sit behind the glyph outlines and inherit the site's accent color. Short captions identify the feature without ranking the fonts. On mobile, keep matching enlarged details adjacent even when the full font specimens stack vertically.

The shared renderer reads focus definitions from `scripts/comparison-focus.mjs`. These currently cover zero marks, punctuation dots, curved letter outlines, lowercase l feet, Fira's comma/bracket details, and upright/italic a and f comparisons for Monaspace and Fira. Fira's slanted specimen is explicitly synthesized from its upright font at 10°, matching the angle recorded in MonoLisa's italic file. Label it “Software slant” and document the setting; do not imply that Fira provides drawn italic styles or that all editors use this angle. Add a highlight only where the supplied font files and the post's observations support it. Use `node scripts/render-comparison-svgs.mjs scripts/comparison-fonts.local.json --focus-only` to regenerate the affected graphics, or insert a comparison key before `--focus-only` for one font. Berkeley's existing enlarged r comparison uses the same circle treatment through `scripts/render-berkeley-details.mjs`, preserving the vendor outlines and its separate rendering scope.

The terminal layout lives in `scripts/render-terminal-comparison.mjs`. Regenerate desktop and mobile specimens with `node scripts/render-comparison-svgs.mjs scripts/comparison-fonts.local.json --terminal-only`, optionally adding a font key before the flag. The renderer measures actual glyph advances for segment backgrounds and draws every character from its font file, including missing-glyph outlines. It does not insert fallback fonts or replacement arrows. Use standard Unicode blocks for the shared progress rows, rather than MonoLisa's private-use progress symbols. Explain missing symbols beside the specimen and note that actual terminal line spacing and fallback settings can change the result. Berkeley and deferred commercial comparisons should adopt this format when licensed files can be measured; do not invent competitor specimens from unverified coverage claims.

Recommended image filenames:

- `/images/comparison-monolisa-vs-jetbrains-mono-texture.png`
- `/images/comparison-monolisa-vs-jetbrains-mono-glyphs.png`
- `/images/comparison-monolisa-vs-jetbrains-mono-ligatures.png`
- `/images/comparison-monolisa-vs-jetbrains-mono-terminal.png`

SVG is likely the best primary output format for the comparison graphics. The existing SVGs in this repository use CSS variables such as `var(--icon-primary, currentColor)` and `var(--icon-secondary, currentColor)`, which means new comparison graphics can inherit the site theme instead of baking colors into raster images.

Recommended local rendering setup:

- Store source fonts under a local ignored directory such as `.font-sources/` or install them to the system font directory.
- Use `fonttools` for metadata extraction: names, OpenType features, character maps, vertical metrics, and glyph availability.
- Use HarfBuzz tooling such as `hb-shape` or `hb-view` to test ligatures and feature toggles reliably.
- Use a small script to render repeatable SVG specimens from the same text strings, font size, line height, feature flags, and theme variables.
- Export PNG only as a fallback for platforms that do not preserve SVG behavior.

Important: the SVG renderer should either convert text to paths for stable publishing or keep editable text only when the website can reliably load both compared fonts. Path-based SVGs are heavier but avoid missing-font rendering on readers' machines.

This repository now includes a path-based HarfBuzz renderer:

```bash
node scripts/download-free-comparison-fonts.mjs
node scripts/inspect-comparison-fonts.mjs scripts/comparison-fonts.local.json
node scripts/measure-language-coverage.mjs scripts/comparison-fonts.local.json
node scripts/measure-repository-activity.mjs
node scripts/render-comparison-svgs.mjs scripts/comparison-fonts.local.json
```

By default, the scripts read `scripts/comparison-fonts.json`. If local filenames differ, create `scripts/comparison-fonts.local.json`; it is ignored by Git. Font binaries should go under `.font-sources/`, which is also ignored by Git.

Hyperglot is installed locally in `.venv-hyperglot/`, which is ignored by Git. Recreate it with:

```bash
python3 -m venv .venv-hyperglot
.venv-hyperglot/bin/python -m pip install hyperglot
```

Expected local font layout:

```text
.font-sources/
  monolisa/
    MonoLisa-Regular.ttf
    MonoLisa-RegularItalic.ttf
  jetbrains-mono/
    JetBrainsMono-Regular.ttf
    JetBrainsMono-Italic.ttf
  fira-code/
    FiraCode-Regular.ttf
  cascadia-code/
    CascadiaCode.ttf
    CascadiaCodeItalic.ttf
  hack/
    Hack-Regular.ttf
    Hack-Italic.ttf
  source-code-pro/
    SourceCodePro-Regular.ttf
    SourceCodePro-It.ttf
  ibm-plex-mono/
    IBMPlexMono-Regular.ttf
    IBMPlexMono-Italic.ttf
  monaspace/
    MonaspaceNeon-Regular.otf
    MonaspaceNeon-Italic.otf
  recursive-mono/
    RecMonoLinear-Regular.ttf
    RecMonoLinear-Italic.ttf
  dank-mono/
    DankMono-Regular.ttf
    DankMono-Italic.ttf
  operator-mono/
    OperatorMono-Book.otf
    OperatorMono-BookItalic.otf
  pragmatapro/
    PragmataPro-Regular.ttf
    PragmataPro-Italic.ttf
```

The renderer writes the SVGs referenced by the draft posts, for example `/images/comparison-monolisa-vs-jetbrains-mono-texture.svg`. It uses paths generated by `hb-view`, so the published SVGs do not require the reader to have the fonts installed.

## Licensing notes for render inputs

This is not legal advice, but it is the working rule for this series:

- Free/open-source fonts: the downloaded comparison fonts are kept under `.font-sources/` and are not committed. Their licenses are downloaded beside the binaries for auditability. For SIL OFL fonts, publishing rendered specimens is generally compatible with normal font use, especially when the SVG contains outlines rather than redistributed font binaries. If we ever distribute the font files themselves, include the license files and follow each license's reserved-name and modification rules.
- Paid/trial fonts: do not publish rendered comparison graphics until the EULA or written permission clearly allows public comparison/specimen use. Path-based SVGs avoid shipping font binaries, but they are still public use of the typeface design. If a trial license is only for private evaluation, use the trial internally for notes only, then replace the visual with an official specimen screenshot/link or skip that visual.
- Paid-font handoff: save the font files outside Git, save the EULA/trial terms as text or PDF, and add local paths in `scripts/comparison-fonts.local.json`. Ask Marcus to review the final specimens before publication.
- Commercial-font timing: Dank Mono, Operator Mono, and PragmataPro should be handled after the free-font posts. As of the current manual check, Dank Mono does not appear to offer a free trial, so its post should remain a placeholder until we either buy/license it, receive permission/specimens, or decide to compare only against public information.

## Data table

Legend:

- `Yes` and `No` mean the claim was visible in the public source listed.
- `TBD` means do not publish the claim yet.
- `Measure` means the public source is not enough; inspect font files or run a Hyperglot/fonttools pass.
- Language counts use Hyperglot 0.8.1 with primary orthographies, living languages, base character support, and shaping disabled. See `01_ideas/comparison_language_coverage.json`.
- MonoLisa's published language count includes Hyperglot's two Armenian orthographies; MonoLisa has full Armenian support.

| Typeface | Source status | Languages | Scripts / writing systems | Coding ligatures | Italic | Paid | Free trial | Variable option | Stylistic sets | Character variants | Proportional counterpart | Own website | Zero style | Powerline symbols | Box drawing | Equal vertical metrics | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MonoLisa | Measured locally | 593 publishable measured | Latin 496, Cyrillic 88, Hebrew 5, Greek 2, Armenian 2 | Yes | Yes | Yes | Yes | Yes | Yes; `ss01`-`ss15` measured, including `ss01` script variant | Yes; `cv01`-`cv12` measured | Yes, MonoLisa Text | Yes | `zero` feature measured | Yes | Yes | Yes; hhea/OS/2 typo/win metrics align in v3.000 | Measured from MonoLisaCode v3.000: 2105 glyphs, 1784 cmap entries, Hyperglot 593 publishable languages, Powerline 6/6, box drawing 128/128, block elements 32/32. |
| JetBrains Mono | Repository release measured | 358 measured | Latin 331, Cyrillic 25, Greek 2 | Yes | Yes | No | N/A | TBD | Yes; `ss01`, `ss02`, `ss19`, `ss20` measured | Yes; `cv01`-`cv12`, `cv14`-`cv20`, `cv99` measured | No obvious counterpart | Yes | `zero` feature measured | Yes | Yes | Yes; hhea/OS/2 typo/win metrics align in v2.304 | Measured from JetBrains Mono v2.304: 1743 glyphs, 1363 cmap entries, Hyperglot 358 languages, Powerline 6/6, box drawing 128/128, block elements 32/32. |
| Fira Code | Repository release measured | 395 measured | Latin 302, Cyrillic 91, Greek 2 | Yes | No official italic files in v6.2 release archive | No | N/A | Yes | Yes; `ss01`-`ss10` measured | Yes; `cv01`-`cv32` measured | Fira Sans / Fira Mono family relation | Yes | `zero` feature measured | Yes | Yes | Yes; hhea/OS/2 typo/win metrics align in v6.002 | Measured from official Fira Code v6.2 release file: 2030 glyphs, 1586 cmap entries, Hyperglot 395 languages, Powerline 6/6, box drawing 128/128, block elements 32/32. |
| Cascadia Code | Repository release measured | 513 measured | Latin 421, Cyrillic 50, Arabic 40, Greek 2 | Yes; Cascadia Mono variant disables ligatures | Yes | No | N/A | Yes | Yes; `ss02`, `ss19`, `ss20` measured | TBD | No obvious proportional counterpart | Yes | `zero` feature measured | No in standard Cascadia Code build measured | Yes | No; Win ascent differs from hhea/OS/2 typo in v2407.024 | Measured from Cascadia Code v2407.024: 4319 glyphs, 2426 cmap entries, Hyperglot 513 languages, Powerline 0/6, box drawing 128/128, block elements 32/32. Use PL build if comparing Powerline specifically. |
| Hack | Repository release measured | 382 measured | Latin 306, Cyrillic 73, Armenian 2, Greek 1 | No | Yes | No | N/A | No | None measured | None measured | No obvious counterpart | Yes | Oval-filled zero | Yes | Yes | No; typo metrics and line gap differ from hhea/win in v3.003 | Measured from Hack v3.003: 1573 glyphs, 1548 cmap entries, Hyperglot 382 languages, Powerline 6/6, box drawing 128/128, block elements 32/32. |
| Source Code Pro | Repository release measured | 413 measured | Latin 356, Cyrillic 55, Greek 2 | No coding ligatures found in public README | Yes | No | N/A | Yes | Yes; `ss01`-`ss07` measured | Yes; selected `cvXX` features measured | Source Sans family relation | Yes | `zero` feature measured | Yes | Yes | No; hhea/win differ from OS/2 typo metrics in v2.042 | Measured from Source Code Pro v2.042: 1568 glyphs, 1369 cmap entries, Hyperglot 413 languages, Powerline 6/6, box drawing 128/128, block elements 32/32. |
| IBM Plex Mono | Repository release measured | 410 measured | Latin 341, Cyrillic 69 | No coding ligatures found in public README | Yes | No | N/A | TBD | Yes; `ss01`-`ss09` measured | TBD | IBM Plex Sans / Serif / Sans Condensed | Yes | `zero` feature measured | No | Yes | No; typo metrics and line gap differ from hhea/win in v2.005 | Measured from IBM Plex Mono v2.005: 1207 glyphs, 1082 cmap entries, Hyperglot 410 languages, Powerline 0/6, box drawing 128/128, block elements 32/32. |
| Monaspace | Repository release measured | 368 measured | Latin 338, Cyrillic 28, Greek 2 | Yes, 10 stylistic-set groups | Yes; named Italic instances; Latin construction is predominantly oblique, with family-specific alternates | No | N/A | Yes, three axes (`wght`, `wdth`, `slnt`) | Yes; `ss01`-`ss10` measured | Yes; selected `cvXX` features measured | Five-family coding superfamily, not a normal proportional text counterpart | Yes | Character variants include zero alternates | Yes in measured Neon build | Yes | No; Win descent differs from hhea/OS/2 typo in v1.400 | Measured from static Monaspace Neon v1.400 files: 3606 glyphs, 2460 cmap entries, Hyperglot 368 languages, Powerline 6/6, box drawing 128/128, block elements 32/32. All five v1.400 variable fonts expose `wght`, `wdth`, and `slnt`. At the automatic slant-triggered switch, basic-Latin substitutions are: Neon none; Argon `f`; Xenon `f`, `h`, `i`, `k`, `l`, `m`, `n`, `r`, `u`; Radon none; Krypton none. A separate `ital` feature contains additional alternates that axis movement alone does not necessarily activate. |
| Recursive Mono | Repository release measured | 345 measured | Latin 345 | Yes; coding sequences shaped through `rclt` in static Rec Mono Linear | Yes | No | N/A | Yes, five axes | None measured in static Rec Mono Linear | None measured in static Rec Mono Linear | Yes, Sans and Mono in one system | Yes | TBD | Yes | No | No; Win metrics differ from hhea/OS/2 typo in v1.085 | Measured from Rec Mono Linear v1.085: 1379 glyphs, 783 cmap entries, Hyperglot 345 languages, Powerline 6/6, box drawing 0/128, block elements 0/32. |
| Dank Mono | Deferred commercial font | TBD | TBD | Yes, advertised by product positioning but source needs confirmation | Yes | Yes | No free trial found; verify before publishing | TBD | TBD | TBD | TBD | Yes | TBD | TBD | TBD | Measure | Cover later with a licensed copy, written permission/specimens, or public-information-only comparison. |
| Operator Mono | Needs verification | TBD | TBD | TBD | Yes | Yes | TBD | TBD | TBD | TBD | Yes, Operator family | Yes | TBD | TBD | TBD | Measure | Paid-site data should be checked manually before publishing. |
| PragmataPro | Partly verified | Measure | Latin, Greek, Cyrillic, Hebrew, Arabic, IPA advertised in public summaries | Yes in full versions | Yes | Yes | Essential edition can be used for testing? verify | TBD | TBD | TBD | PragmataPro / PragmataPro Mono variants | Yes | TBD | Yes | Yes | Measure | Very broad glyph coverage; needs careful edition-by-edition handling. |

## Repository activity data

Repository activity is a support/maintenance signal, not a design-quality score. These values come from the GitHub REST API on 2026-07-03. Release cadence uses non-draft, non-prerelease GitHub releases from the first results page. Open issues use `is:issue is:open`. Close speed is median days from `created_at` to `closed_at` for up to 100 recently updated closed issues, excluding pull requests. See `01_ideas/comparison_repository_activity.json`.

| Typeface | Latest release | Releases/year | Open issues | Median close time |
| --- | --- | ---: | ---: | ---: |
| JetBrains Mono | 2023-01-14 | 5.37 | 198 | 47.3 days |
| Fira Code | 2021-12-06 | 4.1 | 423 | 0.7 days |
| Cascadia Code | 2024-11-27 | 3.66 | 158 | 16.3 days |
| Hack | 2018-03-06 | 5.55 | 144 | 5.2 days |
| Source Code Pro | 2023-04-12 | 1.28 | 84 | 4.3 days |
| IBM Plex Mono | 2026-06-11 | 8.31 | 73 | 31.7 days |
| Monaspace | 2026-03-28 | 2.94 | 52 | 194.8 days |
| Recursive Mono | 2022-06-30 | 12.73 | 37 | 11.3 days |

## Source list

- GitHub issue #12: https://github.com/MonoLisaFont/content/issues/12
- MonoLisa: https://www.monolisa.dev/
- JetBrains Mono: https://www.jetbrains.com/lp/mono/
- Fira Code: https://github.com/tonsky/FiraCode
- Cascadia Code: https://github.com/microsoft/cascadia-code
- Hack: https://sourcefoundry.org/hack/
- Source Code Pro: https://github.com/adobe-fonts/source-code-pro
- IBM Plex: https://github.com/IBM/plex
- Monaspace: https://github.com/githubnext/monaspace
- Recursive: https://www.recursive.design/
- PragmataPro: https://fsd.it/shop/fonts/pragmatapro/
- Hyperglot: https://hyperglot.rosettatype.com/

## Open data tasks

- Run a measured language/script pass for paid fonts after their binaries and license terms are available.
- Inspect OpenType feature tags from actual font binaries for `liga`, `dlig`, `calt`, `zero`, `ssXX`, `cvXX`, Powerline, box drawing, and vertical metrics.
- Decide whether "IBM Plex" should mean only IBM Plex Mono or the broader Plex family in the post.
- Cover commercial fonts later: verify trial/license availability for Operator Mono and PragmataPro; for Dank Mono, no free trial has been found so far.
- Ask Marcus to review the design-notes placeholders before any final post is published.
