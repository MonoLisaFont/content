import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import dotenv from "dotenv";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function requireValue(value, name) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function redactSecret(value, secret) {
  return String(value).split(secret).join("[REDACTED]");
}

export function getWebsiteRevalidationConfig(env = process.env) {
  return {
    url: requireValue(
      env.WEBSITE_REVALIDATION_URL,
      "WEBSITE_REVALIDATION_URL",
    ),
    secret: requireValue(
      env.WEBSITE_REVALIDATION_SECRET,
      "WEBSITE_REVALIDATION_SECRET",
    ),
  };
}

export async function revalidateWebsitePathname(
  pathname,
  { url, secret, fetchImpl = fetch },
) {
  requireValue(pathname, "pathname");
  requireValue(url, "WEBSITE_REVALIDATION_URL");
  requireValue(secret, "WEBSITE_REVALIDATION_SECRET");

  let response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      redirect: "manual",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pathname }),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : error;
    throw new Error(
      `Website revalidation request failed: ${redactSecret(detail, secret)}`,
    );
  }

  if (response.status < 200 || response.status >= 300) {
    let responseBody;
    try {
      responseBody = await response.text();
    } catch {
      responseBody = "<unable to read response body>";
    }
    throw new Error(
      `Website revalidation failed with status ${response.status}: ${redactSecret(responseBody, secret)}`,
    );
  }

  return response;
}

export function parseWebsiteRevalidationArgs(argv) {
  let pathname;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--pathname") pathname = argv[++i];
    else throw new Error(`Unexpected argument: ${argv[i]}`);
  }
  return { pathname: requireValue(pathname, "--pathname") };
}

export async function runWebsiteRevalidation(
  argv = process.argv.slice(2),
  env = process.env,
  {
    fetchImpl = fetch,
    logger = console,
    revalidateWebsiteImpl = revalidateWebsitePathname,
  } = {},
) {
  const { pathname } = parseWebsiteRevalidationArgs(argv);
  const { url, secret } = getWebsiteRevalidationConfig(env);

  await revalidateWebsiteImpl(pathname, { url, secret, fetchImpl });
  logger.log(`Revalidated website caches for ${pathname}.`);
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  dotenv.config({ path: resolve(root, ".env.private"), quiet: true });
  runWebsiteRevalidation().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
