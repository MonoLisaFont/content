---
title: "What are font ligatures?"
published: 2024-10-18
updated: 2024-10-25
keywords: ["typefaces"]
authors: ["Marcus Sterz", "Juho Vepsäläinen"]
---

A ligature is a combination of two or more glyphs. They form a new glyph which replaces the glyphs they are representing.

{/*
JV:

You might have heard of font ligatures, but what are they and why you should consider enabling them if the font you are using supports them?
*/}

{/*
## What are font ligatures?

JV: Proposed new section - likely needs a basic explanation of ligatures before anything else. Also next section could be folded to this.

Simply put, a ligature is a combination of two or more glyphs. They form a new glyph which replaces the glyphs they are representing.
*/}

### Letter combinations

Common ligatures are `fi` and `ft` in text fonts. Other examples are the well known ampersand `&`, the european nordic letters `Æ`,`Œ` and the German letter `ß`. There are no limits to create new ligatures out of letters in the design process.

![Common ligatures (typeface: MonoLisa)](/images/MonoLisaBlogpostsVorlagen01.png)

### Coding ligatures

A popular trend are coding ligatures. While some do not appreciate them, they can make a code look more fluent and point out certain commands visually more elegant. Usually they are a combinations of mostly punctuation signs, ampersands, brackets and the like. To create these ligatures Python scripting is necessary, since the ligatures need to keep the fixed width whilst displaying several symbols in a row.

![Coding ligatures (typeface: MonoLisa)](/images/MonoLisaBlogpostsVorlagen02.png)

{/*
JV: I would expand a bit like this.

Beyond common combinations, ligatures are used specifically in coding fonts to improve legibility. The main point is that they can make certain combinations, such as `!=`, look visually more elegant. A common trend is to copy symbols from mathemathics and use those as replacements for combinations. Typical combinations include punctuation signs, ampersands, and brackets. From font authoring point of view, the challenge is in keeping the combinations within a fixed width required by a monospaced font. The example below shows what code looks with and without ligatured applied.

![Coding ligatures (typeface: MonoLisa)](/images/MonoLisaBlogpostsVorlagen02.png)

For some coders, ligatures are a controversial feature. Fortunately the feature is entirely optional and many coding fonts offer it as a convenience feature.
*/}

{/*
## How to enable ligatures?

TODO: Describe how to enable `liga` in common editors and graphics programs (also limitations + freezing should be mentioned here).
*/}

{/*
## Space altering ligatures

TODO: Describe `calt` and how it's commonly used

Originally the `calt` feature is meant to support contextual changes like alternates in a ‘handwritten’ font so the reader does not recognizes the fake handwriting. The feaure basically looks for neighbouring glyphs and provides a contextual change if intended. THis feature can be turnd on and off.
*/}

## Conclusion

Coding ligatures are a fun and elegant way to visually structure your code. See what the ligatures look like in MonoLisa: [more information can be found at MonoLisa website](https://monolisa.dev).

{/*
JV: I would drop the CTA and keep this simple while capturing the key point.

Ligatures, and coding ligatures in specific, are a font extension that allow you to tune the way it looks by combining glyph combinations into a single one. JV: I'll extend this a bit.
*/}
