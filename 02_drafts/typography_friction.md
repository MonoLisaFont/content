---
title: "Typography friction in development"
published: 2026-04-01
updated: 2026-04-01
keywords: ["productivity"]
authors: ["Juho Vepsäläinen"]
---

Typography sits at the crossroads of [visual](../visual_friction) and [cognitive friction](../cognitive_friction). It shapes how quickly developers recognize characters, scan structure, and stay comfortable while reading code.

This post focuses on typography from a developer's point of view: typeface choice, glyph clarity, spacing, ligatures, and the tradeoff between compactness and legibility.

## Why is typography important for developers

Typography matters because software development is full of text. Code, terminals, logs, documentation, comments, stack traces, pull requests, and issue trackers all rely on characters being easy to recognize and comfortable to read.

For developers, typography is not only about taste. A programming typeface has to handle dense symbols, similar-looking glyphs, punctuation, mixed case, indentation, and long reading sessions. Small design decisions become practical because developers see them all day.

## What to look at in typefaces

Many developers use whatever font ships with the editor. That is understandable, but it is worth knowing what to evaluate when trying alternatives.

For code, the usual starting point is a monospaced typeface because each character occupies the same horizontal width. This supports indentation, alignment, tabular output, and fast scanning. Beyond that, there are several features to inspect:

1. Character differentiation: compare `1`, `l`, and `I`; `0` and `O`; quotes; commas; periods; colons; braces; brackets; and operators. If these blur together, the font is adding work.
2. Line height and spacing: line height is usually adjustable in the editor, but the underlying design still matters. A cramped typeface can feel efficient at first and tiring later.
3. Width: compact fonts fit more code horizontally, but they often reduce internal space inside wide characters such as `m` and `w`. Wider fonts use more space, but can be calmer to read.
4. Ligatures: many developer typefaces include optional ligatures. They can improve recognition for operators, but they can also hide literal character sequences. Try them rather than assuming they are always better or worse.
5. Feature control: good code fonts should let you choose alternates, disable features, and tune behavior across environments. In [MonoLisa](https://monolisa.dev), for example, ligature behavior can remain subtle by default while stronger replacements stay optional.

## Practical advice

Choosing a typeface is partly personal, but the experiment should be concrete:

1. Pick several typefaces with different characteristics and render the same real code snippet in each.
2. Include dense code, tests, logs, terminal output, and diffs in the comparison.
3. Try one typeface for at least a day before judging it. First impressions can be misleading.
4. Adjust line height, font size, and ligatures separately so you know what changed.
5. Treat typeface choice as part of ergonomics. Free fonts can be excellent, and paid fonts can be worth evaluating when they solve a problem you feel every day. Although the cost may feel substantial initially, consider it as a long-term investment in your wellbeing.

## Conclusion

Typography is a small configuration detail with a large surface area. You see it in every line of code, every terminal command, and every review. That makes it worth tuning deliberately.

As there are more sources to friction in development, [refer back to the anchor post of the series to learn more about the topic](../friction_in_software_development).
