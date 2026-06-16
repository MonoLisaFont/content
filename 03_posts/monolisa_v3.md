---
title: "MonoLisa version 3 – now with MonoLisa Text family"
published: 2026-06-16
updated: 2026-06-16
keywords: ["release"]
authors: ["Andrey Okonetchnikov", "Marcus Sterz", "Juho Vepsäläinen"]
---

MonoLisa is a typeface that has been in development since 2020. Over five thousand software developers and companies have adopted it since as their font of choice. Now with version 3, the family expands yet again and in this post we show you how the font has evolved now to cover design tasks as well. It is quite rare that a typeface receives continuous care and effort from its creators but here we are still at it six years later. Without you, the community who gave us so much valuable feedback, MonoLisa wouldn’t be where it is now.

> TLDR; [Read the migration guide if you are coming from version 2 and just want to see the changes](/releases/3.000).

## Versions 1 and 2

The first version published in 2020 included a monospaced version aimed specifically at developers. The key point of version 1 was to offer a razor sharp monospaced font with clear focus on distinction and legibility.

The second major version released on 2022 went a notch further by enabling variable weight. In other words, it became possible to make the font as thick or thin as you like since sometimes that's all you need to squeeze out that last bit of legibility. The introduction of variability also made the font useful for web related tasks as by shipping a variable version to your client, you can access all its weights without having to deliver multiple files.

The second version also included a customization tool that lets you _freeze_ font features since many editors and other applications available today have limited options on how to access your font features. Freezing solved this problem as it literally froze font features, such as specific characters, directly to the font itself thereby working around limitations of software.

## Version 3 – the family grows with **MonoLisa Text**

Now with version 3, the family grows with a new member besides _MonoLisa Code_, the original typeface. The new font family called _MonoLisa Text_ covers the other half of common usage where a monospaced typeface reaches its limits. In other words, MonoLisa Text is a _proportional_ family designed for use cases where you might have regular text and therefore completes the family while working as a complementary pair to the original version. This makes it ideal for use cases such as prose, user interfaces, presentations and any sort of printed items like books, magazines and the like.

The introduction of MonoLisa Text makes the type family useful beyond programming as now it covers a wide range of _design_ tasks making it a handy tool for designers to wield in their arsenal. Besides this major addition, we have made series of smaller changes that expand the usefulness of the original font family MonoLisa Code.

<img src="https://raw.githubusercontent.com/MonoLisaFont/content/main/images/mono-proportional.svg" title="MonoLisa Code vs. MonoLisa Text" width="100%" />

## New, more adjustable ligature behavior

Ligatures are a typography feature that allows replacements of multiple characters, such as `===`, into a single one. Some people greatly prefer this behavior while others find it distracting. Therefore, it is always an optional feature in typefaces.

If you use an editor like VS Code, then the typical way to enable ligatures in your editor is to set `"editor.fontLigatures": true`. This is the equivalent to setting `"editor.fontLigatures": "'liga', 'calt'"` so in other words it is enabling **two** sets of features, ligatures and so-called contextual alternates. The `liga` set typically contains replacements like `fi` or `fl` to improve character flow in a subtle manner while `calt` goes further and typically in programming fonts it is that set that contains combinations like `===` or `\>\=` (`>=`).

The problem is that typically ligatures are "all or nothing" kind of deal meaning even if you liked some of the replacements, you will also get ones that you don't like, meaning enabling the whole set is not useful to you. To address this issue, we decided to go against the norm in version 3 and changed the behavior so that `liga` and `calt` do only slight space altering adjustments that you barely notice while moving specific groups of ligatures behind character variants known as `cv`s in OpenType specification. This goes well with MonoLisa since it is a combination of a typeface and a service that allows you to customize the font to your liking. If you are using an editor other than VS Code or some other that lets you adjust font behavior at a great detail, you can still freeze the specific ligature groups you prefer to your static font files.

## More distinct characters are now available

Since legibility is one of our key concerns when designing MonoLisa, version 3 was a great point to revisit some of the characters to make them more distinct. These changes are particularly useful for dyslexic users while benefitting others as well as tends to be the case with accessibility improvements. In specific, letters a, b, d, e, p, q, and similar across all languages and scripts have been adjusted as shown by the visual comparison below:

<img src="https://raw.githubusercontent.com/MonoLisaFont/content/main/images/lettershapes-v3.svg" title="Letter improvements in version 3" width="100%" />

In addition, selected letters in the light master have been widened:

<img src="https://raw.githubusercontent.com/MonoLisaFont/content/main/images/comparison-wider-letters.svg" title="Wider letters in version 3" width="100%" />

Vertical metrics have been adjusted to allow easier usage in a UI context:

<img src="https://raw.githubusercontent.com/MonoLisaFont/content/main/images/vertical-metrics.svg" title="Vertical metrics in version 3" width="300" />

## Grade axis – Adjust glyph weight without changing line breaks

Version 3 includes a new axis called **grade** (`GRAD` in OpenType). Essentially it allows you to subtly nudge lightness/darkness of a font. The feature is particularly useful if you work with MonoLisa Text and want to tune weight without changing your line breaks as described by [web.dev](https://web.dev/articles/variable-fonts#using_custom_axes). Why would you do this, though? It turns out there are subtle differences in how people perceive weights against dark and light backgrounds. Sometimes a small bump to a direction or another is all you need and in VS Code you could for example set `"editor.fontVariations": "'GRAD' 25"` to bump a notch up or `"editor.fontVariations": "'GRAD' -25"` to bump a notch down. In our case the scale goes from -50 to 50.

In technical terms, the feature affects stroke thickness while retaining character widths and spacing and avoiding breaking your line breaks for MonoLisa Text. So consider it especially as a design feature that allows you to do subtle tweaks depending on the context while retaining the same font weight.

## Other changes

Besides these bigger changes, there have been other smaller changes we have listed below:

- We reorganized and cleaned up stylistic sets, so the order makes sense again.
- Figure `7` (seven) with a middle stroke was introduced as `ss14`.
- Plain `0` (zero with no center element) was introduced as `ss15`. In MonoLisa Text the plain zero is the default and the dotted version is the variant.
- The support for historical Greek was extended and the support for Armenian, Hebrew, and Braille has been added.

You can [find full details and a migration guide at the release log](/releases/3.000).

## New website

As we worked with the additions to the typeface, we realized it's not enough to update only the font, but the website has to be made to fit it and showcase the new features well. Compared to the earlier one, you will likely notice that sections, such as the landing page or specimen, have received major updates. We also had to make sure the customization tool works with the new additions.

## Refreshed plans

The new version is available in three plans: Trial, Developer, and Creator. The Trial plan includes a subset of both Code and Text, and it has been limited in terms of weights (Normal and Bold). The key point is that Trial gives enough of an idea of what it's like to work with MonoLisa on your own system.

The new Developer plan replaces our earlier plans as it bundles all the features for personal usage (including websites) so there's no need to think about which plan to pick. There are two variants of the Developer plan. One with Code only and one including both Code and Text. It's also possible to upgrade to the version with Text later on if you are unsure of it.

The Creator plan has been designed for commercial use cases, and it allows you to buy exactly what you need for a specific case, such as a logotype or using a font in a book. It also allows designers to buy a font to use for their clients. Essentially this plan replaces our earlier commercial subscription options. If you are on an earlier commercial subscription, we recommend buying a fixed license, although you can still keep your earlier subscription in place if you prefer that instead.

## Upgrade policy

A major version like this is always a major undertaking in terms of development time. We came up with a simple model for upgrades to take into account when and what you bought:

- If you bought Complete starting from the beginning of this year, you'll have a free upgrade to Developer.
- For anyone else, you'll get a discount based on proximity so that if you own version 2, you'll get a bigger discount than version 1 owners towards version 3.

Note that even if you decide not to upgrade, your current version will remain accessible. To ease maintenance burden, we'll sunset customize tool for version 2 in the coming months since the variant for version 3 has its own added complexity.

## Conclusion

Version 3 is a major milestone for MonoLisa as it expands the family while improving the pre-existing one. Especially if you haven't tried MonoLisa, we recommend [testing out the trial](/buy/trial/) as it gives you an impression of how the typeface can work on your system since it's one thing to see and another thing to experience.
