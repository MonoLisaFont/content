# MonoLisa - Content

This repository contains content to publish through the blog and dev.to. It has been structured as follows:

* `01_ideas` contains content ideas with a brief description of what the post might be about. This is ideal for ideation and initial research. There's a basic template to copy to serve as a starting point for new ideas that eventually become posts.
* `02_drafts` is where drafting posts is done. In other words, this is where most of the work happens until a post is published by moving it to the `03_posts` directory. Each post follows Markdown format with a YAML headmatter to declare metadata related to it (i.e., `published`, `keywords` etc.).
* `03_posts` contains published content. The website picks this up automatically and the content has to be published separately to dev.to while using a canonical link pointing to the website to gain SEO benefits.
* `images` contains images included to the posts. Ideally these should be optimized already since there are no guarantees that publishing platforms (website, dev.to) would do it for you. [Kraken](https://kraken.io/web-interface) is a good option for web-based optimization.

## Post schema

For published posts, the name of the file should be constructed as follows: `<number>-<slug>.md` where `number` is for example `004`, so the posts are ordered easily, and `slug` is the url slug you want to see on the website. The slug should be short but not too short while not being too long. Around 10-20 characters is a good length for a slug.

The posts should look like this:

```markdown
---
title: "My awesome post about some font feature"
published: 2024-10-18
updated: 2024-10-25
keywords: ["typefaces"]
authors: ["Muster Mann"]
---

Brief introduction to the topic that pulls the reader in should go here. It should give a promise of what is to come and generate interest.

## First point

This is where content should go.

![This is some image caption](/images/demo.png)

## Second point

More content goes here.

## Conclusion

This is the point where to recap the main point and potentially do a call to action and the a link follows this sentence as an example: [more information can be found at MonoLisa website](https://monolisa.dev).
```

For simple posts, only heading level 2 should be used as in the sample. A good length for a short post can be anywhere between 500 to 2000 words. The main point is to use clear headings to give the post a clear structure and to make it easy to scan.

## Editing

Most of the edits can be done directly through GitHub user interface on web. It may be possible images may have to be added through Git repository, though.
