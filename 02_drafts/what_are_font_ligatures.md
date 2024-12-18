---
title: "What are font ligatures?"
published: 2024-10-18
updated: 2024-10-25
keywords: ["typefaces"]
authors: ["Marcus Sterz", "Juho Vepsäläinen"]
---

You might have heard of font ligatures, but what are they and why you should consider enabling them if the font you are using supports them?

## What are font ligatures?

Simply put, a ligature is a combination of two or more glyphs. They form a new glyph which replaces the glyphs they are representing.

### Letter combinations

Common ligatures are `fi` and `ft` in text fonts. Other examples are the well known ampersand `&`, the european nordic letters `Æ`,`Œ` and the German letter `ß`. There are no limits to create new ligatures out of letters in the design process. The example below shows how ligatures are applied.

![Common ligatures (typeface: MonoLisa)] (/images/MonoLisa Blogposts Vorlagen Ligs01.png)

### Coding ligatures

Beyond common combinations, ligatures are used specifically in coding fonts to improve legibility. The main point is that they can make certain combinations, such as `!=`, look visually more elegant. A common trend is to copy symbols from mathemathics and use those as replacements for combinations. Typical combinations include punctuation signs, ampersands, and brackets. From font authoring point of view, the challenge is in keeping the combinations within a fixed width required by a monospaced font. The example below shows what code looks with and without ligatured applied.

![Coding ligatures (typeface: MonoLisa)](/images/MonoLisa Blogposts Vorlagen Ligs02.png)

For some coders, ligatures are a controversial feature. Fortunately the feature is entirely optional and many coding fonts offer it as a convenience feature.

## How to enable ligatures?

TODO: Describe how to enable `liga` in common editors and graphics programs (also limitations + freezing should be mentioned here).

## Space altering ligatures

TODO: Describe `calt` and how it's commonly used

## Conclusion

Ligatures, and coding ligatures in specific, are a font extension that allow you to tune the way it looks by combining glyph combinations into a single one. JV: I'll extend this a bit.
