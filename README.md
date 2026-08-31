# MonoLisa - Content

This repository contains content to publish through the blog and dev.to. It has been structured as follows:

- `01_ideas` contains content ideas with a brief description of what the post might be about. This is ideal for ideation and initial research. There's a basic template to copy to serve as a starting point for new ideas that eventually become posts.
- `02_drafts` is where drafting posts is done. In other words, this is where most of the work happens until a post is published by moving it to the `03_posts` directory. Each post follows Markdown format with a YAML headmatter to declare metadata related to it (i.e., `published`, `keywords` etc.).
- `03_posts` contains published content. The website picks this up automatically and the content has to be published separately to dev.to while using a canonical link pointing to the website to gain SEO benefits.
- `images` contains images included to the posts. Ideally these should be optimized already since there are no guarantees that publishing platforms (website, dev.to) would do it for you. [Kraken](https://kraken.io/web-interface) is a good option for web-based optimization.

## Post schema

For published posts, use `<slug>.md`; the filename becomes the URL slug on the
website. Existing posts use short `snake_case` slugs such as
`what_are_serifs.md`.

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

## Publishing a draft

Preview a promotion without changing files or contacting external services:

```bash
npm run publish:draft -- 02_drafts/my-post.md --dry-run
```

Then publish it to the MonoLisa website:

```bash
npm run publish:draft -- 02_drafts/my-post.md
```

The command uses today's local calendar date for `published` and for `updated`
when that field is present, removes `draft` metadata, and moves the file to
`03_posts` without renaming it. It uploads the post and every referenced local
image to Vercel Blob, revalidates the website, and deletes and revalidates the
obsolete `drafts/<filename>` Blob object. It uses the same `.env.private` Blob
and website-revalidation credentials documented below.

To publish the same article to dev.to, configure these additional values:

```bash
DEVTO_API_KEY=...
DEVTO_SESSION_COOKIE="_dev_to_session=..."
MONOLISA_POST_BASE=https://www.monolisa.dev/posts
```

`DEVTO_SESSION_COOKIE` is needed when the post contains images. Copy the
`Cookie` request header from an already signed-in dev.to browser session into
the private environment file; do not commit or share it. The command fetches a
fresh CSRF token itself and verifies that the browser session belongs to the
same DEV account as `DEVTO_API_KEY`.

Then opt in with `--devto`:

```bash
npm run publish:draft -- 02_drafts/my-post.md --devto
```

DEV receives a canonical URL pointing to the MonoLisa post, but its image
copies are kept separate from MonoLisa's Blob storage. Raster images are
uploaded unchanged to DEV's image storage. Its uploader does not accept SVG,
so SVGs are converted in memory to PNG with `rsvg-convert` before upload. The
SVG remains unchanged in the repository and on Blob, and the generated PNG is
not written into `images/`.

Install [librsvg](https://gitlab.gnome.org/GNOME/librsvg) so
`rsvg-convert --version` works before publishing an SVG-bearing post. DEV does
not expose image upload through its API-key API, so this command uses the same
session-authenticated `/image_uploads` endpoint as DEV's editor. That endpoint
is internal and may change; an expired session fails with a prompt to refresh
`DEVTO_SESSION_COOKIE`.

By default, DEV tags are derived from the post keywords. Override them with
`--tags "fonts,typography"` (at most four), or use `--series "Series name"`.
The script stores the DEV article id and the successful DEV image URLs in the
ignored `.devto-state.json` file. Image entries are keyed by a content hash, so
retries reuse uploaded copies when the source has not changed. The script also
checks existing articles by canonical URL before creating one, which makes
retries update the same article.

All credentials are validated before the local move. Once the local promotion
succeeds, a later Blob or DEV failure is intentionally not rolled back. Run the
same command again: when the draft is absent and the matching file already
exists in `03_posts`, the script resumes the external publication without
changing its publication date. Use `--date YYYY-MM-DD` to select an explicit
date for a new promotion.

## Publishing drafts, posts, and FAQ to Vercel Blob

> [!WARNING]
> Drafts are public editorial content, not confidential material. Publishing a
> file from `02_drafts` uploads it to a publicly readable Blob URL.

Install dependencies once with `npm install`, then add the publishing
credentials to the ignored `.env.private` file:

```bash
BLOB_READ_WRITE_TOKEN=...
WEBSITE_REVALIDATION_URL=https://www.monolisa.dev/api/revalidate/blob
WEBSITE_REVALIDATION_SECRET=...
```

The revalidation URL is the full website endpoint, and the secret must match
the website's `REVALIDATION_SECRET`. All three variables are required for a
real publish. A dry run requires no credentials and makes no network requests.

### Automatic publishing from GitHub

Pushes to `main` automatically publish the current FAQ, drafts, posts, and
their referenced images when relevant content or publisher files change. The
workflow runs the test suite first, uploads the objects to Vercel Blob, and
then revalidates the corresponding website caches. Concurrent runs are
serialized so two commits cannot write and revalidate at the same time.

Configure these GitHub Actions repository secrets before enabling the workflow:

- `BLOB_READ_WRITE_TOKEN`
- `WEBSITE_REVALIDATION_URL`
- `WEBSITE_REVALIDATION_SECRET`

Use the same values as the local `.env.private` file. The workflow can also be
started manually from the repository's **Actions** tab; a manual run publishes
all current content. Publishing creates or updates objects but does not remove
Blob objects for deleted or renamed source files.

### Manual publishing

Publish every draft, post, and the FAQ with:

```bash
npm run publish:content -- --all
```

Images referenced by the selected Markdown files are uploaded before the
content. Both Markdown image syntax and HTML `img`/`source` elements are
supported. Image objects keep their repository paths, such as
`images/example.svg`. Publishing a post or the FAQ stops if a referenced local
image is missing; draft placeholder images produce warnings instead. After all
uploads finish, the publisher invalidates the corresponding website caches. It
omits image context so both published and draft cache variants are refreshed.

To create or update only selected objects, pass files or one of the content
directories instead:

```bash
npm run publish:content -- 02_drafts/my-draft.md
npm run publish:content -- 03_posts/my-post.md
npm run publish:content -- 02_drafts
npm run publish:content -- faq.md
```

Images can also be published directly, either individually or as a directory:

```bash
npm run publish:content -- images/example.svg
npm run publish:content -- images
```

Drafts are stored at `drafts/<filename>` and published posts at
`posts/<filename>`. The FAQ is stored at `faq.md`. These are stable public URLs;
an update can take up to a minute to propagate through Vercel Blob's cache. Use
`--dry-run` to inspect both the uploads and cache invalidation payloads without
contacting Vercel.

> [!WARNING]
> Publishing creates or overwrites objects; it does not delete old Blob paths.
> Moving or deleting a source file requires explicitly unpublishing the old
> object.

If website revalidation fails, the Blob uploads have already succeeded. Retry
only the safe final step for each pathname reported by the publisher:

```bash
npm run website:revalidate -- --pathname images/example.svg
```

## Publishing to dev.to

The friction series can be prepared for dev.to with:

```bash
node scripts/publish-friction-to-devto.mjs --dry-run --create-drafts --canonical-base https://monolisa.dev/posts
```

The command above is a dry run and does not call the dev.to API. To create unpublished dev.to drafts, add a private `.env.private` file:

```bash
DEVTO_API_KEY=...
```

Then run:

```bash
node scripts/publish-friction-to-devto.mjs --create-drafts --canonical-base https://monolisa.dev/posts
```

The script stores dev.to article ids and URLs in `.devto-friction-state.json`, which is ignored by Git. After draft creation, it updates the drafts once more so crosslinks inside the friction series point to the corresponding dev.to articles while `canonical_url` still points to the MonoLisa website.

After reviewing the drafts on dev.to, publish them with:

```bash
node scripts/publish-friction-to-devto.mjs --publish --canonical-base https://monolisa.dev/posts
```
