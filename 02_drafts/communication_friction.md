---
title: "Communication friction in development"
published: 2026-04-01
updated: 2026-04-01
keywords: ["productivity"]
authors: ["Juho Vepsäläinen"]
---

Although stereotypically thinking development, and especially coding, is a lonely kind of profession, in practice it's anything but. Now that coding tasks are increasingly pushed to machines, it means there is more space for communication with different stakeholders. That in turn opens way for communication friction as having the right information at the right time becomes the key issue. In this post, I consider communication friction in detail and what to do about it.

## Sources of communication friction

Whenever we work with other people, or even with agents, communication between different parties has to happen. As famously formulated by [Wiio](https://en.wikipedia.org/wiki/Wiio%27s_laws), "communication usually fails, except by accident". Although meant humorous, there is a seed of truth in the statement since it is quite normal something gets interpreted in the way we didn't intend and that in turn can have impact on our communications. This theme is visible in many places from requirements to bug reports to documentation and to decisions that exist only in someone's mind.

To give a better idea, consider software development lifecycle and all its steps. Each step in a process is a chance for a misunderstanding. It all begins from requirements where vital information might be missing. Perhaps only the solution was described without any context telling what the solution is actually solving. This in turn can lead to an implementation that was perhaps interpreted from a specific angle leading to an outcome that doesn't solve the initial problem at all or does so in a wrong way that doesn't make any sense. To make things worse, perhaps the user will report a bug about the new feature without describing the expected behavior or leaving reproduction steps out making it highly frustrating situation for a developer that has to deal with the issue.

Documentation is another good source of communication friction since there are many things that can go wrong. It can for example be stale and simply contain information that's not true anymore. There might be a lot of information describing the "what" leaving out the often more important "why". Worse yet, product related decisions might have been left undocumented meaning same arguments might come up yet again as the reasonings for decisions were forgotten. Often there are good reasons for certain decisions so it's worth writing them done as some of the reasons might be related to the current context and context can change over time. A decision that made sense yesterday might not make sense today.

With the introduction of chat based communication via tools like Slack to our industry, we created yet another source of communication friction. Typically, all the messages look the same regardless of their importance meaning you have to read all the messages to stay in the loop. There is value in summarization and not forcing people to follow these kinds of channels too closely as that is mentally draining over longer term. It may be worth it to make clear policies to using these kinds of tools and relaxing the expectation of keeping up. The most important pieces of information should be summarized clearly outside of streaming systems for this reason.

While coding agents can produce huge amounts of code, that can lead to new problems fast as most organizations still prefer to understand what is included to the changes. At the time of writing, GitHub style pull requests are used for the purpose with the assumption that developers go through the proposed changes perhaps with coding agents that can point out issues developers might miss. Even then, it can still be a lot for developers to review. To make things worse, pull requests might be missing clear context or an associated deployment making it even harder to evaluate the changes.

## How to reduce communication friction

Since communication is so prone to friction at different levels, it's worth acknowledging and addressing the related friction. I've listed several ways below:

1. Document your decisions. I've used [Architectural Design Records](https://adr.github.io/) (ADRs) with great success to document what was done and why. They don't capture all the technical details, but they leave enough paper trail to give enough context for anyone who is working on the project. Besides this, a higher level vision document is useful, and I tend to maintain separate documents for competitor analysis to help with positioning for example.
2. Describe the problem, related constraints, and tradeoffs in technical communication. Having enough context is essential as it helps to understand what you are trying to solve and why.
3. To improve transparency and to avoid interruptions, find easy ways to make your current status visible. This can help to clear misunderstandings and to calibrate expectations.
4. Leverage templates in your documentation work to produce familiar structures that are easy to understand. For example ADRs follow a specific format typically, and you can create your own templates for bug reports and pull requests to ensure you capture the information you want.
5. Do not underestimate the importance of documentation. Maintaining documentation takes conscious effort, but it has become particularly important now that we work with agents that have the same problem of having to construct context before working.
6. When there's potential for ambiguity and misunderstanding, prefer synchronous direct conversation, and record the outcome. Text based communication is prone to misunderstandings as it is missing social cues, and it might feel harsh often it is not well filtered. People tend to communicate differently in text than in person.

## Practical advice

To sum up this complex topic, I've included concrete advice below:

1. Spend conscious effort to manage context for your communications. Typically, anything that is implicit can be misunderstood by different parties as there might be different expectations. In particular, make sure to consider the "why" as that often given motivation and helps to understand the rest.
2. Record your architectural decisions for example by using ADRs so future maintainers can find your decisions.
3. Make sure your bug reports are reproducible by default to avoid back and forth.
4. Separate urgent communication from ambient discussion (i.e. casual Slack chat).
5. If communication fails, consider why it happened and find ways to avoid this in the future collectively.

## Conclusion

A surprisingly big part of development work has to do with communication. Now that we deal with agents that can infer meaning and context based on documentation, clear communication has become even more important than ever.

You can [refer back to the anchor post of this series for more ideas regarding friction](../friction_in_software_development).
