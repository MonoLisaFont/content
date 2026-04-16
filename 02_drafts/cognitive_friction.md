---
title: "Cognitive friction in development"
published: 2026-04-01
updated: 2026-04-01
keywords: ["productivity"]
authors: ["Juho Vepsäläinen"]
---

Cognitive friction is literally friction related to understanding. Perhaps the easiest example of this is looking at text written in a language you don't know well. Even if you know the language, it can take a while to understand the meaning. That's cognitive friction in action. In this post, I look at the topic from a developer's perspective, how we encounter it in practice, and what to do about it.

## Sources of cognitive friction for developers

One controversial aspect of software development has to do with naming. My personal take on this is that the accuracy of naming should depend on scope and the more abstract your code, the more abstract your naming can be. You can see this well in algorithmic code that is close to pure mathematics as there you care specifically about abstract concepts. When you write code that is close to a specific domain, then naming tends to get more accurate as well. You encounter friction when there is a mismatch between the abstraction level of your code and its naming. Therefore simply thinking about how to name your things can make a difference especially long term since it can have impact on maintenance and allow you to find what you want in the codebase later on easily.

Cognitive friction is not only about naming. It is also about code structure. The more code jumps around, the harder it is to follow in general. This concept is modeled by [McCabe's cyclomatic complexity](https://en.wikipedia.org/wiki/Cyclomatic_complexity), and you can find many tools that allow you to measure this. It is worth considering your code complexity as there are times when abstraction has gone too far and inlining piece of code is better. Of course there are tradeoffs to be made since performance sensitive code might sacrifice other qualities of code for the sake of speed. This is one reason why it is important to benchmark your code to understand if it still fulfills different quality criteria and not look at code complexity alone.

As a developer, you can feel when the problem you are dealing with fits your programming paradigm and vice versa. If you are trying to solve a problem with a paradigm that doesn't fit it well, you can literally feel the friction. You can note this when using frameworks as well since they encode opinions, and once you go against those opinions, you will have to work a lot. In general, it seems to be a good idea to consider your options and occasionally going mixed paradigm can be an option. That said, there seems to be some tendency to for code to go towards declarative solutions over time as problems are well understood. This seems to be particularly true for web technologies.

## How to address cognitive friction

There are several ways how you can address cognitive friction in development and perhaps the easiest one of them is to consider your naming. You can have specific rules around naming, for example use nouns for objects and verbs for actions. Consider what state you include to function parameters and how you name it. Simply calling everything `data` is not a good idea in general, and you can do better than this.

There are better and worse ways to write logic. In general, it makes sense to flatten nested logic, escape early, and use simple guards for your code. An old programming language called Eiffel implements [design by contract](https://en.wikipedia.org/wiki/Design_by_contract), which is a refreshing way to handle your invariants since it opens way towards [property-based testing](https://en.wikipedia.org/wiki/Software_testing#Property_testing) as there you generate tests based on your invariants to discover gaps in your implementation.

The good thing about cognitive friction is that we literally have many tools around static analysis that you can use as a part of your code reviews to track the shape of your codebase. Some complexity is usually unavoidable, but it is valuable to understand where it exists. A related check would be to keep track of which locations of the codebase receive most changes since those can be considered hotspots that should be designed particularly well.

When delivering features, consider adding a quality gate related to code complexity. This can be a good idea especially if you use agentic development flow as then the tools can try to keep code complexity low, and they seem to be eager to follow any constraints you give them.

## Conclusion

Cognitive friction is definitely a big one for software developers since it is at the core of development efforts. It is a difficult one to solve entirely, but I hope this post gave you some idea on where to look. You can [learn more about the sources of friction in software development from the anchor post of this series](../friction_in_software_development).
