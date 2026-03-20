import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const srcRoot = path.join(projectRoot, "src");
const inputPaths = process.argv.slice(2);

const errors = [];
const warnings = [];

const exactAllowedFilenames = new Set([
  "page.tsx",
  "layout.tsx",
  "route.ts",
  "loading.tsx",
  "error.tsx",
  "not-found.tsx",
  "template.tsx",
  "default.tsx",
  "icon.tsx",
  "apple-icon.tsx",
]);

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function isSnakeCaseName(name) {
  return /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(name);
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

function getCandidateFiles() {
  if (inputPaths.length > 0) {
    return inputPaths
      .map((targetPath) => path.resolve(projectRoot, targetPath))
      .filter((targetPath) => fs.existsSync(targetPath))
      .flatMap((targetPath) => walk(targetPath));
  }

  return walk(srcRoot);
}

function checkSnakeCase(relativePath) {
  const parts = relativePath.split("/");
  const extension = path.extname(relativePath);

  if (![".ts", ".tsx", ".scss", ".json"].includes(extension)) {
    return;
  }

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const isLast = index === parts.length - 1;
    const ext = path.extname(part);
    const basename = ext ? part.slice(0, -ext.length) : part;

    if (part.startsWith("(") || part.startsWith("[")) {
      continue;
    }

    if (isLast && exactAllowedFilenames.has(part)) {
      continue;
    }

    if (ext) {
      if (!isSnakeCaseName(basename) || !/^\.[a-z0-9]+$/.test(ext)) {
        errors.push(
          `${relativePath}: filenames must use snake_case unless they are a framework exception.`,
        );
      }
      continue;
    }

    if (!isSnakeCaseName(part)) {
      errors.push(
        `${relativePath}: directory names must use snake_case unless they are a framework exception.`,
      );
    }
  }
}

function checkScssPlacement(relativePath) {
  if (relativePath.startsWith("src/app/") && relativePath.endsWith(".scss")) {
    errors.push(`${relativePath}: SCSS files are not allowed under src/app.`);
  }
}

function checkPairedBasenames(allFiles) {
  const byDirectory = new Map();

  for (const absolutePath of allFiles) {
    const relativePath = toPosixPath(path.relative(projectRoot, absolutePath));

    if (!/src\/(components|elements)\//.test(relativePath)) {
      continue;
    }

    const directory = path.posix.dirname(relativePath);

    if (!byDirectory.has(directory)) {
      byDirectory.set(directory, []);
    }

    byDirectory.get(directory).push(path.posix.basename(relativePath));
  }

  for (const [directory, basenames] of byDirectory.entries()) {
    const tsxFiles = basenames.filter((basename) => basename.endsWith(".tsx"));
    const scssFiles = basenames.filter((basename) => basename.endsWith(".scss"));

    if (tsxFiles.length === 1 && scssFiles.length === 1) {
      const tsxBase = tsxFiles[0].replace(/\.tsx$/, "");
      const scssBase = scssFiles[0].replace(/\.scss$/, "");

      if (tsxBase !== scssBase) {
        errors.push(
          `${directory}: paired component and SCSS files must share the same basename.`,
        );
      }
    }
  }
}

function checkLocaleFile() {
  const localePath = path.join(projectRoot, "src/locales/en.json");

  if (!fs.existsSync(localePath)) {
    return;
  }

  const locale = JSON.parse(fs.readFileSync(localePath, "utf8"));

  function visit(node, keyPath = []) {
    for (const [key, value] of Object.entries(node)) {
      const currentPath = [...keyPath, key].join(".");

      if (!isSnakeCaseName(key)) {
        errors.push(
          `src/locales/en.json:${currentPath}: locale keys must use lower_snake_case.`,
        );
      }

      if (value && typeof value === "object" && !Array.isArray(value)) {
        visit(value, [...keyPath, key]);
      }
    }
  }

  visit(locale);
}

function checkDynamicProtectedPages(allFiles) {
  for (const absolutePath of allFiles) {
    const relativePath = toPosixPath(path.relative(projectRoot, absolutePath));

    if (
      !relativePath.startsWith("src/app/(protected)/") ||
      !relativePath.endsWith("/page.tsx")
    ) {
      continue;
    }

    const content = fs.readFileSync(absolutePath, "utf8");

    if (!content.includes('export const dynamic = "force-dynamic"')) {
      warnings.push(
        `${relativePath}: authenticated protected pages should usually declare export const dynamic = "force-dynamic".`,
      );
    }
  }
}

function checkRouteWrapperHeuristics(allFiles) {
  for (const absolutePath of allFiles) {
    const relativePath = toPosixPath(path.relative(projectRoot, absolutePath));

    if (!relativePath.startsWith("src/components/") || !relativePath.endsWith(".tsx")) {
      continue;
    }

    const basename = path.posix.basename(relativePath, ".tsx");

    if (basename.endsWith("_page") || basename.endsWith("_route")) {
      warnings.push(
        `${relativePath}: review whether this component is route-level structure that belongs directly in src/app.`,
      );
    }
  }
}

function reportResults() {
  for (const message of errors) {
    console.error(`ERROR ${message}`);
  }

  for (const message of warnings) {
    console.warn(`WARN  ${message}`);
  }

  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

const candidateFiles = getCandidateFiles();
const srcFiles = candidateFiles.filter((absolutePath) =>
  toPosixPath(path.relative(projectRoot, absolutePath)).startsWith("src/"),
);

for (const absolutePath of srcFiles) {
  const relativePath = toPosixPath(path.relative(projectRoot, absolutePath));

  checkSnakeCase(relativePath);
  checkScssPlacement(relativePath);
}

checkPairedBasenames(srcFiles);
checkLocaleFile();
checkDynamicProtectedPages(srcFiles);
checkRouteWrapperHeuristics(srcFiles);
reportResults();
