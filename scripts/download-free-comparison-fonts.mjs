#!/usr/bin/env node

import { createWriteStream, existsSync, mkdirSync, readdirSync, copyFileSync, rmSync } from "node:fs";
import { get } from "node:https";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const tmpRoot = path.join(root, ".font-sources", ".downloads");

const packages = [
  {
    key: "jetbrains-mono",
    url: "https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip",
    files: [
      [/JetBrainsMono-Regular\.ttf$/, "JetBrainsMono-Regular.ttf"],
      [/JetBrainsMono-Italic\.ttf$/, "JetBrainsMono-Italic.ttf"],
      [/OFL\.txt$/i, "LICENSE-OFL.txt"],
    ],
  },
  {
    key: "fira-code",
    url: "https://github.com/tonsky/FiraCode/releases/download/6.2/Fira_Code_v6.2.zip",
    files: [
      [/FiraCode-Regular\.ttf$/, "FiraCode-Regular.ttf"],
      [/OFL\.txt$/i, "LICENSE-OFL.txt"],
    ],
  },
  {
    key: "cascadia-code",
    url: "https://github.com/microsoft/cascadia-code/releases/download/v2407.24/CascadiaCode-2407.24.zip",
    files: [
      [/CascadiaCode\.ttf$/, "CascadiaCode.ttf"],
      [/CascadiaCodeItalic\.ttf$/, "CascadiaCodeItalic.ttf"],
      [/OFL\.txt$/i, "LICENSE-OFL.txt"],
    ],
  },
  {
    key: "hack",
    url: "https://github.com/source-foundry/Hack/releases/download/v3.003/Hack-v3.003-ttf.zip",
    files: [
      [/Hack-Regular\.ttf$/, "Hack-Regular.ttf"],
      [/Hack-Italic\.ttf$/, "Hack-Italic.ttf"],
      [/LICENSE\.md$/i, "LICENSE.md"],
    ],
  },
  {
    key: "source-code-pro",
    url: "https://github.com/adobe-fonts/source-code-pro/releases/download/2.042R-u/1.062R-i/1.026R-vf/TTF-source-code-pro-2.042R-u_1.062R-i.zip",
    files: [
      [/SourceCodePro-Regular\.ttf$/, "SourceCodePro-Regular.ttf"],
      [/SourceCodePro-It\.ttf$/, "SourceCodePro-It.ttf"],
      [/LICENSE\.md$/i, "LICENSE.md"],
    ],
  },
  {
    key: "monaspace",
    url: "https://github.com/githubnext/monaspace/releases/download/v1.400/monaspace-static-v1.400.zip",
    files: [
      [/MonaspaceNeon-Regular\.otf$/, "MonaspaceNeon-Regular.otf"],
      [/MonaspaceNeon-Italic\.otf$/, "MonaspaceNeon-Italic.otf"],
      [/OFL\.txt$/i, "LICENSE-OFL.txt"],
    ],
  },
  {
    key: "recursive-mono",
    url: "https://github.com/arrowtype/recursive/releases/download/v1.085/ArrowType-Recursive-1.085.zip",
    files: [
      [/RecMonoLinear-Regular-[\d.]+\.ttf$/, "RecMonoLinear-Regular.ttf"],
      [/RecMonoLinear-Italic-[\d.]+\.ttf$/, "RecMonoLinear-Italic.ttf"],
      [/LICENSE\.txt$/i, "LICENSE-OFL.txt"],
    ],
  },
];

const rawFiles = [
  {
    key: "ibm-plex-mono",
    url: "https://raw.githubusercontent.com/IBM/plex/master/packages/plex-mono/fonts/complete/ttf/IBMPlexMono-Regular.ttf",
    output: "IBMPlexMono-Regular.ttf",
  },
  {
    key: "ibm-plex-mono",
    url: "https://raw.githubusercontent.com/IBM/plex/master/packages/plex-mono/fonts/complete/ttf/IBMPlexMono-Italic.ttf",
    output: "IBMPlexMono-Italic.ttf",
  },
  {
    key: "ibm-plex-mono",
    url: "https://raw.githubusercontent.com/IBM/plex/master/packages/plex-mono/fonts/complete/ttf/license.txt",
    output: "LICENSE-OFL.txt",
  },
  {
    key: "fira-code",
    url: "https://raw.githubusercontent.com/tonsky/FiraCode/master/LICENSE",
    output: "LICENSE-OFL.txt",
  },
  {
    key: "cascadia-code",
    url: "https://raw.githubusercontent.com/microsoft/cascadia-code/main/LICENSE",
    output: "LICENSE-OFL.txt",
  },
  {
    key: "hack",
    url: "https://raw.githubusercontent.com/source-foundry/Hack/master/LICENSE.md",
    output: "LICENSE.md",
  },
  {
    key: "source-code-pro",
    url: "https://raw.githubusercontent.com/adobe-fonts/source-code-pro/main/LICENSE.md",
    output: "LICENSE.md",
  },
  {
    key: "monaspace",
    url: "https://raw.githubusercontent.com/githubnext/monaspace/main/LICENSE",
    output: "LICENSE-OFL.txt",
  },
  {
    key: "recursive-mono",
    url: "https://raw.githubusercontent.com/arrowtype/recursive/main/OFL.txt",
    output: "LICENSE-OFL.txt",
  },
];

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function download(url, outputPath) {
  return new Promise((resolve, reject) => {
    ensureDir(path.dirname(outputPath));
    const file = createWriteStream(outputPath);

    function request(currentUrl, redirects = 0) {
      get(currentUrl, { headers: { "User-Agent": "monolisa-content-font-downloader" } }, (response) => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode || 0)) {
          if (redirects > 5) {
            reject(new Error(`Too many redirects for ${url}`));
            return;
          }
          request(new URL(response.headers.location, currentUrl).toString(), redirects + 1);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          return;
        }

        response.pipe(file);
        file.on("finish", () => {
          file.close(resolve);
        });
      }).on("error", reject);
    }

    request(url);
  });
}

function unpack(archivePath, outputDir) {
  ensureDir(outputDir);
  const result = spawnSync("unzip", ["-q", archivePath, "-d", outputDir], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || `Could not unzip ${archivePath}`);
  }
}

function walk(dir) {
  const entries = [];
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) entries.push(...walk(fullPath));
    else entries.push(fullPath);
  }
  return entries;
}

function copyMatches(extractDir, targetDir, matchers) {
  const files = walk(extractDir);
  for (const [pattern, outputName] of matchers) {
    const match = files.find((file) => pattern.test(file));
    if (!match) {
      console.warn(`  missing ${outputName}`);
      continue;
    }
    copyFileSync(match, path.join(targetDir, outputName));
    console.log(`  ${path.relative(root, path.join(targetDir, outputName))}`);
  }
}

async function main() {
  ensureDir(tmpRoot);

  for (const item of packages) {
    const targetDir = path.join(root, ".font-sources", item.key);
    const archivePath = path.join(tmpRoot, `${item.key}.zip`);
    const extractDir = path.join(tmpRoot, item.key);

    rmSync(extractDir, { recursive: true, force: true });
    ensureDir(targetDir);

    console.log(`Downloading ${item.key}`);
    await download(item.url, archivePath);
    unpack(archivePath, extractDir);
    copyMatches(extractDir, targetDir, item.files);
  }

  for (const item of rawFiles) {
    const targetDir = path.join(root, ".font-sources", item.key);
    ensureDir(targetDir);
    const outputPath = path.join(targetDir, item.output);
    console.log(`Downloading ${item.key}/${item.output}`);
    await download(item.url, outputPath);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
