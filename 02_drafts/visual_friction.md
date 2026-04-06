---
title: "Visual friction in development"
published: 2026-04-01
updated: 2026-04-01
keywords: ["productivity", "code readability"]
authors: ["Juho Vepsäläinen"]
---

You encounter visual friction when what you read is difficult to parse at a glance. In this post, I show how presentation affects developer productivity and why readability matters for software developers.

## What is visual friction

A big chunk of development work is recognizing and using patterns. There's a reason why we split our code to functions. It's because we are adding semantics and stucture to our code so it's easier for us to understand and to work with. Of course you can overdo this and end up with a composition that's difficult to understand so there's some balance to maintain.

It's important to separate [cognitive friction](../cognitive_friction) from visual one, since cognitive friction has specifically do with understanding the meaning while visual friction has to do with seeing the structure. Most likely you use techniques to manage visual friction already as commonly used development environments integrate many of them by default.

Visual friction is interesting in sense that you encounter it anywhere where you have visual interfaces ranging from code editors to terminal output, diffs, pull requests, and documentation for example. That is not to say friction is not sometimes needed, as it absolutely is. Friction can be useful when you want to make the user to consider their actions and for this reasons user interfaces typically try to stop you before doing destructive actions that lose data.

## Examples of visual friction

To give you a better idea of what visual friction really is, consider the examples below:

- Especially for fonts, the typical benchmark is to compare characters such as `0` and `O` or `1` and `l` since these pairs can get confused easily. Perhaps the most famous bad example is a commonly used typeface called Arial where these pairings are not easy to tell apart at all.
- Many editors include syntax highlighting to allow you to detect keywords and structures faster. It is possible to go overboard with this, however, as wrong color choice can be counterproductive and make code harder and more annoying to read.
- Choice of your color theme matters as it has psychological impact as well. I don't know why, but for some reason many developers prefer a dark theme over a light one. I've found [Catppuccin](https://catppuccin.com/) to be a good option since the collection of the themes is not too "loud" and color intensity can be easily adjusted to your liking.
- There is a connection to working in daylight and night since the amount of light from the environment. To reduce eye strain, some people use a feature called [night shift](https://support.apple.com/en-us/102191) available in MacOS and likely in other operating systems as well. It is well understood that blue light from the display can impact your circadian rhythm and therefore affect your sleeping.
- Line length, spacing, and indentation matter. For example, my preference for line length is somewhere between 80 and 110 characters as anything shorter or longer than that gets annoying to read. Sometimes you encounter this issue on websites where the designers didn't go with a conventional line length. You might not notice it consciously, but it's annoying. The same goes for spacing and indentation as there are many opinions on how to do it. Some say you should go with tabs since then it's up to the user. I like to delegate this debate to a tool like [Prettier](https://prettier.io/) that's handling indentation for me automatically.
- In general, formatting is one source of visual friction. That's another reason why I prefer to use Prettier or a similar tool for my projects as it keeps formatting consistent thereby reducing visual noise especially when working with multiple projects as each should have same rules if possible.

## How to reduce visual friction

I think I covered a lot of potential solutions already, but in short consider using tools like Prettier, or a theme like Catppuccin combined with night shift. This is not all of course since it also matters what kind of typeface you use and we hope you [give MonoLisa a go](https://monolisa.dev) since it was optimized for legibility. There are other options too and it's worth experimenting to find a typeface that works for you since often the default one is not the ideal. This is true especially considering the amount of time you spend at your display on a daily basis. A better typeface combined with other improvements can literally save you from a headache and perhaps allow you to sleep better.

Beyond these, there are a couple of more actions you could consider:

1. Consider setting your IDE line length around 100 characters. For text, simply enabling the limit and line wrapping is enough. I also tend to split the sentences of paragraphs per line since that is helpful when you are editing the transitions of your text and checking the overall flow.
2. Adjust your color theme so that the most important aspects of code stand out while the rest get less visual attention. A common technique is to use a different style for code comments for example. You can also play with colors to see if that makes a difference.
3. Consider the spacing and rhythm of your code. Especially now with AI-driven development, a common technique is to design your code using well written comments and then let the machine fill in the implementation. I would leave the comments in place most likely and use spacing between the blocks to differentiate them.
4. Check the different tools you are using together for visual consistency. Often something looks off and you might need to adjust for example the typeface or a color theme. Since adjusting typefaces can be so hard, we added a customization feature to MonoLisa that allows you to "freeze" the font features you want to an instance of a font to allow access to complex font features regardless of the environment.

## Visual tradeoffs

It's one thing to optimize visuals for yourself and another to optimize them for an entire team as there are most likely personal preferences in play. I would say it's easy to standardize on common things, such as formatting, and leave some of the other factors up to personal choice although I would still try to share best practices with colleagues as often people don't care about visual clarity so much. A part of this is the lack of awareness and it's something people don't think about.

There are certain font features that can come with visual tradeoffs. For example ligatures help with pattern recognition but it can be argued they hide literal characters too much making it a controversial feature. Again, it is one of the features you have to try and a good compromise is to stick with only spacing related subtle adjustments that don't replace whole combinations in so drastic way. Good typefaces allow this type of subtle adjustments and obviously MonoLisa includes this level of flexibility.

## Conclusion

Visual friction is only one source of many frictions in development. If you want to investigate other sources of friction, [refer back to the anchor post for more ideas](../friction_in_software_development). The post that is most related out of them, is most likely [the post about friction in typography](../typography_friction) as it can be considered a subset of visual friction.
