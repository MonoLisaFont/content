---
title: "What is a monospaced font?"
published: 2024-10-18
updated: 2024-10-25
keywords: ["typefaces"]
authors: ["Marcus Sterz", "Juho Vepsäläinen"]
---

What is a monospaced font and why are they used for programming?

{/*
JV: I would expand on this

If you are programming, you are most likely using a monospaced font already. In this post, we explore monospaced fonts while considering the benefits and tradeoffs.
*/}

## The monospace

{/*
JV: Proposed new title

## What does monospaced mean?
*/}

Monospaced means – as the word says – that each glyph (letters, signs, symbols etc.) have the same horizontal space. Other terms are fixed-pitch, fixed-width, or non-proportional. The origins of monospaced fonts are the mechanical typewriters of the 19th century, a time before computers were even built. Monospaced fonts share the characteristic that letters like M, W, m and w often look crammed while letters like i and l must be designed as wide a possible to fill the available space. To achieve this, serifs are added to some glyphs as they occupy the space. These and other constraints make the design of highly legible coding fonts a difficult task.

TODO: Maybe the image should have a grid showing alignment of the characters in different scenarios

![This is some image caption](/images/demo.png)

{/*
JV: I would split this up a bit like this.

Monospaced means – as the word says – that each glyph (letters, signs, symbols etc.) have the same horizontal space. Other terms are fixed-pitch, fixed-width, or non-proportional. Consider the example below to understand how this type of spacing works.

TODO: Add an example image here

The origins of monospaced fonts are in the mechanical typewriters of the 19th century, a time before computers were even built (TODO(JV): better with a reference). In mechanical typewriters, each glyph is represented by a single stamp that is applied on paper and it was a natural choice to go with a fixed width. TODO: Mention typefaces based on typewriters here
*/}

{/*
JV: Proposed new section to show the downsides

## Tradeoffs of monospaced fonts

Although monospaced fonts use space efficiently, they come with tradeoffs to consider. For example, often letters like M, W, m and w often look crammed while letters like i and l must be designed as wide a possible to fill the available space. To achieve this, serifs are added to some glyphs as they occupy the space. These and other constraints make designing of highly legible coding fonts a difficult task. The image below illustrates several problematic cases and possible solutions.

TODO: Show problematic cases here in an image vs. MonoLisa

![This is some image caption](/images/demo.png)
*/}

## Code

{/*
JV: Proposed new title

## Monospaced fonts in programming
*/}

Why is a monospaced font important? Your code is easier to read if the letters are not just aligned horizontally (as every text is) but also vertically. This allows you to go through the code faster, makes it easier to compare lines and most importantly structure your code in a grid your eye can navigate fast through. MonoLisa is designed espacially for this task, using other techniques like open forms and terminals (a typographic term for the ‘ending’ of letter shape) and its unique shapes to balance out the constraints of being monospaced.

{/*
The benefits of using a monospaced font for programming are clear since alignment of characters is highly important for legibility of code. Monospaced fonts give a natural grid by definition and allow fast scanning of code blocks regardless of their content. In case you used a non-monospaced font for coding, you would have to spend more time scanning the text to figure out code blocks and compare lines for example.

TODO: I would do entire posts about open forms and terminals and expand on this sentence there (I set up templates already). MonoLisa is designed espacially for this task, using other techniques like open forms and terminals (a typographic term for the ‘ending’ of letter shape) and its unique shapes to balance out the constraints of being monospaced.
*/}

{/*
JV: Proposed new section to sell the benefits

## Beyond code

Monospaced fonts have uses beyond programming due to their space fitting capabilities. Consider you are creating a space limited user interface where you have to show time spans in a column in a schedule. Although using a relative font would work, going with a monospaced font will make it easier for your users to scan the list. The image below illustrates the difference.

TODO: A good spot for cross referencing with tabular figures post

TODO: Add a visual example here
*/}

## Conclusion

If you want to know more about the way MonoLisa makes programming easier please follow the link: [more information can be found at MonoLisa website](https://monolisa.dev).

{/*
JV: I would expand this

Monospaced fonts have their uses in use cases where space is limited and the visual grid provided by them is usable for legibility in contexts such as programming. Beyond this, monospaced fonts have their place in design especially when alignment is preferred to speed up visual scanning.
*/}
