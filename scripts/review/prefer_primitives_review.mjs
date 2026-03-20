import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const inputPaths = process.argv.slice(2);

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function walk(targetPath) {
  const stat = fs.statSync(targetPath);

  if (stat.isFile()) {
    return [targetPath];
  }

  const entries = fs.readdirSync(targetPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next") {
      continue;
    }

    const entryPath = path.join(targetPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(entryPath));
      continue;
    }

    files.push(entryPath);
  }

  return files;
}

function getTargetFiles() {
  if (inputPaths.length > 0) {
    return inputPaths
      .map((targetPath) => path.resolve(projectRoot, targetPath))
      .filter((targetPath) => fs.existsSync(targetPath))
      .flatMap((targetPath) => walk(targetPath));
  }

  return walk(path.join(projectRoot, "src"));
}

function parseImports(tsxContent) {
  return {
    usesBox: /import\s+\{[^}]*\bBox\b[^}]*\}\s+from\s+"@\/elements"/.test(
      tsxContent,
    ),
    usesStack: /import\s+\{[^}]*\bStack\b[^}]*\}\s+from\s+"@\/elements"/.test(
      tsxContent,
    ),
    usesText: /import\s+\{[^}]*\bText\b[^}]*\}\s+from\s+"@\/elements"/.test(
      tsxContent,
    ),
  };
}

function getRelatedTsxPath(scssPath) {
  const directory = path.dirname(scssPath);
  const basename = path.basename(scssPath, ".scss");
  const tsxPath = path.join(directory, `${basename}.tsx`);

  return fs.existsSync(tsxPath) ? tsxPath : null;
}

function reviewPair(scssPath, tsxPath) {
  const scssContent = fs.readFileSync(scssPath, "utf8");
  const tsxContent = fs.readFileSync(tsxPath, "utf8");
  const imports = parseImports(tsxContent);
  const relativeScssPath = toPosixPath(path.relative(projectRoot, scssPath));
  const findings = [];

  if (
    /\bpadding(?:-(top|right|bottom|left|inline|block))?\s*:/.test(
      scssContent,
    ) &&
    !imports.usesBox
  ) {
    findings.push(
      `${relativeScssPath}: review whether padding/layout spacing can be expressed with Box instead of component-owned padding rules.`,
    );
  }

  if (
    /\bdisplay\s*:\s*(inline-)?flex\b/.test(scssContent) &&
    !imports.usesStack
  ) {
    findings.push(
      `${relativeScssPath}: review whether flex layout can be expressed with Stack instead of raw flex CSS.`,
    );
  }

  if (
    /\b(font-size|color)\s*:/.test(scssContent) &&
    !imports.usesText
  ) {
    findings.push(
      `${relativeScssPath}: review whether typography and text color can be expressed with Text instead of custom CSS rules.`,
    );
  }

  return findings;
}

const targetFiles = getTargetFiles();
const scssFiles = targetFiles.filter(
  (filePath) =>
    filePath.endsWith(".scss") &&
    /[/\\]src[/\\](components|app)[/\\]/.test(filePath),
);

const findings = [];

for (const scssPath of scssFiles) {
  const tsxPath = getRelatedTsxPath(scssPath);

  if (!tsxPath) {
    continue;
  }

  findings.push(...reviewPair(scssPath, tsxPath));
}

console.log("Prefer-primitives candidates:");

if (findings.length === 0) {
  console.log("- none");
} else {
  for (const finding of findings) {
    console.log(`- ${finding}`);
  }
}
