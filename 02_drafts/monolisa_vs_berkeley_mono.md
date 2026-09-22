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
| **Saved customization** | Customizer | Standard compiler; Supertype adds controls |
| **Terminal symbols** | Powerline, box drawing, block elements measured | Documented by vendor; not measured here |
| **Language coverage** | Latin, Cyrillic, Greek, Hebrew, Armenian measured | See vendor's character coverage; no comparable local measurement |
| **Proportional counterpart** | MonoLisa Text, separately or in a bundle | Berkeley Mono is monospaced |
| **Availability** | Paid; limited free trial | Paid; restricted evaluation trial |
| **Source** | [MonoLisa](https://www.monolisa.dev/) | [U.S. Graphics](https://usgraphics.com/products/berkeley-mono) |

![Summary infographic comparing MonoLisa Code and Berkeley Mono](/images/comparison-monolisa-vs-berkeley-mono-summary.svg)

## Letterforms before feature lists

Berkeley's public zero specimen is a useful place to start. The outer contour has relatively straight sides and flattened curves at the top and bottom. Its central mark repeats that rounded rectangular shape. These details help explain the industrial impression even without a whole page of code.

![Cropped screenshot of the dotted zero in U.S. Graphics' public Berkeley Mono specimen](/images/comparison-monolisa-vs-berkeley-mono-vendor-zero.png)

*Source: U.S. Graphics Company, [Berkeley Mono's zero specimen](https://usgraphics.com/products/berkeley-mono#section-tribute). Screenshot excerpt captured September 22, 2026; specimen artwork © U.S. Graphics. The vendor's rendering settings and specimen version are not stated.*

MonoLisa's locally rendered sample below gives you a separate reference for its rounder zero and O, along with characters worth checking in identifiers. The images have different scales and rendering conditions: use them to inspect shape, not to judge relative width, darkness, or small-size sharpness.

![MonoLisa Code zero, O, o, one, l, I, vertical bar, rn, m, a, and g, rendered locally](/images/comparison-monolisa-vs-berkeley-mono-monolisa-glyphs.svg)

For the overall reading texture, explore Berkeley's [code specimens](https://usgraphics.com/products/berkeley-mono#section-code) and the [MonoLisa tester](https://www.monolisa.dev/tester). A large glyph can reveal construction; your editor shows whether you enjoy reading it for hours.

## Width, slant, and italics

Berkeley has a practical attraction if you want to adjust how much code fits in a pane. Its [Master Fonts module](https://usgraphics.com/catalog/FX-202) provides five widths, from UltraCondensed to Normal, across ten weights and upright/oblique styles. Retina and Book require the Supertype compiler. Variable fonts are a separate module, and their available range depends on the masters purchased.

MonoLisa's variable controls serve a different purpose. Weight changes the weight; grade adjusts stroke thickness while preserving character widths. There is no width or slant axis in the measured MonoLisa files. If you want a condensed version, grade will not provide one.

For sloped syntax, MonoLisa offers italic styles. Berkeley calls its styles Oblique: its [2.000 release notes](https://usgraphics.com/products/berkeley-mono/releases) explicitly record the rename from Italics and the introduction of the slant axis. That is a useful distinction to try visually, not a reason to declare one approach better. Compare how much contrast you want between comments and upright code.

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

This comparison combines our existing MonoLisa measurements with Berkeley's public documentation, checked September 22, 2026. Berkeley specifications are based on the 2.000 datasheet, current catalog, and release notes through 2.004. The intervening releases include rendering and ligature fixes, a hyphen addition, and a slant-interpolation fix; the screenshot itself is not verified as a 2.004 rendering.

We did not render with the Berkeley trial, inspect the full commercial font, or measure its language coverage, vertical metrics, glyph counts, or shaping. The attributed screenshot is an excerpt of a public vendor specimen, used to discuss its visible letterform. It is not a matched-size specimen or a test of editor rendering.

The MonoLisa glyph sample uses the local Code upright font, HarfBuzz `hb-view`, and weight 400. The summary graphic uses MonoLisa for all labels, including the Berkeley name; it is a feature summary, not a specimen of Berkeley. Regenerate both SVGs with `node scripts/render-berkeley-comparison.mjs <path-to-MonoLisa-Code-upright-font>`. MonoLisa coverage comes from the series data in `01_ideas/comparison_language_coverage.json` and `01_ideas/comparison_typeface_data.csv`.

{/* Editorial review: Marcus to review design observations; Juho to add personal experience. Keep the distinction between vendor documentation and local measurements when editing. */}
