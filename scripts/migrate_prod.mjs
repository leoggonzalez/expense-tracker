import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

function parseDotenv(contents) {
  const values = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function loadDotenvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  return parseDotenv(readFileSync(filePath, "utf8"));
}

const repoRoot = process.cwd();
const dotenvValues = loadDotenvFile(path.join(repoRoot, ".env"));

for (const [key, value] of Object.entries(dotenvValues)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

process.env.DATABASE_URL =
  process.env.DATABASE_URL_PROD ?? process.env.DATABASE_URL;
process.env.DIRECT_URL = process.env.DIRECT_URL_PROD ?? process.env.DIRECT_URL;

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL_PROD or DATABASE_URL for production migration.");
  process.exit(1);
}

if (!process.env.DIRECT_URL) {
  console.error("Missing DIRECT_URL_PROD or DIRECT_URL for production migration.");
  process.exit(1);
}

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["prisma", "migrate", "deploy"],
  {
    stdio: "inherit",
    env: process.env,
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);
