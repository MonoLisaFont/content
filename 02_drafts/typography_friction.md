---
title: "Typography for developer friction"
published: 2026-04-01
updated: 2026-04-01
keywords: ["productivity"]
authors: ["Juho Vepsäläinen"]
---

Typography sits at the crossroads of [visual](../visual_friction) and [cognitive friction](../cognitive_friction) we covered separately. In this post, I examine why the choice of a typeface and its features can make a different for developer flow.

## Why is typography important for developers

Typography is important in sense that it is everywhere you have text. In other words, somebody had to consider how to put the content to glyphs that can be then reproduced and this process of figuring out how to do this effectively has been going on since writing was invented. It was only with the invention of the printing press that it became more formalized and scaled to masses. Digital media comes with its own typography related opportunities and challenges and that's going to be our scope in this post as we look at typography especially from a developer point of view.

## What to look at in typefaces

As a developer, usually you just use whatever font that comes with your editor without thinking too much about. Therefore it's good to know what to look at if you are considering trying other options. Typically you would look at so-called monospaced typefaces especially for code since those guarantee the same width for each glyph making it faster to scan code so apply that knowledge when looking for options. Furthermore, there are several aspects of a typeface you should be aware of when evaluating options:

1. Consider character differentiation. I.e., look at letters such as 1, l, and I, or 0 and O. Sometimes you can see that it's not easy to tell the letters apart and that can be considered a font design issue.
2. Consider line height and letter spacing. You can adjust especially line height in your editor. Letter spacing can be challenging in monospaced typefaces since it's typically fixed. To give more space for design, we went with slightly wider letters in [MonoLisa](https://monolisa.dev) for example. The tradeoff is that it takes slightly more horizontal space than others, but you win in terms of clarity especially for wider letters, such as m. These wide letters simply feel less cramped when you have more space available.
3. Consider ligatures. Often typefaces aimed for developers include optional ligatures. You can try using them to see if the feature is to your liking. In MonoLisa we split up ligatures so that by default they perform only space altering tweaks making the effect subtle. You can still get full character combination replacements if you want but that's optional.
4. Consider compactness vs. legibility. As mentioned, more compact fonts have to make tradeoffs in terms of legibility while winning in horizontal space. Test different widths to find a typeface that makes the most sense for you.

## Practical advice

Choosing your typeface is often a personal decision, or a given one if you just use what is given. That said, it's worth experimenting with typefaces and I've listed several things to try below:

1. Find several typefaces with different characteristics and use them to render a simple code snippet while taking screenshots. Evaluate the screenshots together to see if you can spot concrete differences.
2. Try one typeface at a time, for example a day, to see if you notice any differences or preferences. Also try adjusting features such as line height or enabling ligatures for a while to explore the typefaces.
3. Consider typeface as an investment towards better ergonomics. There are many free ones, but also the paid ones are worth evaluating since they tend to have their own unique features and design.

## Conclusion

Choosing your typeface well can make a difference in your daily development and it's one of those areas where it's easy to experiment. It's worth putting some time into exploring the options beyond the defaults.

As there are more sources to friction in development, [refer back to the anchor post of the series to learn more about the topic](../friction_in_software_development).
