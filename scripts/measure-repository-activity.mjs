#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const outputPath = process.argv[2] || "01_ideas/comparison_repository_activity.json";

const repositories = {
  "jetbrains-mono": {
    label: "JetBrains Mono",
    repo: "JetBrains/JetBrainsMono",
  },
  "fira-code": {
    label: "Fira Code",
    repo: "tonsky/FiraCode",
  },
  "cascadia-code": {
    label: "Cascadia Code",
    repo: "microsoft/cascadia-code",
  },
  hack: {
    label: "Hack",
    repo: "source-foundry/Hack",
  },
  "source-code-pro": {
    label: "Source Code Pro",
    repo: "adobe-fonts/source-code-pro",
  },
  "ibm-plex-mono": {
    label: "IBM Plex Mono",
    repo: "IBM/plex",
  },
  monaspace: {
    label: "Monaspace",
    repo: "githubnext/monaspace",
  },
  "recursive-mono": {
    label: "Recursive Mono",
    repo: "arrowtype/recursive",
  },
};

const results = {
  generated: new Date().toISOString().slice(0, 10),
  methodology:
    "GitHub REST API. Release cadence uses non-draft, non-prerelease GitHub releases from the first results page. Open issues use search query is:issue is:open. Close speed is median days from created_at to closed_at for up to 100 recently updated closed issues, excluding pull requests.",
  repositories: {},
};

for (const [key, item] of Object.entries(repositories)) {
  const releases = fetchJson(
    `https://api.github.com/repos/${item.repo}/releases?per_page=100`,
  ).filter((release) => !release.draft && !release.prerelease && release.published_at);
  const releaseDates = releases
    .map((release) => new Date(release.published_at))
    .filter((date) => !Number.isNaN(date.valueOf()))
    .sort((a, b) => a - b);

  const latestRelease = releaseDates.at(-1) || null;
  const firstRelease = releaseDates[0] || null;
  const releaseSpanYears =
    firstRelease && latestRelease
      ? Math.max((latestRelease - firstRelease) / (1000 * 60 * 60 * 24 * 365.25), 0)
      : null;
  const releasesPerYear =
    releaseSpanYears && releaseSpanYears > 0
      ? round(releaseDates.length / releaseSpanYears, 2)
      : releaseDates.length || null;

  const openIssues = fetchJson(
    `https://api.github.com/search/issues?q=${encodeURIComponent(`repo:${item.repo} is:issue is:open`)}`,
  );

  const closedIssues = fetchJson(
    `https://api.github.com/repos/${item.repo}/issues?state=closed&sort=updated&direction=desc&per_page=100`,
  ).filter((issue) => !issue.pull_request && issue.closed_at);

  const closeDurations = closedIssues
    .map((issue) => {
      const created = new Date(issue.created_at);
      const closed = new Date(issue.closed_at);
      return (closed - created) / (1000 * 60 * 60 * 24);
    })
    .filter((days) => Number.isFinite(days) && days >= 0)
    .sort((a, b) => a - b);

  results.repositories[key] = {
    label: item.label,
    repository: `https://github.com/${item.repo}`,
    releaseCount: releaseDates.length,
    firstRelease: formatDate(firstRelease),
    latestRelease: formatDate(latestRelease),
    releasesPerYear,
    daysSinceLatestRelease: latestRelease ? daysSince(latestRelease) : null,
    openIssues: openIssues.total_count ?? null,
    recentClosedIssuesSample: closeDurations.length,
    medianDaysToCloseRecentIssues: median(closeDurations),
  };
}

mkdirSync(path.dirname(path.resolve(root, outputPath)), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`);
console.log(outputPath);

for (const [key, item] of Object.entries(results.repositories)) {
  console.log(
    `${key}: ${item.releaseCount} releases, ${item.releasesPerYear}/year, ` +
      `${item.openIssues} open issues, median close ${item.medianDaysToCloseRecentIssues} days`,
  );
}

function fetchJson(url) {
  const result = spawnSync("curl", ["-fsS", "-H", "Accept: application/vnd.github+json", url], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
  });

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `Could not fetch ${url}`);
  }

  return JSON.parse(result.stdout);
}

function formatDate(date) {
  return date ? date.toISOString().slice(0, 10) : null;
}

function daysSince(date) {
  return Math.floor((Date.now() - date.valueOf()) / (1000 * 60 * 60 * 24));
}

function median(values) {
  if (!values.length) return null;
  const mid = Math.floor(values.length / 2);
  const value =
    values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
  return round(value, 1);
}

function round(value, digits) {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}
