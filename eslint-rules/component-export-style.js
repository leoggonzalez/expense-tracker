"use strict";

function isPascalCase(name) {
  return /^[A-Z][A-Za-z0-9]*$/.test(name);
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Require exported React components to use function declarations",
    },
    schema: [],
  },
  create(context) {
    return {
      ExportNamedDeclaration(node) {
        if (!node.declaration || node.declaration.type !== "VariableDeclaration") {
          return;
        }

        for (const declaration of node.declaration.declarations) {
          if (
            declaration.id.type === "Identifier" &&
            isPascalCase(declaration.id.name) &&
            declaration.init &&
            (declaration.init.type === "ArrowFunctionExpression" ||
              declaration.init.type === "FunctionExpression")
          ) {
            context.report({
              node: declaration,
              message:
                "Exported React components should use function declarations.",
            });
          }
        }
      },
    };
  },
};
