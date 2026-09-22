---
title: "Comparison of MonoLisa vs. Berkeley Mono"
published: YYYY-MM-DD
updated: 2026-09-22
draft: true
keywords: ["MonoLisa vs Berkeley Mono", "Berkeley Mono alternative", "coding fonts", "programming fonts"]
authors: ["Juho Vepsäläinen", "Marcus Sterz"]
---

Berkeley Mono and MonoLisa are both paid coding fonts with ligatures and customizable letterforms. If Berkeley's industrial character appeals to you but you want a different italic voice or a proportional companion for prose, MonoLisa is worth trying. If fitting code into narrower columns is your priority, Berkeley's width options deserve a closer look.

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

## Letterforms in code

The three lines below come from Berkeley's public code specimen. They put letters and punctuation together in a way a single enlarged character cannot: look at the lowercase `r` in `return` and `run`, the shape of the `e` in `get`, and the square brackets beside the parentheses in `get["KEY"].run()`.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-berkeley-mono-code-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-berkeley-mono-code.svg" alt="The same three code lines in MonoLisa Code and Berkeley Mono: MonoLisa rendered locally, Berkeley excerpted from the vendor's vector specimen" width="100%" />
</picture>

*Berkeley source: U.S. Graphics Company, [Generic code specimen](https://usgraphics.com/products/berkeley-mono#section-code), artwork © U.S. Graphics. Three lines excerpted from the public SVG with the original glyph outlines retained and syntax colors adapted to the site theme. The vendor's rendering settings and specimen version are not stated.*

MonoLisa's `r` has a visible foot at the baseline; Berkeley's has a simpler stem without that foot. In `get`, compare how the crossbar meets the curved bowl of `e`. Then follow the punctuation through the second line: the square brackets and round parentheses give the call structure its own rhythm in each font.

The matching text makes those details easier to locate, but the images are not a controlled rendering comparison. Both panels follow the site theme, and display sizes were chosen for readability; they do not establish equal font size, weight, or line height. Use these excerpts to compare letterforms, not relative width, darkness, or small-size sharpness. Explore the complete [Berkeley code specimens](https://usgraphics.com/products/berkeley-mono#section-code) and [MonoLisa tester](https://www.monolisa.dev/tester) before trying either in your editor.

The enlarged details below isolate the same shapes. MonoLisa's foot on `r` is easy to spot here; the `e` and brackets invite a closer look at how curves meet horizontal strokes. Enlargement helps inspect construction, but it is not a small-size readability test.

![Enlarged r, e, and square brackets in MonoLisa Code and Berkeley Mono, with construction notes](/images/comparison-monolisa-vs-berkeley-mono-details.svg)

*Berkeley outlines excerpted from the same [U.S. Graphics Generic specimen](https://usgraphics.com/products/berkeley-mono#section-code), artwork © U.S. Graphics; MonoLisa rendered locally. Glyphs are enlarged independently, with themed colors and added annotations.*

## Width, slant, and italics

Berkeley has a practical attraction if you want to adjust how much code fits in a pane. Its [Master Fonts module](https://usgraphics.com/catalog/FX-202) provides five widths, from UltraCondensed to Normal, across ten weights and upright/oblique styles. Retina and Book require the Supertype compiler. Variable fonts are a separate module, and their available range depends on the masters purchased.

The vendor's Normal and Condensed specimens below keep the wording and source scale constant. Notice how the narrower forms shorten the line while retaining the same text. This illustrates the width choice; it does not measure how many extra columns fit in a particular editor.

![Berkeley Mono Normal and Condensed specimens showing HAL9000 EXABYTE at the same source scale](/images/comparison-monolisa-vs-berkeley-mono-widths.svg)

*Source: U.S. Graphics, [public width specimen](https://usgraphics.com/static/products/TX-02/images/TX-02-widths.2acb5eac2353.svg), artwork © U.S. Graphics. Two rows excerpted with original outlines and equal scaling; labels and colors adapted.*

MonoLisa's variable controls serve a different purpose. Weight changes the weight; grade adjusts stroke thickness while preserving character widths. There is no width or slant axis in the measured MonoLisa files. If you want a condensed version, grade will not provide one.

For sloped syntax, MonoLisa offers italic styles. Berkeley calls its styles Oblique: its [2.000 release notes](https://usgraphics.com/products/berkeley-mono/releases) explicitly record the rename from Italics and the introduction of the slant axis. That is a useful distinction to try visually, not a reason to declare one approach better. Compare how much contrast you want between comments and upright code.

The same short phrase below shows the change from upright to sloped styles. Look at the `a` in `a quantum`: MonoLisa changes its construction in italic, while Berkeley's displayed oblique keeps the double-storey form. This makes the distinction more concrete than the style names alone.

<picture>
  <source media="(max-width: 640px)" srcSet="/images/comparison-monolisa-vs-berkeley-mono-styles-mobile.svg" />
  <img src="/images/comparison-monolisa-vs-berkeley-mono-styles.svg" alt="When a quantum system in MonoLisa upright and italic, and Berkeley Regular and Oblique" width="100%" />
</picture>

*Berkeley excerpts: U.S. Graphics, [2.000 datasheet](https://usgraphics.com/static/products/TX-02/datasheet/TX-02-datasheet.a43c0c7f8d8c.pdf), PDF pages 28 and 30, 18-point specimens. Original outlines retained; colors adapted. MonoLisa rendered locally. Display sizes are illustrative, not matched font measurements.*

## Both let you save your preferences

Neither font requires you to rely entirely on an editor's OpenType controls. MonoLisa's customizer saves feature choices into downloaded files. Berkeley's Standard compiler also saves basic stylistic choices; its Supertype add-on extends the available controls. That makes saved customization a shared strength rather than a reason on its own to switch.

Both offer coding ligatures. We have not shaped identical operator sequences with the full Berkeley font, so we are not ranking their ligature coverage or behavior. Berkeley's [ligature explorer](https://usgraphics.com/products/berkeley-mono/ligatures) is the useful reference for operators you use regularly.

## Coverage and terminal use

Our MonoLisa measurements cover Latin, Cyrillic, Greek, Hebrew, and Armenian, along with Powerline symbols, box drawing, and block elements. Berkeley documents terminal symbols and character coverage in its [datasheet](https://usgraphics.com/static/products/TX-02/datasheet/TX-02-datasheet.a43c0c7f8d8c.pdf), but we have not run the same checks on its commercial files.

There is consequently no language-count contest here. If your work includes a particular script or terminal layout, verify those characters in the edition you plan to use. A fallback font can hide missing coverage while changing the appearance of a line.

## Which font should you choose?

Choose Berkeley Mono if its industrial letterforms appeal to you, especially if you want condensed widths or configurable slant. Its compiler also makes it a credible choice for editors with limited feature controls. Check which modules include the range you need.

Consider MonoLisa if you prefer its rounder forms and italic styles, want grade adjustment without changing character widths, or need a proportional companion through MonoLisa Text. If Berkeley already feels right in your editor, the presence of another feature list is not a reason to replace it.

## Try them in your editor

Start with the [MonoLisa free trial](https://www.monolisa.dev/buy/trial). It includes Regular and Bold with a limited character set; coding ligatures, OpenType features, and grade adjustment are omitted. Explore those in the [online tester](https://www.monolisa.dev/tester).

Berkeley also offers a [trial](https://usgraphics.com/catalog/FX-050). Its restrictions matter for evaluation: slash and backslash are swapped, as are asterisk and number sign, and the vendor warns against using it for critical code. Treat those substitutions as trial limitations, not as the commercial font's design.

If either font suits you, visit the [MonoLisa checkout](https://www.monolisa.dev/buy/) or [Berkeley purchase options](https://usgraphics.com/products/berkeley-mono#section-purchase) for current pricing and license choices. Berkeley distinguishes personal/developer use from commercial use.

## Measurement notes

This comparison combines our existing MonoLisa measurements with Berkeley's public documentation, checked September 22, 2026. Berkeley specifications are based on the 2.000 datasheet, current catalog, and release notes through 2.004. The intervening releases include rendering and ligature fixes, a hyphen addition, and a slant-interpolation fix; the vendor specimen itself is not verified as a 2.004 rendering.

We did not render with the Berkeley trial, inspect the full commercial font, or measure its language coverage, vertical metrics, glyph counts, or shaping. The attributed vector excerpt comes from a public vendor specimen, used to discuss its visible letterforms in code. It is not a matched-size specimen or a test of editor rendering.

The MonoLisa code sample repeats three complete lines from the vendor’s Generic specimen. It uses the local Code upright font, HarfBuzz `hb-view`, weight 400, size 64, and a 76-unit line step in a 798 × 260 SVG. These are our display settings, not inferred Berkeley settings. The comparison retains only the three discussed lines from the vendor SVG, with backgrounds removed and both fonts using the same theme-aware syntax colors for keywords, strings, numbers, and punctuation. The panels are side by side on desktop and stacked on mobile. Regenerate the comparison SVGs with `node scripts/render-berkeley-comparison.mjs <path-to-MonoLisa-Code-upright-font>`. MonoLisa coverage comes from the series data in `01_ideas/comparison_language_coverage.json` and `01_ideas/comparison_typeface_data.csv`.

The detail graphic isolates `r`, `e`, and square brackets from the already attributed Generic excerpt. Positions and display scale are adjusted to inspect each shape; outlines are unchanged. The selected paths are stored in `scripts/berkeley-public-glyph-excerpts.json`.

The width graphic retains the Normal and Condensed rows from the public width specimen, with the same uniform scale for both. It is not a simulated horizontal compression. Source outlines and metadata are in `scripts/berkeley-public-width-excerpts.json`.

The style graphic uses a four-word excerpt from the labeled Regular and Oblique specimens in the 2.000 datasheet. MonoLisa uses its actual upright and italic files at weight 400. Regenerate the additional graphics with `node scripts/render-berkeley-details.mjs`; the extracted Berkeley outlines and source metadata are stored in `scripts/berkeley-public-style-excerpts.json`.

{/* Editorial review: Marcus to review design observations; Juho to add personal experience. Keep the distinction between vendor documentation and local measurements when editing. */}
