import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const iconsDir = path.join(repoRoot, "src/elements/icon/icons");
const assetsFile = path.join(repoRoot, "src/elements/icon/icon_assets.ts");

function printUsageAndExit() {
  console.error('Usage: yarn add-icon "icon-name" "<svg>...</svg>"');
  process.exit(1);
}

function validateName(name) {
  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new Error(
      "Icon name must use lowercase letters, numbers, and hyphens only.",
    );
  }
}

async function main() {
  const [, , rawName, rawSvg] = process.argv;

  if (!rawName || !rawSvg) {
    printUsageAndExit();
  }

  validateName(rawName);

  await mkdir(iconsDir, { recursive: true });

  const iconFilePath = path.join(iconsDir, `${rawName}.svg`);
  await writeFile(iconFilePath, `${rawSvg.trim()}\n`, "utf8");

  const currentAssets = await readFile(assetsFile, "utf8");
  const assetEntry = `  "${rawName}": new URL("./icons/${rawName}.svg", import.meta.url).toString(),`;

  if (currentAssets.includes(`"./icons/${rawName}.svg"`)) {
    console.log(`Updated ${iconFilePath}`);
    return;
  }

  const marker = "} as const;";
  const updatedAssets = currentAssets.replace(marker, `${assetEntry}\n${marker}`);

  if (updatedAssets === currentAssets) {
    throw new Error("Could not update icon asset registry.");
  }

  await writeFile(assetsFile, updatedAssets, "utf8");

  console.log(`Added icon "${rawName}"`);
  console.log(`- SVG: ${iconFilePath}`);
  console.log(`- Registry: ${assetsFile}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
