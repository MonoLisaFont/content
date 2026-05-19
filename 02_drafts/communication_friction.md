---
title: "Communication friction in development"
published: 2026-04-01
updated: 2026-04-01
keywords: ["productivity"]
authors: ["Juho Vepsäläinen"]
---

Communication friction is the drag created when developers do not have the right information at the right time. It shows up in vague requirements, unclear bug reports, missing rationale, noisy channels, stale documentation, and decisions that live only in someone's memory.

This post looks at communication friction from a developer's point of view: how it affects implementation, review, and maintenance.

## Sources of communication friction

TODO:

- Requirements that describe a solution without explaining the problem.
- Bug reports without reproduction steps or expected behavior.
- Documentation that says what to do but not why.
- Architectural decisions that are not recorded.
- Chat channels where urgent, useful, and irrelevant messages look the same.
- Pull requests that lack context for reviewers.

## How to reduce communication friction

TODO:

- Write down decisions close to where they matter.
- Include problem, constraints, and tradeoffs in technical communication.
- Make status visible without requiring constant interruption.
- Improve bug report and pull request templates.
- Prefer durable documentation for durable knowledge.
- Use synchronous conversation when ambiguity is high, then record the outcome.

## Practical advice

TODO:

1. Add context to pull requests: what changed, why, and how to review it.
2. Record architectural decisions where future maintainers can find them.
3. Make bug reports reproducible by default.
4. Separate urgent channels from ambient discussion.
5. Treat unclear communication as a source of rework, not a personal failure.

## Conclusion

TODO: Summarize why communication is part of the development system, not separate from the technical work.

You can [refer back to the anchor post of this series for more ideas](../friction_in_software_development).
