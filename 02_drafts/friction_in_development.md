---
title: "Friction in development"
published: 2026-04-01
updated: 2026-04-01
keywords: ["productivity"]
authors: ["Juho Vepsäläinen"]
---

As developers, we often fixate on tools, frameworks, and architecture, but there is more to productivity than this. It is true choosing the right tool for the problem can make a world of difference, but there is more to the topic. It is often those tiny annoyances that slow us down in the form of friction and in this post we'll explore several sources of it.

## Visual friction

Especially now that developers can generate vast amounts of code easily using tools driven by artificial intelligence (AI), reading and understanding the code has become a clear bottleneck. Even if AI produces the code, we are still responsible for our code after all. Therefore reading code is a significant source of visual friction.

A big chunk of this is the font you use, but it is also about how you structure your code so that it is easy to understand. Having types and code related invariants visible can make it more clear what is going on and it would not come as a surprise if older techniques, such as [Design by Contract (Eiffel)](https://en.wikipedia.org/wiki/Design_by_contract) and similar would gain popularity yet again. Most likely formal systems will grow in popularity as well as there is value in being able to prove code correct although that is out of reach for most of us.

## Cognitive friction

Another source of friction could be considered congnitive. You know the difference between using short variable names against long and descriptive ones. Short variables can be acceptable within a limited scope but likely you would not be comfortable writing, or at least reading, huge chunks of code with implicit naming.

It is not only naming that matters, but code complexity as well. The more indirection and layers our code has, generally the harder it becomes to understand. [McCabe's cyclomatic complexity](https://en.wikipedia.org/wiki/Cyclomatic_complexity) illustrates this concept well and there are good tools that allow you to measure this factor and others.

This is where your programming paradigm matters as some paradigms fit our problems better than others. When there is no clear fit, you can feel it in your code as it likely takes more effort to achieve something than it actually should. A good example is using a Single Page Application where either a [Hypermedia Driven Application](https://hypermedia.systems/introduction/) or a Multi Page Application would suffice. Sometimes we invite complexity to our work without thinking about it and sometimes it is a given.

## Mechanical friction

Mechanical friction is one source that we feel in our work. By this I mean specifically friction related to physical mechanics, as in typing or using our senses somehow. A good keyboard that you can customize to your liking and that is comfortable to use can make a difference. Most importantly it can save us from an injury and it is worth paying attention to your ergonomics. A simple thing, such as keyboard switches, can make the difference between able to type fast and easy vs. slow and hard.

An interesting alternative is to consider voice input over keyboard especially now that prompting based flows have become popular with AI tools. It is something that takes a bit of getting used to as you typically do not speak to your machine, but it may be worth trying. Of course having to talk all the time can be draining in its own way.

## Context friction

One difficult part of the modern age is the amount of distractions available. That is where context friction kicks in as our attention is valuable and some go as far as to claim we live an attention economy. Sometimes even a small distraction can get us out of the zone and force us to gather our thoughts again.

This is something that has interestingly enough changes with the emergence of AI tools as there can be more waiting in the workflows, especially if you leverage techniques, such as agentic coding, where your role is more of a product manager that makes sure things stay on track and sensible work is getting done.

Regardless, there is a clear cost to task switching and it can be mentally draining over long term. There is a good reason why some developers go as far as to block all notifications while they work and take care their working space does not have unnecessary distractions available. I have found it useful to enjoy music while focusing on a task and there seems to be differences in what music works and what doesn't. That might have something to do with personal taste.

## How typography fits the world of friction

Most of these frictions have a common denominator in the form of typography as so far it is difficult to avoid using some form of an editor that is displaying information in the form of glyphs that are rendered through a typeface. Interestingly enough, most widely used development tools come often with a decent default, although it is worth experimenting with available options. It is one of those things that you do not typically pay attention to, but which may be worth optimizing to reduce friction and therefore to experience a notch less drain due to this type of mental work.

When looking for good typefaces to test, it is good to consider several factors. Pay attention to small details, such as how easy it is to distinguish characters "1", "l", "I", or even "O" and "0". You might notice that it is not always so easy! Features, such as ligatures can compress common patterns into easy to parse glyphs, although for some developers code makes more sense with the feature disabled. You may also notice that font width can make a difference as wider baseline allows designers to make more generous designs for letters, such as "m". We have addressed these very points in [our typeface called MonoLisa that is free to try!](https://monolisa.dev/)

## Conclusion

Development is a world of friction when you think about it. That is not to say friction is not good, or even needed sometimes, especially when designing user interfaces when you want users to think carefully about what they are doing. But for developers friction tends to add up and simply make the work more stressful than it has to be. It is worth considering how you can reduce friction in your work and I hope this brief post gave you new insight on the topic.
