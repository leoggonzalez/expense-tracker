"use strict";

const path = require("path");

function isComponentFile(filename) {
  return /[/\\]src[/\\](components|elements)[/\\].+\.(ts|tsx)$/.test(filename);
}

function isPascalCase(name) {
  return /^[A-Z][A-Za-z0-9]*$/.test(name);
}

function hasExplicitPropsType(param) {
  if (!param || !param.typeAnnotation) {
    return false;
  }

  const annotation = param.typeAnnotation.typeAnnotation;

  return annotation && annotation.type !== "TSTypeLiteral";
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require exported component props to use an explicit type or interface",
    },
    schema: [],
  },
  create(context) {
    const filename = path.normalize(context.getFilename());

    if (!isComponentFile(filename)) {
      return {};
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

        const [firstParam] = node.declaration.params;

        if (!firstParam) {
          return;
        }

        if (!hasExplicitPropsType(firstParam)) {
          context.report({
            node: firstParam,
            message:
              "Exported component props must use an explicit type or interface.",
          });
        }
      },
    };
  },
};
