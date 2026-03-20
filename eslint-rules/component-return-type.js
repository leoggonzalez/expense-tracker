"use strict";

const path = require("path");

function isComponentFile(filename) {
  return /[/\\]src[/\\](components|elements)[/\\].+\.(ts|tsx)$/.test(filename);
}

function isPascalCase(name) {
  return /^[A-Z][A-Za-z0-9]*$/.test(name);
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Require explicit React.ReactElement return types on components",
    },
    schema: [],
  },
  create(context) {
    const filename = path.normalize(context.getFilename());
    const sourceCode = context.getSourceCode();

    if (!isComponentFile(filename)) {
      return {};
    }

    function hasAllowedReturnType(node) {
      if (!node.returnType) {
        return false;
      }

      const returnTypeText = sourceCode
        .getText(node.returnType.typeAnnotation)
        .replace(/\s+/g, "");

      return (
        returnTypeText === "React.ReactElement" ||
        returnTypeText === "Promise<React.ReactElement>" ||
        returnTypeText === "Promise<React.ReactElement|null>"
      );
    }

    return {
      ExportNamedDeclaration(node) {
        if (
          !node.declaration ||
          node.declaration.type !== "FunctionDeclaration" ||
          !node.declaration.id ||
          !isPascalCase(node.declaration.id.name)
        ) {
          return;
        }

        if (!hasAllowedReturnType(node.declaration)) {
          context.report({
            node: node.declaration.id,
            message:
              "Exported React components must declare a React.ReactElement return type.",
          });
        }
      },
    };
  },
};
