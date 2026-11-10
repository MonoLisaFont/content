---
title: "MonoLisa 3.001: Georgian support and refinements"
published: 2026-11-10
updated: 2026-11-10
keywords: ["release", "MonoLisa", "Georgian"]
authors: ["Andrey Okonetchnikov", "Marcus Sterz", "Juho Vepsäläinen"]
---

The first update to [MonoLisa version 3](/posts/monolisa_v3) brings Georgian support to both MonoLisa Code and MonoLisa Text. Version 3.001 also adds a dotted zero to tabular figures in MonoLisa Text and makes a series of refinements across the two families. Alongside the font update, we've improved the web font download page so you can preview your choices before downloading.

## Georgian joins MonoLisa

MonoLisa Code and MonoLisa Text now support the Georgian script and language. This extends the scripts available in both the monospaced family for code and its proportional companion for text.

![MonoLisa type specimens in Latin, Cyrillic, Greek, Armenian, Hebrew, and the newly added Georgian script](/images/monolisa-georgian-3-001.png)

## Preview your web font before downloading

The web font download page now shows a live preview as you choose character ranges and OpenType features. You can start with a preset or fine-tune individual Unicode ranges, then see how your selection affects the sample and the available glyphs.

![MonoLisa Text web font customizer with the Latin preset selected, a live text preview, Unicode range controls, and a download-size summary](/images/monolisa-webfont-customize-3-001.jpeg)

_MonoLisa Text with the Latin preset selected. The download size shown is specific to this selection._

The page also shows the exact size of the resulting font files, including a per-file breakdown, so you can balance language coverage and features against download size before adding the font to a website. A usage example provides CSS for the selected features. You can find the web font download through [My orders](/orders).

## A dotted zero for tabular figures

MonoLisa Text now includes a dotted zero (`zero.tf.ss15`) for tabular figures. Tabular figures use equal widths for numbers, which helps keep columns aligned in contexts such as tables. The dot provides another way to distinguish zero from the letter O.

## Fixes and refinements

The update also includes smaller adjustments to ligatures and individual glyphs:

- **MonoLisa Code:** The discretionary ligature (`dlig`) lists are synchronized between upright and italic. The Hebrew letter Vav (`vav-hb`) has been adjusted in all three masters.
- **MonoLisa Text:** The letter `đ` (`dcroat`) and the Vietnamese dong sign `₫` (`dong`) have been corrected in all three upright masters.
- **Both families:** The Turkish lira sign `₺` (`liraTurkish`) has been optimized across MonoLisa Code and Text, and the tenge sign `₸` (`tenge`) has been optimized in all masters across both families.

These changes continue the work we started with version 3: extending where MonoLisa can be used while refining the details of the typeface. Existing customers can download the latest version from [My orders](/orders). If you haven't tried the new families yet, you can [try MonoLisa](/buy/trial/).
