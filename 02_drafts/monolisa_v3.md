---
title: "MonoLisa version 3 – now with MonoLisa Text family"
published: 2026-04-01
updated: 2026-04-01
keywords: ["release"]
authors: ["Andrey Okonetchnikov", "Marcus Sterz", "Juho Vepsäläinen"]
---

MonoLisa is a typeface that has been in development since 2020. Over five thousand software developers and companies have adopted it since as their font of choice. Now with version 3, the family expands yet again and in this post we show you how the font has evolved now to cover design tasks as well. It is quite rare that a typeface receives continuous care and effort from its creators but here we are still at it six years later. Without you, the community who gave us so much valuable feedback, MonoLisa wouldn’t be where it is now.

## Versions 1 and 2

The first version published in 2020 included a monospaced version aimed specifically at developers. The key point of version one was to offer a razor sharp monospaced font with clear focus on distinction and legibility.

The second major version released on 2022 went a notch further by enabling variable weight. In other words, it became possible to make the font as thick or thin as you like since sometimes that's all you need to squeeze out that last bit of legibility. The introduction of variability also made the font useful for web related tasks as by shipping a variable version to your client, you can access all its weights without having to deliver multiple files.

The second version also included a customization tool that lets you *freeze* font features since many editors and other applications available today have limited options on how to access your font features. Freezing solved this problem as it literally froze font features, such as specific characters, directly to the font itself thereby working around limitations of software.

## Version 3 – the family grows with **MonoLisa Text**

Now with version 3, the family grows with a new member besides *MonoLisa Code*, the original typeface. The new font family called *MonoLisa Text* covers the other half of common usage where a monospaced typeface reaches its limits. In other words, MonoLisa Text is a *proportional* family designed for use cases where you might have regular text and therefore completes the family while working as a complementary pair to the original version. This makes it ideal for use cases such as prose, user interfaces, presentations and any sort of printed items like books, magazines and the like.

The introduction of MonoLisa Text makes the type family useful beyond programming as now it covers a wide range of *design* tasks making it a handy tool for designers to wield in their arsenal. Besides this major addition, we have made series of smaller changes that expand the usefulness of the original font family MonoLisa Code.

### New, more adjustable ligature behavior

Ligatures are a typeface feature that allows replacements of multiple characters, such as `===`, into a single one. Some people greatly prefer this behavior while others find it distracting. Therefore it is always an optional feature in typefaces.

If you use an editor like VS Code, then the typical way to enable ligatures in your editor is to set `"editor.fontLigatures": true`. This is the equivalent to setting `"editor.fontLigatures": "'liga', 'calt'"` so in other words it is enabling **two** sets of features, ligatures and so-called contextual alternates. The `liga` set typically contains replacements like `fi` or `fl` to improve character flow in a subtle manner while `calt` goes further and typically in programming fonts it is that set that contains combinations like `===` or `>=`.

The problem is that typically ligatures are "all or nothing" kind of deal meaning even if you liked some of the replacements, you will also get ones that you don't like, meaning enabling the whole set is not useful to you. To address this issue, we decided to go against the norm in version 3 and changed the behavior so that `liga` and `calt` do only slight space altering adjustments that you barely notice while moving specific groups of ligatures behind character variants known as `cv`s in OpenType specification. This goes well with MonoLisa since it is a combination of a typeface and a service that allows you to customize the font to your liking. If you are using an editor other than VS Code or some other that lets you adjust font behavior at a great detail, you can still freeze the specific ligature groups you prefer to your static font files.

### More distinct characters are now available

Since legibility is one of our key concerns when designing MonoLisa, version 3 was a great point to revisit some of the characters to make them more distinct. These changes are particularly useful for dyslexic users while benefitting others as well as tends to be the case with accessibility improvements. In specific, letters a, b, d, e, p, q, and similar across all languages and scripts have been adjusted as shown by the visual comparison below:

*TODO: Include a visual comparison here*

In addition, selected letters in the light master have been widened:

*TODO: Include a visual comparison here*

Vertical metrics have been adjusted to allow easier usage in a UI context:

*TODO: Include a visual example here before and after*

Script variant letter shapes have been revised and optimized further:

*TODO: Include a visual example here before and after*

### Other changes

*TODO: Link to the official change log from here. One option would be to push this information there potentially.*

Besides these bigger changes, there have been other smaller changes we have listed below:

* We reorganized and cleaned up stylistic sets so the order makes sense again.
* Figure `7` (seven) with a middle stroke was introduced as `ss14`.
* Plain `0` (zero with no center element) was introduced as `ss15`. In MonoLisa Text the plain zero is the default and the dotted version is the variant.
* The support for historical Greek was extended and the support for Armenian, Hebrew, and Braille has been added.

## New website

As we worked with the additions to the typeface, we realized it's not enough to only update only the font, but the website has to be made to fit it and showcase the new features well. Compared to the earlier one, you will likely notice that sections, such as the landing page or specimen, have received major updates. We also had to make sure the customization tool works with the new additions.

## Availability of version 3 with MonoLisa Text

*TODO: Describe new packages here and the route to them from older plans*

## Conclusion

With version 3 the MonoLisa project enters a new era as the family not only got better but also bigger.
 *TODO: The CTA here is to pitch people to trial if they haven't tried the font before or to update as described above*
