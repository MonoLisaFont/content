---
title: "Visual friction in development"
published: 2026-04-01
updated: 2026-04-01
keywords: ["productivity", "code readability"]
authors: ["Juho Vepsäläinen"]
---

Visual friction is the pain we feel when code is hard to parse at a glance. After reading this post, you understand how presentation affects developer flow and why readability is not just aesthetic polish but a practical part of writing and maintaining software.

## What to cover

- Define visual friction in plain terms: anything in code or tooling that makes recognition slower than it should be.
- Explain how visual friction differs from cognitive friction: the first is about seeing structure, the second is about understanding meaning.
- Show where the issue appears in practice: source code, terminal output, logs, diffs, pull requests, and documentation.

## Starter ideas

- Font choice matters more than many developers admit. Distinguishing `0` from `O` and `1` from `l` reduces avoidable mistakes.
- Syntax highlighting should support scanning, not become decoration. Too many loud colors can make code harder to read.
- Line length, spacing, and indentation shape how quickly readers notice structure.
- Consistent formatting reduces the cost of jumping between files and projects.
- Good contrast and theme choices matter for long sessions, especially when switching between bright daylight and evening work.

## Practical examples

- Include a small before/after snippet showing the difference between dense, uneven formatting and a cleaner version.
- Show an example where ambiguous glyphs or weak contrast make a bug harder to spot.
- Compare a noisy theme against a restrained one and explain which visual cues actually help.

## Practical actions

- Keep line length under roughly 100 characters when possible so structure stays visible without horizontal scanning.
- Use a fixed-width font with clear character differentiation and test it with your own code, not just sample text.
- Tune syntax colors so comments, strings, keywords, and errors are easy to spot without competing for attention.
- Group code around intent with whitespace instead of creating walls of tightly packed logic.
- Check terminals, editors, and documentation together so the whole workflow feels visually consistent.

## Tradeoffs worth discussing

- When to tune your personal environment and when to standardize settings across a team.
- When ligatures help pattern recognition and when they hide the literal characters too much.
- When compact views improve productivity and when they make scanning slower.

## Cross-links and ending

- Tie the post back to the anchor article so readers can place visual friction within the larger friction model.
- Link to the typography post because font choice is one of the clearest examples of visual friction in practice.
- End with a short checklist readers can apply to their editor in five minutes.
