---
title: "Visual friction in development"
published: 2026-04-01
updated: 2026-04-01
keywords: ["productivity", "code readability"]
authors: ["Juho Vepsäläinen"]
---

You encounter visual friction when something is technically visible but difficult to parse at a glance. For developers, this matters because a large part of the job is reading: code, diffs, logs, terminals, documentation, error messages, and pull requests. Visual friction does not have to make code impossible to understand. It only has to slow recognition slightly. Across thousands of small reads per day, that cost becomes real.

## What is visual friction

A big part of development work is recognizing patterns. We split code into functions, modules, and files partly because doing so gives the reader structure. The same is true visually: indentation, spacing, syntax color, line length, and typeface choices all affect how quickly the structure appears.

It is useful to separate [cognitive friction](../cognitive_friction) from visual friction. Cognitive friction is about understanding meaning. Visual friction is about seeing structure. They interact, but they are not the same problem.

You already use techniques to manage visual friction: syntax highlighting, indentation guides, monospaced fonts, diff colors, warnings, icons, spacing, and formatting tools. Good interfaces use these cues to help the important parts stand out.

Not all friction is bad. Interfaces sometimes add friction intentionally before destructive actions because slowing the user down is the point. But in normal reading and navigation, unnecessary visual friction makes development feel heavier than it needs to.

## Examples of visual friction

To give you a better idea of what visual friction really is, consider the examples below:

- Glyph ambiguity matters. Common checks include `0` versus `O`, `1` versus `l` versus `I`, and punctuation such as quotes, commas, periods, and colons. If characters are hard to distinguish, the reader has to spend attention on decoding rather than understanding.
- Syntax highlighting can make structure faster to detect, but color is not automatically helpful. Too many strong colors create noise. Too little contrast hides useful distinctions. Hillel Wayne has a good critique of how syntax highlighting often wastes its information budget in ["Syntax highlighting is a waste of an information channel"](https://buttondown.com/hillelwayne/archive/syntax-highlighting-is-a-waste-of-an-information/).
- Theme choice matters because developers stare at the theme for hours. Dark and light themes can both work well if contrast, saturation, and ambient lighting are handled carefully. I have found [Catppuccin](https://catppuccin.com/) pleasant because it is not too loud and can be tuned across tools.
- Lighting affects visual comfort. A glossy display in direct light, a bright monitor in a dark room, or a theme that fights the surrounding environment can all increase strain. Features such as [Night Shift](https://support.apple.com/en-us/102191) can help some people, but monitor brightness, room lighting, breaks, and daylight exposure matter too. Research increasingly suggests [the problem isn't blue light alone but the exposure to the light at an appropriate time of the day](https://www.bbc.com/future/article/20260407-the-blue-light-from-your-phone-isnt-ruining-your-sleep).
- Line length, spacing, and indentation matter. My preference for code is roughly 80 to 110 characters. Longer lines become tiring to scan, while very short lines can create excessive wrapping. For formatting, tools like [Prettier](https://prettier.io/) reduce debate and keep code visually consistent across contributors.

## How to reduce visual friction

The simplest improvements are often configuration changes: formatter defaults, theme tuning, line length, font size, line height, and typeface. Defaults are not always bad, but they are rarely chosen for your eyes, your display, your lighting, and your work.

Typeface choice deserves special attention because it affects every line of code you read. In general, it is a good idea to test different available options since a typeface that looks nice in a specimen may behave differently in dense code, terminal output, or diffs. [MonoLisa](https://monolisa.dev) was designed for code legibility in particular and may be an option worth benchmarking.

Beyond these, there are a few more actions you could consider:

1. Set a visible line-length guide around the range that works for your team. Around 100 characters is a practical starting point for many codebases.
2. Tune your theme so important structure stands out and comments, generated code, and secondary information recede.
3. Use a formatter consistently. Formatting arguments are rarely worth spending review attention on.
4. Check visual consistency across editor, terminal, browser, documentation, and pull request tools. Switching between very different visual environments creates its own friction.
5. Test code fonts with the files you actually edit, including dense code, tests, logs, and diffs.

## Visual tradeoffs

It is one thing to optimize visuals for yourself and another to optimize them for a team. Formatting rules, generated-code markers, review settings, and documentation layout are good team-level decisions because consistency helps everyone. Font, theme, and ligature choices can usually remain personal unless the team is producing shared screenshots, demos, or documentation.

Some font features come with tradeoffs. Ligatures can improve pattern recognition for operators, but they can also hide the literal characters being typed. A good compromise is to start with subtle spacing improvements and only enable stronger substitutions if they genuinely help you read. Good developer typefaces expose these choices instead of forcing one style on everyone.

## Conclusion

Visual friction is easy to underestimate because developers adapt to bad defaults. That adaptation has a cost. Small improvements to rendering, spacing, contrast, and type can make code easier to scan all day.

If you want to investigate other sources of friction, [refer back to the anchor post for more ideas](../friction_in_software_development). The closest related article is [typography friction](../typography_friction), which looks more closely at typeface choices for developers.
