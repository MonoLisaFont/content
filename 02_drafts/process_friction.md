---
title: "Process friction in development"
published: 2026-04-01
updated: 2026-04-01
keywords: ["productivity"]
authors: ["Juho Vepsäläinen"]
---

Often our work exists as a part of some larger process depending on our role in it. Sometimes the process is not even well understood by its stakeholders, and it might have been inherited from our predecessors.

It is within this framework that process friction exists. This post discusses process friction from a developer's point of view to understand where it shows up, why it accumulates, and what to do about it.

## Sources of process friction

Typically, processes are defined by tasks, handovers, and feedback loops. Some of the tasks may occur in parallel even while having their own completion criteria. This simple definition gives us a way to think about process friction since it can occur within tasks themselves or handovers. For example, you might be able to complete your coding tasks so fast that acceptance and testing becomes a problem.

Optimizing a single part of the process may not make the entire process faster at all as described by [theory of constraints](https://en.wikipedia.org/wiki/Theory_of_constraints). In short, friction may occur within a task, between the tasks, or when work is sent back in the process for revision.

There is also a whole meta-layer to thinking about processes since typically processes exist for a reason and there are specific characteristics the process tries to capture. It is normal there are multiple stakeholders to consider for example and there may be specific acceptance criteria in place to ensure high enough quality, so work items can progress through the process at a sufficient quality level.

It is these kinds of constraints that may add desirable friction to a process as specific inspections (security reviews or database migrations) may be needed especially if quality is an issue. A fast, friction-free process is not always even desired since you may want to give time for evaluation.

Sometimes a heavy process may imply low trust between participants. Perhaps something failed in the past, so the process had to be made more strict. Occasionally this may be fine, but with a heavier process you also tend to have more chances for friction. Therefore, focusing on how to reduce friction has particular value especially when the process is heavy to begin with.

## How to reduce process friction

Before reducing friction, it is a good idea to perform [process mapping](https://en.wikipedia.org/wiki/Business_process_mapping). Process mapping allows you to consider who is doing what, when, and why. Essentially it allows you to write down the steps of your process while evaluating their relationships. This process of elaborating what is happening can be valuable in itself and help you gain a strong understanding of what is going on before you might want to change anything.

It is this kind of mapping that helps you appreciate the different parts of the process and allows you to change it. Perhaps there is something in the process that is now unnecessary, or perhaps some things could be done in an alternate order. There may also be room for some level of parallelization. On top of this all, you have to consider what kind of resources you have available as you might be able to leverage those to your benefit. Also reallocating resources to the slowest parts of the process may speed up the overall process at a minimal cost.

Besides analysis, there may be room for automation. Especially with current agentic development tools, it seems clear that tasks, such as testing, have become much cheaper to perform. Therefore, it is worth investigating where you can benefit from automation. As mentioned, automation alone may not speed up the overall process unless you are addressing something that was slowing down the overall process considerably. Improving the wrong part of the process may even increase stress at other parts of it as they have to deal with a higher volume of input and hence may become overwhelmed. A good example is the flood of automated pull requests encountered by open source maintainers.

Changing a process is never an easy task, and it should be done mindfully. Only optimizing your portion of the work may be missing the point. It is worth it to consider other parts of the process and look for the low-hanging fruit that improve the overall process without reducing its key attributes, such as security or quality. The key point is to optimize the whole process, not only your local convenience.

## Practical advice

In technical terms, there are many ways to improve a process further. Our industry is often great at optimization at least locally. Optimizing the whole system may be another story. To keep it short, consider the following:

1. See if you can observe specific kinds of delays in your team workflow and measure where time is spent.
2. Clarify roles within a process to address bottlenecks. For example, it's possible that there are not enough people with review or release rights.
3. Make sure you have the right people in play at the right times of the process to avoid pushing work back in the process as that can be costly.
4. See if there are repeating tasks that could be automated or turned into guidelines to follow. Generally, rules have value especially when working with agents as they need strong guardrails to function well.
5. Separate active work from waiting time and measure both. It's possible a lot of time in the process is simply spent waiting. That's when you know there's something clear to optimize.
6. Perform process mapping to create an explicit view to your process. This is particularly useful for onboarding new developers to your process.

## Conclusion

Processes are an important part of our daily work even if we don't think about them consciously. That is also the tricky part since it can be so easy to get accustomed to them and go with the routine. It is this psychological part that can make them difficult to change as you need conscious effort to understand what you are doing and why.

That said, focusing on your process can lead to significant improvements in terms of productivity. A good process also makes work less frustrating and more predictable, so this is not only about productivity. It is also about working conditions.

You can [refer back to the anchor post of this series for more ideas](../friction_in_software_development).
