"use strict";

const path = require("path");

function isUnderSrc(resolvedPath) {
  return resolvedPath.split(path.sep).includes("src");
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Require @/ imports for modules resolved under src/",
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();

    if (!path.isAbsolute(filename)) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        const importSource = node.source && node.source.value;

        if (typeof importSource !== "string" || !importSource.startsWith(".")) {
          return;
        }

        if (/\.(css|scss|sass|svg)$/.test(importSource)) {
          return;
        }

        const resolvedPath = path.resolve(path.dirname(filename), importSource);

        if (!isUnderSrc(resolvedPath)) {
          return;
        }

        context.report({
          node: node.source,
          message:
            "Use the @/ alias for internal imports that resolve under src/.",
        });
      },
    };
  },
};
