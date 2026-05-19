---
title: "Toolchain friction in development"
published: 2026-04-01
updated: 2026-04-01
keywords: ["productivity"]
authors: ["Juho Vepsäläinen"]
---

Toolchain friction is the drag created by the tools between source code and working software. It shows up as slow builds, flaky tests, dependency problems, local environment drift, unclear errors, and CI failures that are difficult to reproduce.

This post looks at toolchain friction from a developer's point of view and how it affects flow, confidence, and delivery speed.

## Sources of toolchain friction

TODO:

- Slow install, build, test, and deploy loops.
- Flaky tests and non-reproducible failures.
- Local environments that differ from CI or production.
- Dependency upgrades that feel risky or mysterious.
- Error messages that point to symptoms rather than causes.
- Tooling that requires undocumented tribal knowledge.

## How to reduce toolchain friction

TODO:

- Optimize the most common loop first.
- Make setup reproducible.
- Separate fast checks from full validation.
- Treat flaky tests as product defects in the toolchain.
- Improve error messages, scripts, and documentation where developers actually get stuck.
- Keep dependencies current enough that upgrades stay manageable.

## Practical advice

TODO:

1. Time the basic development loop: install, run, test, lint, build.
2. Identify the slowest command developers run every day.
3. Fix or quarantine flaky tests instead of normalizing reruns.
4. Document the recovery path for common CI and dependency failures.
5. Make the happy path obvious for a new developer.

## Conclusion

TODO: Summarize why good tooling should fade into the background and give developers fast, trustworthy feedback.

You can [refer back to the anchor post of this series for more ideas](../friction_in_software_development).
