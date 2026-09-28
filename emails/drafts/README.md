# Planned emails

Write one Markdown file per planned message here. Add these fields to its front
matter so `scripts/markdown-email-to-html.mjs` tags every MonoLisa website link
in the generated HTML:

```yaml
utm_source: monolisa
utm_medium: email
utm_campaign: campaign-name
utm_content: message-name
```

Use the actual sending source for `utm_source` when known. Keep campaign values
as lowercase words separated by hyphens. The renderer preserves existing query
parameters and anchors and leaves external links alone. Review the generated
HTML before sending. Move the source Markdown to `emails/sent/` after delivery;
this does not change links in a message that has already been sent.

Standalone `![alt text](https://...)` lines render as full-width email images.
Use public HTTPS image URLs and descriptive alt text. Generate a preview with
`node scripts/markdown-email-to-html.mjs emails/drafts/<name>.md`.

For MailRelay, end each draft with the exact line
`<p><a href="{{ unsubscribe_url }}">Unsubscribe</a></p>`. The renderer preserves
the token in the HTML for MailRelay to replace when sending.

Pushes to `main` publish each draft as a JSON preview payload in Vercel Blob.
Colleagues can open `https://www.monolisa.dev/mail-previews/<name>` to review
the subject, preheader, and rendered email. The preview is public and marked
`noindex`; anyone with the URL can view it. The automatic publisher removes
the preview Blob after its Markdown source leaves `emails/drafts/`.
