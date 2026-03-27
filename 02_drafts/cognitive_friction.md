---
title: "Cognitive friction in development"
published: 2026-04-01
updated: 2026-04-01
keywords: ["productivity"]
authors: ["Juho Vepsäläinen"]
---

Cognitive friction happens when the mental work of understanding code is higher than it should be. This post outlines naming, complexity, paradigm mismatch, and tools that reduce mental load.

## What to cover

- How naming influences comprehension in small and large scopes.
- Complexity metrics (cyclomatic complexity, cognitive complexity) and best practices.
- Paradigm fit: when FP, OO, procedural, or reactive design can reduce code mental cost.

## Practical actions

- Adopt naming rules: nouns for objects, verbs for actions; no hidden state in names.
- Prefer flattening nested logic where possible; use early returns and simple guards.
- Use automated analysis with static tools and code reviews focused on understanding.

## Call to action

- Add one mental-simplicity item to your definition of done.
- Keep this section short and link back so readers can jump to detailed examples.
