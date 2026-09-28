---
title: A note on what we've been working on since MonoLisa 3
subject: VS Code plugin for MonoLisa + recent work
preheader: Configuring MonoLisa for VS Code became easy
target: People on the mailing list
purpose: Share the VS Code extension and introduce the friction series
utm_source: monolisa
utm_medium: email
utm_campaign: post-v3-update
utm_content: vscode-and-blog
---

Hi,

It has been a while since [version 3 of the typeface was published](https://www.monolisa.dev/posts/monolisa_v3), and we've been working on both the typeface and what surrounds it.
Perhaps the largest single improvement we have made has had to do with the way you configure the typeface in the form of a VS Code plugin.

## MonoLisa for VS Code

While VS Code provides strong support for OpenType features, configuring it has required working with JSON and a lot of tweaking.
To address the difficulty, we published a plugin for the task that gives you live code preview while it generates configuration for VS Code.
Besides making configuration easy, we included two of the color themes available on the site with a great degree of customization.
The screenshots below highlight these features.

![MonoLisa for VS Code coding-font controls beside a live JavaScript preview](https://www.monolisa.dev/media/images/monolisa-vscode-coding-font.png)

![MonoLisa for VS Code theme choices and palette controls](https://www.monolisa.dev/media/images/monolisa-vscode-themes.png)

To understand the plugin better, [read the VS Code walkthrough](https://www.monolisa.dev/posts/introducing_monolisa_for_vscode) or [install the extension from the Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=MonoLisa.monolisa-for-vscode) or from [OpenVSX](https://open-vsx.org/extension/monolisa/monolisa-for-vscode).
If you have specific ideas for improving the plugin, [drop us feedback](https://github.com/MonoLisaFont/feedback/issues).

## From the blog

Besides the plugin, there's [a series on friction in software development](https://www.monolisa.dev/posts/friction_in_software_development) examining sources of friction in everyday work, and it turns out there are quite a few. While the topic of course touches on typefaces, the scope is far larger than that.

Alongside the series, we've published practical comparisons with [Fira Code](https://www.monolisa.dev/posts/monolisa_vs_fira_code) and [Monaspace](https://www.monolisa.dev/posts/monolisa_vs_monaspace) so you can inspect the differences in actual code specimens.
This type of work is useful in the sense that it allows us to understand how MonoLisa relates to other typefaces out there, as there are often differences you might not be aware of.
It turns out there's a lot of subtlety in font design and many details that are easy to miss.

--
Andrey, Juho, and Marcus

PS. We are working on the first patch release of v3 and likely the next post will be exactly about that.
