# Comparison social cards

Landscape comparison graphics for social posts, designed primarily for X.

- Format: PNG
- Dimensions: 1600 × 900 px (16:9)
- Color space: RGB
- Naming: `comparison-monolisa-vs-{font}-x-1600x900.png`
- Generator: `scripts/render-comparison-social-cards.mjs`
- FaceType logo source: `scripts/assets/facetype-mobile-logo.svg`

Regenerate every supported comparison from the repository root:

```bash
node scripts/render-comparison-social-cards.mjs
```

Render selected comparisons by passing their keys:

```bash
node scripts/render-comparison-social-cards.mjs fira-code jetbrains-mono
```

The PNGs are publishing assets and are not referenced by the blog posts. X accepts PNG uploads up to 5 MB and displays single images with aspect ratios between 2:1 and 3:4 in full; these 16:9 cards sit within that range.
