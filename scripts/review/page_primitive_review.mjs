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
      .flatMap((targetPath) => walk(targetPath))
      .filter((filePath) => filePath.endsWith(".tsx"));
  }

  return walk(path.join(projectRoot, "src/components")).filter((filePath) =>
    filePath.endsWith(".tsx"),
  );
}

function scoreFile(content, relativePath) {
  const reasons = [];
  let score = 0;
  const propsMatch = content.match(/type\s+\w+Props\s*=\s*\{([\s\S]*?)\n\};/);
  const propNames = propsMatch
    ? Array.from(propsMatch[1].matchAll(/^\s*([a-zA-Z0-9_]+)\??:/gm)).map(
        (match) => match[1],
      )
    : [];
  const nonWrapperProps = propNames.filter(
    (propName) =>
      !["children", "tone", "variant", "maxWidth", "className"].includes(propName),
  );

  if (content.includes('from "@/elements"')) {
    score += 1;
    reasons.push("imports shared layout primitives from @/elements");
  }

  if (/<(Card|Stack|Box|Grid)\b/.test(content)) {
    score += 2;
    reasons.push("renders mostly shared layout primitives");
  }

  if (/children\s*:/.test(content) || /\{\s*children\s*[},]/.test(content)) {
    score += 1;
    reasons.push("acts as a wrapper around children");
  }

  if (nonWrapperProps.length === 0 && propNames.length > 0) {
    score += 1;
    reasons.push("has mostly wrapper-style props");
  }

  if (!/from "@\/(actions|lib|model|components)"/.test(content)) {
    score += 1;
    reasons.push("does not appear to contain feature logic");
  }

  if (/className=`?["'{]/.test(content) || /page-panel|panel|section/.test(relativePath)) {
    score += 1;
    reasons.push("looks primarily presentational");
  }

  return { score, reasons };
}

const clearCandidates = [];
const borderlineCandidates = [];

for (const filePath of getTargetFiles()) {
  const relativePath = toPosixPath(path.relative(projectRoot, filePath));
  const content = fs.readFileSync(filePath, "utf8");
  const result = scoreFile(content, relativePath);

  if (
    result.score >= 6 &&
    result.reasons.includes("has mostly wrapper-style props")
  ) {
    clearCandidates.push({ path: relativePath, reasons: result.reasons });
    continue;
  }

  if (result.score >= 3) {
    borderlineCandidates.push({ path: relativePath, reasons: result.reasons });
  }
}

console.log("Clear replacement candidates:");

if (clearCandidates.length === 0) {
  console.log("- none");
} else {
  for (const candidate of clearCandidates) {
    console.log(`- ${candidate.path}: ${candidate.reasons.join("; ")}`);
  }
}

console.log("");
console.log("Borderline cases to keep under review:");

if (borderlineCandidates.length === 0) {
  console.log("- none");
} else {
  for (const candidate of borderlineCandidates) {
    console.log(`- ${candidate.path}: ${candidate.reasons.join("; ")}`);
  }
}
