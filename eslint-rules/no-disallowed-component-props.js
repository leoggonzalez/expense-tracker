"use strict";

const path = require("path");

function isTargetFile(filename) {
  return /[/\\]src[/\\](components|elements)[/\\].+\.(ts|tsx)$/.test(filename);
}

function getPropertyName(node) {
  if (!node) {
    return null;
  }

  if (node.type === "Identifier") {
    return node.name;
  }

  if (node.type === "Literal") {
    return String(node.value);
  }

  return null;
}

function reportIfDisallowed(context, node, keyNode) {
  const propertyName = getPropertyName(keyNode);

  if (propertyName === "className" || propertyName === "style") {
    context.report({
      node,
      message:
        "Components under src/components and src/elements must not expose className or style props.",
    });
  }
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow className and style props on shared components",
    },
    schema: [],
  },
  create(context) {
    const filename = path.normalize(context.getFilename());

    if (!isTargetFile(filename)) {
      return {};
    }

    return {
      TSPropertySignature(node) {
        reportIfDisallowed(context, node, node.key);
      },
      PropertyDefinition(node) {
        reportIfDisallowed(context, node, node.key);
      },
    };
  },
};
