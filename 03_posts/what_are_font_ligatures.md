---
title: "What are font ligatures?"
published: 2025-04-22
keywords: ["typefaces"]
authors: ["Marcus Sterz", "Juho Vepsäläinen"]
---

Font ligatures are a type feature where two or more glyphs are joined together. The resulting glyph, the ligature, replaces the matched glyphs. In this post, we will explore this type feature and explain its pros and cons while showing how to enable the feature. Some developers find ligatures useful in their workflow as they can improve the legibility of their code, so it is worth it to understand what the feature is about.

## When are ligatures used?

If you look closely, you might notice that many fonts do something special with combinations of `fi` and `ft`. You might notice how letters are subtly joined together. Historically speaking, early typesetters would model the replacement letter as a single block for their printing machine, as mentioned by [I love typography](https://ilovetypography.com/2007/09/09/decline-and-fall-of-the-ligature/). Another interesting tidbit is that ampersand (`&`) started as the combination of `E` and `t` and was a ligature before being formalized as an official letter. Similar examples can be found from Nordic letters of `Æ`,`Œ`, and the German letter `ß`, which started as ligatures to improve legibility. The example below showcases several common ligatures from the MonoLisa typeface.

![Common ligatures (typeface: MonoLisa)](/images/MonoLisaBlogpostsVorlagen01.png)

## How are ligatures visible in the OpenType font specification?

If you look at the OpenType font specification carefully, you can notice it contains [liga](https://www.preusstype.com/techdata/otf_liga.php) and [dlig](https://www.preusstype.com/techdata/otf_dlig.php) features. Both groups are meant for ligatures, and `liga` contains combinations that should be used in normal conditions, while `dlig` has been reserved for discretionary usage, and it is up to the user’s preference per the definition.

MonoLisa typeface includes both, and the idea is that `liga` contains more radical replacements while `dlig` has been reserved for spacing-related tweaks, making it more subtle. It is possible that typefaces interpret the rules for your convenience like this, and it is a good idea to check what OpenType features they offer and how if you want to get the most out of the typefaces you use.

## What are coding ligatures?

Now that you understand what ligatures are and why they are used, it is good to consider how they can be used for programming. Several coding fonts contain these combinations as ligatures to improve the legibility of common ones, including `!=`. In other words, after replacement, the combination would stand out on its own, and often, you end up with a more mathematical look for your code that some programmers prefer. Given it is not a look all programmers like, it is possible to toggle the feature using `liga` and `dlig` OpenType flags, and even if a typeface contains ligatures, they aren’t enabled by default. Consider the figure below to get a better idea of what kind of coding ligatures are possible.

![Coding ligatures (typeface: MonoLisa)](/images/MonoLisaBlogpostsVorlagen02.png)

From the type designer’s point of view, providing ligatures for a coding font comes with some challenges. There is limited space to use since coding fonts are monospaced by definition and, therefore, take a fixed width. The key issue is to get the spacing and proportion right so that the resulting glyphs fit their context well.

## Conclusion

Ligatures are a type feature that many typefaces contain to improve the legibility of certain letter combinations. Coding fonts provide ligatures specific to the task. In coding fonts, ligatures are an optional feature you can enable if you prefer the more math kind of look.
