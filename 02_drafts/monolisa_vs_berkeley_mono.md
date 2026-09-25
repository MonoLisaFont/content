---
title: "Comparison of MonoLisa vs. Berkeley Mono"
published: YYYY-MM-DD
updated: 2026-09-25
draft: true
keywords: ["MonoLisa vs Berkeley Mono", "Berkeley Mono alternative", "coding fonts", "programming fonts"]
authors: ["Juho Vepsäläinen", "Marcus Sterz"]
---

Berkeley Mono offers condensed widths and adjustable slant; MonoLisa offers distinct italic forms and grade adjustment. Both are paid coding fonts with ligatures and customization. Compare the letterforms below before deciding which controls matter to your setup.

## Letterforms in code

Look at `r` in `return` and `run`: MonoLisa has a foot at the baseline, while Berkeley has a simpler stem. Then compare the `e` and brackets in `get["KEY"].run()`.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-berkeley-mono-code-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-berkeley-mono-code.svg" alt="The same three code lines in MonoLisa Code and Berkeley Mono: MonoLisa rendered locally, Berkeley excerpted from the vendor's vector specimen" width="100%" />
</picture>

*Berkeley excerpt: [U.S. Graphics Generic specimen](https://usgraphics.com/products/berkeley-mono#section-code), © U.S. Graphics; MonoLisa rendered locally. Sizes are illustrative, not matched measurements.*

The circles mark the baseline ending of each `r` in the enlarged details. Use these to inspect construction; judge small-size readability in your editor.

![Enlarged r, e, and brackets, with circles highlighting MonoLisa's baseline foot and Berkeley's straight r stem](/images/comparison-monolisa-vs-berkeley-mono-details.svg)

*Berkeley outlines: the same U.S. Graphics specimen, © U.S. Graphics; independently enlarged, with themed colors and annotations.*

## Width, slant, and italics

Berkeley's Normal and Condensed samples show how narrower letters shorten the same phrase. MonoLisa's grade control serves another purpose: it adjusts stroke thickness while preserving character widths.

![Berkeley Mono Normal and Condensed specimens showing HAL9000 EXABYTE at the same source scale](/images/comparison-monolisa-vs-berkeley-mono-widths.svg)

*Berkeley [width specimen](https://usgraphics.com/static/products/TX-02/images/TX-02-widths.2acb5eac2353.svg), © U.S. Graphics. Original outlines and equal scaling; colors adapted.*

Now look at the `a` in `a quantum`. MonoLisa changes its construction in italic, while Berkeley's shown Oblique keeps the double-storey form. Compare how much difference you want between comments and upright code.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-berkeley-mono-styles-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-berkeley-mono-styles.svg" alt="When a quantum system in MonoLisa upright and italic, and Berkeley Regular and Oblique" width="100%" />
</picture>

*Berkeley [2.000 datasheet](https://usgraphics.com/static/products/TX-02/datasheet/TX-02-datasheet.a43c0c7f8d8c.pdf), pp. 28 and 30, © U.S. Graphics; colors adapted. MonoLisa rendered locally; display sizes are illustrative.*

## Customization and terminal use

Both fonts can save letterform preferences into downloaded files. Berkeley's available widths, slants, and customization controls depend on the purchased modules; compare the package you would actually use.

MonoLisa's terminal symbols are measured locally. Berkeley documents its coverage, but we have not tested its font files. Check the symbols used by your own prompt or terminal interface.

## Which font should you choose?

Choose Berkeley if you prefer its industrial forms or need condensed widths and configurable slant. Consider MonoLisa if you prefer its italic contrast, want grade adjustment, or need the proportional MonoLisa Text companion.

## Try them in your editor

The [MonoLisa trial](https://www.monolisa.dev/buy/trial) includes Regular and Bold with limited characters. Coding ligatures, OpenType features, and grade are omitted; explore them in the [tester](https://www.monolisa.dev/tester).

Berkeley's [trial](https://usgraphics.com/catalog/FX-050) swaps slash/backslash and asterisk/number sign; its vendor warns against critical-code use. Compare [MonoLisa pricing](https://www.monolisa.dev/buy/) and [Berkeley's packages](https://usgraphics.com/products/berkeley-mono#section-purchase) once you know which suits you.

## At a glance

| Category | MonoLisa Code | Berkeley Mono |
| --- | --- | --- |
| **Sloped styles** | Italic | Oblique |
| **Variable axes** | Weight (`wght`), grade (`GRAD`) | Width (`wdth`), weight (`wght`), slant (`slnt`); modules determine range |
| **Style range** | 10 named weights | Standard package: Regular, Bold, and their Obliques; broader family available through add-ons |
| **Coding ligatures** | Yes | Yes |
| **Saved customization** | Customizer saves feature choices into downloaded files | Standard compiler saves basic choices; Supertype add-on extends controls |
| **Terminal symbols** | Powerline, box drawing, block elements measured | Documented by vendor; not measured here |
| **Language coverage** | Latin, Cyrillic, Greek, Hebrew, Armenian measured | See vendor's character coverage; no comparable local measurement |
| **Proportional counterpart** | MonoLisa Text, separately or in a bundle | Berkeley Mono is monospaced |
| **Availability** | Paid; limited free trial | Paid; restricted evaluation trial |
| **Source** | [MonoLisa](https://www.monolisa.dev/) | [U.S. Graphics](https://usgraphics.com/products/berkeley-mono) |

Berkeley entries reflect vendor documentation through 2.004, not local measurements. Available options depend on the purchased modules.

## Measurement notes

This comparison combines our existing MonoLisa measurements with Berkeley's public documentation, checked September 22, 2026. Berkeley specifications are based on the 2.000 datasheet, current catalog, and release notes through 2.004. The intervening releases include rendering and ligature fixes, a hyphen addition, and a slant-interpolation fix; the vendor specimen itself is not verified as a 2.004 rendering.

We did not render with the Berkeley trial, inspect the full commercial font, or measure its language coverage, vertical metrics, glyph counts, or shaping. The attributed vector excerpt comes from a public vendor specimen, used to discuss its visible letterforms in code. It is not a matched-size specimen or a test of editor rendering.

The MonoLisa code sample repeats three complete lines from the vendor’s Generic specimen. It uses the local Code upright font, HarfBuzz `hb-view`, weight 400, size 64, and a 76-unit line step in a 798 × 260 SVG. These are our display settings, not inferred Berkeley settings. The comparison retains only the three discussed lines from the vendor SVG, with backgrounds removed and both fonts using the same theme-aware syntax colors for keywords, strings, numbers, and punctuation. The panels are side by side on desktop and stacked on mobile. Regenerate the comparison SVGs with `node scripts/render-berkeley-comparison.mjs <path-to-MonoLisa-Code-upright-font>`. MonoLisa coverage comes from the series data in `01_ideas/comparison_language_coverage.json` and `01_ideas/comparison_typeface_data.csv`.

The detail graphic isolates `r`, `e`, and square brackets from the already attributed Generic excerpt. Positions and display scale are adjusted to inspect each shape; outlines are unchanged. The selected paths are stored in `scripts/berkeley-public-glyph-excerpts.json`.

The width graphic retains the Normal and Condensed rows from the public width specimen, with the same uniform scale for both. It is not a simulated horizontal compression. Source outlines and metadata are in `scripts/berkeley-public-width-excerpts.json`.

The style graphic uses a four-word excerpt from the labeled Regular and Oblique specimens in the 2.000 datasheet. MonoLisa uses its actual upright and italic files at weight 400. Regenerate the additional graphics with `node scripts/render-berkeley-details.mjs`; the extracted Berkeley outlines and source metadata are stored in `scripts/berkeley-public-style-excerpts.json`.

{/* Editorial review: Marcus to review design observations; Juho to add personal experience. Keep the distinction between vendor documentation and local measurements when editing. */}

Berkeley's documented [Master Fonts module](https://usgraphics.com/catalog/FX-202) has five widths, UltraCondensed through Normal, across ten weights and upright/oblique styles. Retina and Book require the Supertype compiler. Variable fonts are a separate module and their range depends on purchased masters. The [2.000 release notes](https://usgraphics.com/products/berkeley-mono/releases) renamed Italics to Obliques and introduced the slant axis. Berkeley distinguishes personal/developer licensing from commercial use.

The Standard compiler saves basic choices; the Supertype add-on extends the controls. We have not shaped identical operator sequences with the full Berkeley font; use the vendor's [ligature explorer](https://usgraphics.com/products/berkeley-mono/ligatures) to inspect its offering. MonoLisa's measured files have weight and grade axes, not width or slant.

The Generic excerpt retains three complete lines and original outlines, with colors adapted. Its rendering settings and font version are not stated. The enlarged details do not establish relative width, darkness, or small-size sharpness; the width sample illustrates a design option, not extra editor-column capacity. See the full [Berkeley code specimens](https://usgraphics.com/products/berkeley-mono#section-code) for context.
