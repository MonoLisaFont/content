---
title: "Our upgrade policy for major versions"
published: 2026-03-25
updated: 2026-03-25
keywords: ["product"]
authors: ["Juho Vepsäläinen"]
---

Typically, typefaces are developed and published before the author moves on to the next project. In the case of Monolisa, we follow a different approach since it's a project that evolves [based on your feedback](https://github.com/MonoLisaFont/feedback/issues). In this sense, it is a software project.

When we release a major version of the typeface, it implies a significant amount of rework, as we had to revisit hundreds of glyphs. This means it takes considerable effort; essentially, you end up with a new typeface internally, and often, there are software changes underneath too.

For example, in version 2, we reworked the typeface to support variable weight available in the Complete plan, so you can get exactly the weight you want instead of a preset. This rework triggered necessary changes at the infrastructure side as we had to redevelop a big chunk of it to support our customize feature that allows you to freeze features to the font files to gain access to the features in environments that do not allow you to adjust the way the typeface is rendered.

In summary, we consider each major version as a distinct cycle of the product that is maintained until the next major rework occurs.
