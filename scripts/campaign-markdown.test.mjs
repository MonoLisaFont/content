import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { tagDevToMarkdownLinks } from "./campaign-markdown.mjs";
import { buildEmailPreviewPayload } from "./markdown-email-to-html.mjs";

const execFileAsync = promisify(execFile);

test("DEV copy tags website links while preserving media, code and canonical source", () => {
  const input = `[Trial](https://www.monolisa.dev/buy/trial?plan=code&utm_source=old#details)
<a href="https://monolisa.dev/tester">Tester</a>
![Preview](https://www.monolisa.dev/media/preview.png)
[External](https://example.com/) and [DEV](https://dev.to/monolisa/post)
\`[Code](https://monolisa.dev/)\`
\`\`\`md
[Fenced](https://monolisa.dev/)
\`\`\``;
  const result = tagDevToMarkdownLinks(input, "font_post");
  assert.match(result, /plan=code&utm_source=devto&utm_medium=syndication&utm_campaign=blog-syndication&utm_content=font-post#details/);
  assert.match(result, /href="https:\/\/monolisa.dev\/tester\?utm_source=devto&amp;utm_medium=syndication/);
  assert.match(result, /!\[Preview\]\(https:\/\/www.monolisa.dev\/media\/preview.png\)/);
  assert.match(result, /\[External\]\(https:\/\/example.com\/\)/);
  assert.match(result, /\[DEV\]\(https:\/\/dev.to\/monolisa\/post\)/);
  assert.match(result, /\`\[Code\]\(https:\/\/monolisa.dev\/\)\`/);
  assert.match(result, /\[Fenced\]\(https:\/\/monolisa.dev\/\)/);
  assert.equal(tagDevToMarkdownLinks(result, "font_post"), result);
});

test("email renderer tags website links in output only", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "monolisa-email-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const source = join(directory, "launch.md");
  const output = join(directory, "launch.html");
  const markdown = `---
title: Launch notes & updates
utm_source: monolisa
utm_medium: email
utm_campaign: v3-release
utm_content: earlier-buyers
---

[Read](https://monolisa.dev/posts/monolisa_v3/?view=full#features) and [External](https://example.com/).

![The coding panel](https://www.monolisa.dev/media/images/monolisa-vscode-coding-font.png)

<p><a href="{{ unsubscribe_url }}">Unsubscribe</a></p>
`;
  await writeFile(source, markdown);
  await execFileAsync(process.execPath, ["scripts/markdown-email-to-html.mjs", source, output]);
  const html = await readFile(output, "utf8");
  assert.match(html, /<title>Launch notes &amp; updates<\/title>/);
  assert.match(html, /view=full&amp;utm_source=monolisa&amp;utm_medium=email&amp;utm_campaign=v3-release&amp;utm_content=earlier-buyers#features/);
  assert.match(html, /href="https:\/\/example.com\/"/);
  assert.match(html, /<img src="https:\/\/www.monolisa.dev\/media\/images\/monolisa-vscode-coding-font.png" alt="The coding panel" width="640"/);
  assert.doesNotMatch(html, /src="[^"]*utm_source/);
  assert.match(html, /<p><a href="\{\{ unsubscribe_url \}\}">Unsubscribe<\/a><\/p>/);
  assert.doesNotMatch(html, /&lt;p&gt;&lt;a href=/);
  assert.equal(await readFile(source, "utf8"), markdown);
});

test("email preview payload carries reviewed metadata and the send-ready HTML", () => {
  const markdown = `---
title: Internal working title
subject: A VS Code update
preheader: A live preview for the font
utm_source: monolisa
utm_medium: email
utm_campaign: post-v3-update
utm_content: vscode-and-blog
---

[Read more](https://www.monolisa.dev/posts/example)
`;
  const payload = buildEmailPreviewPayload(markdown, "emails/drafts/example.md");
  assert.equal(payload.schemaVersion, 1);
  assert.equal(payload.title, "Internal working title");
  assert.match(payload.html, /<title>Internal working title<\/title>/);
  assert.equal(payload.subject, "A VS Code update");
  assert.equal(payload.preheader, "A live preview for the font");
  assert.match(payload.html, /utm_source=monolisa&amp;utm_medium=email/);
  assert.throws(
    () => buildEmailPreviewPayload(markdown.replace("preheader: A live preview for the font\n", ""), "emails/drafts/example.md"),
    /subject and preheader/,
  );
});
