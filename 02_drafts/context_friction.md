---
title: "Context friction in development"
published: 2026-04-01
updated: 2026-04-01
keywords: ["productivity"]
authors: ["Juho Vepsäläinen"]
---

Context friction is the cost of switching, interruption, and attention recovery. It shows up when you move from implementation to Slack, from code review to a meeting, from a failing test to an unrelated support question, and then back again. The interruption itself may take only a minute, but it can take a long while to rebuild the mental model you were using before the interruption. Besides feeling annoying, this can feel draining over longer term and add up if interruptions are common.

## Flowing alone

Mihaly Csikszentmihalyi's concept of flow is well known in creative work: the state of deep focus where time seems to move differently and the task has your full attention. Programming often benefits from this state because you are holding many details at once: the goal, the current implementation, constraints, edge cases, and the next step. Unfortunately it is easy to break flow. One notification at the wrong time can be enough to lose the thread, after which you have to reconstruct the context before you can make progress again.

My preferred way to protect flow is to split the working day into segments dedicated to different types of work. Lunch provides a natural boundary, and it is usually unrealistic to expect deep focus for an entire day. Some people prefer shorter blocks, such as [Pomodoro](https://en.wikipedia.org/wiki/Pomodoro_Technique) sessions: 25 minutes of work followed by a short break.

The benefit of chunking is that it lets you decide what kind of work belongs where. I have learned that meetings are tiring for me, so I prefer to push them toward the end of the working day when I am less likely to do good deep work anyway. Other people may have different rhythms, but the principle is the same: place expensive cognitive work where your attention is strongest.

In short, protect the blocks where focused development can happen. Disable notifications, close unrelated tabs, and make your availability visible, so teammates know when to expect a response.

## Flowing together – pairing, ensemble programming

Although programming is often treated as solo work, it does not have to be so. With a colleague who has complementary skills, [pair programming](https://en.wikipedia.org/wiki/Pair_programming) can reduce context friction because decisions, implementation, and review happen in one shared loop.

Modern language models, or agents, can also play part of this role when a human pair is not available. They can help explore options, draft code, explain unfamiliar APIs, or keep a task moving. This can be effective, but it requires discipline: you still need to review the output, understand the design, and keep ownership of the result as otherwise you risk producing what is commonly known as AI slop. So be mindful when working with machines and make sure you are sitting in the driver's seat.

Agentic tools introduce their own context friction. You may be tracking your own plan, the tool's plan, generated diffs, review comments, failing checks, and hidden assumptions at the same time. Used well, the tool reduces load. Used carelessly, it creates a new stream of work to supervise.

This kind of friction tends to add up especially if you are running multiple agents in multiple contexts at once, and it can easily become overwhelming to keep track of all the action. The machine can move far faster than you can so you have to find efficient ways to deal with this difference in available bandwidth without stretching yourself too far.

You can also combine human collaboration and machine assistance. In an ensemble or mob programming setting, the team can make product decisions, document them, and implement them while the shared context is still fresh. Besides speed, working together leads to fewer handoffs and a shared vision of what was done and why as work is shaped together.

## Practical advice

The practical goal is to reduce avoidable context rebuilds:

1. Use timeboxes and focus sessions, such as Pomodoro blocks or 90-minute deep-work sessions.
2. Set expectation rules for communication channels. You do not have to respond immediately to everything.
3. Batch similar tasks: reviews together, meetings together, support work together, implementation together.
4. Leave breadcrumbs before switching: a failing test name, a short note, or the next command to run.
5. Treat unfinished work as a context object. Capture enough state that future you can restart quickly.

## Conclusion

Context friction is often invisible because interruption feels like a normal part of the job, but it doesn't have to be so. The more complex the work, the more valuable it becomes to protect attention deliberately.

You can [refer to the anchor post of this series for more ideas](../friction_in_software_development).
