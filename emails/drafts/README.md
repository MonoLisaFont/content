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
