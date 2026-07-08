#!/usr/bin/env node

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const svgPath = path.resolve(root, "images/comparison-monolisa-vs-fira-code-summary.svg");
const chromiumPath = "/Applications/Chromium.app/Contents/MacOS/Chromium";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function escHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const svg = readFileSync(svgPath, "utf8");
const tempDir = mkdtempSync(path.join(tmpdir(), "comparison-summary-"));
const htmlPath = path.join(tempDir, "validate.html");

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        margin: 0;
        color: #111;
      }
      svg {
        display: block;
        width: 1150px;
        height: 1050px;
      }
    </style>
  </head>
  <body>
    <img src="file://${svgPath}" alt="">
    ${svg}
    <script>
      function boxFor(el, svgBox) {
        const box = el.getBoundingClientRect();
        return {
          text: el.textContent.trim(),
          chip: Boolean(el.closest(".chip-box")),
          x: box.x - svgBox.x,
          y: box.y - svgBox.y,
          width: box.width,
          height: box.height,
          right: box.right - svgBox.x,
          bottom: box.bottom - svgBox.y
        };
      }

      function intersects(a, b) {
        const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.x, b.x));
        const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y));
        return x * y > 8;
      }

      window.addEventListener("load", () => {
        const svg = document.querySelector("svg");
        const image = document.querySelector("img");
        const svgBox = svg.getBoundingClientRect();
        const imageBox = image.getBoundingClientRect();
        const texts = [...document.querySelectorAll("text")]
          .filter((el) => el.getClientRects().length > 0)
          .map((el) => boxFor(el, svgBox));

        const outOfBounds = texts.filter((box) =>
          box.x < -1 ||
          box.y < -1 ||
          box.right > svgBox.width + 1 ||
          box.bottom > svgBox.height + 1
        );

        const overlaps = [];
        for (let i = 0; i < texts.length; i += 1) {
          for (let j = i + 1; j < texts.length; j += 1) {
            if (texts[i].chip && texts[j].chip) continue;
            if (intersects(texts[i], texts[j])) {
              overlaps.push([texts[i].text, texts[j].text]);
            }
          }
        }

        document.body.textContent = JSON.stringify({
          textCount: texts.length,
          outOfBounds,
          overlaps,
          image: {
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            width: imageBox.width,
            height: imageBox.height
          },
          viewport: { width: svgBox.width, height: svgBox.height }
        });
      });
    </script>
  </body>
</html>`;

writeFileSync(htmlPath, html);

try {
  const result = spawnSync(
    chromiumPath,
    [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--dump-dom",
      `file://${htmlPath}`,
    ],
    { encoding: "utf8" },
  );

  if (result.status !== 0) {
    fail(result.stderr || "Chromium layout validation failed");
  }

  const jsonMatch = result.stdout.match(/<body>(.*?)<\/body>/s);
  if (!jsonMatch) fail("Could not read validation output from Chromium");

  const report = JSON.parse(jsonMatch[1]);
  if (
    report.image.naturalWidth !== 1150 ||
    report.image.naturalHeight !== 1050 ||
    report.outOfBounds.length ||
    report.overlaps.length
  ) {
    console.error(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  console.log(`Layout ok: ${report.textCount} text nodes inside ${report.viewport.width}x${report.viewport.height}; image intrinsic ${report.image.naturalWidth}x${report.image.naturalHeight}`);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
