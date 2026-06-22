---
title: "Toolchain friction in development"
published: 2026-04-01
updated: 2026-04-01
keywords: ["productivity"]
authors: ["Juho Vepsäläinen"]
---

As developers, we use different types of tools constantly to produce working software. Tools go beyond what we use at our own machines as often there are tools available within our broader environments in the form of continuous integration servers and other pieces of infrastructure. It is within this context that toolchain friction occurs as our tools don't work in an ideal manner or slow us down.

## Sources of toolchain friction

If you look at the way you work with tools, it is surprisingly easy to discover sources of friction as any place where we waste time or effort can be considered as such. At a broader scale, the idea of toolchain friction is related to [process friction](../process_friction) and understanding your process and the tools within it is valuable in terms of mapping your toolchain friction.

Since a lot of our work is automated and well containerized these days, it typically means there are many phases in the overall process where we have to wait for something to install, build, and get tested for example. The choice of tools matters as some are simply faster than others. It is not only about speed, though, as having any source of non-determinism in your process can lead to for example flaky tests or non-reproducible failures. All of that adds to toolchain friction.

Another good example of toolchain friction is formed by the differences between your local, CI, and production environments. Perhaps there are subtle differences that lead to different results. To make things worse, the users might be using your product in a considerably different environment than you are. You can notice this for example with mobile web applications in situations where the client hardware is low grade and connectivity is not good. That is far different from what you might experience during development. In a sense, the friction is pushed to the user in this case making it difficult to notice.

As developers, we have to keep our software up to date to pick up the latest security updates for example. The fact that we have to do this adds friction to the process as it's not always so clear what are the exact impacts of a simple upgrade. On top of this, we often have to deal with mysterious error messages and occasionally poorly documented software. All of these tiny details add up.

## How to reduce toolchain friction

While there are many sources of toolchain friction, at least some of it can be addressed through awareness. As mentioned, a lot of this comes down to understanding your process and where you are experiencing most of the friction. For example, I use a tool called [Agent CI](https://agent-ci.dev/) to run GitHub Actions locally. Agent CI works well with agentic development flow for fast validation before you hit the relatively slow CI server giving me a fast development loop and allowing partially autonomous development of features. A part of this kind of work is separating fast checks from slow ones since if you can catch issues with fast checks, it's an overall win for your workflow.

In any case, I would heavily recommend documenting your toolchain well and making it easy to get started with your project. It can be a great idea to containerize your project using [Docker](https://www.docker.com/) or a similar tool so you have the project clearly isolated from the host system, and it is easy to manage its dependencies. Since error messages and documentation are common sources of friction, it is worth putting effort into that department. Again, this direction goes well with agentic development since the agent can greatly benefit from an explicit context and easy error messages to understand.

In short, look for toolchain friction wherever you use any kind of tools and consider if you can improve the way they are used somehow. Occasionally the best thing you can do is to replace a tool with another. There has been a strong trend towards more performant tools in JavaScript ecosystem for example, and often it is easy to swap an equivalent yet faster tool to your project to waste less time waiting.

## Practical advice

To summarize, there are several steps you could do to address toolchain friction:

1. Time how long each portion of your development loop requires from installation, to running, testing, linting, and building.
2. Identify the slowest portions and see if there is something you can do. Perhaps there are some configuration options you could leverage, or perhaps you could run more specific analysis or even use another tool. In general, scoping tool runs to code affected by changes can yield nice performance improvements. There the challenge is detecting the radius of the impact.
3. If you have flaky tests in your project, consider fixing or quarantining them instead of relying on reruns.
4. Document your project well so it is easy to understand the toolchain of the project and what is used and why. This helps in improving the project further in the future besides having onboarding benefits.
5. Unless your project has been containerized already, consider containerizing it so it's easier to resume developing the project as this process isolates your project from the host system and removes implicit assumptions.

## Conclusion

Toolchain is a considerable source of friction for developers, and it is one of those we experience constantly. Therefore, it's worth considering its impact to our work, performing analysis, and improving where possible.

You can [refer back to the anchor post of this series for more ideas regarding friction](../friction_in_software_development).
