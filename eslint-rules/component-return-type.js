"use strict";

const path = require("path");

function isComponentFile(filename) {
  return /[/\\]src[/\\](components|elements)[/\\].+\.(ts|tsx)$/.test(filename);
}

function isPascalCase(name) {
  return /^[A-Z][A-Za-z0-9]*$/.test(name);
}

function isReactElementReference(node) {
  return (
    node &&
    node.type === "TSTypeReference" &&
    node.typeName &&
    node.typeName.type === "TSQualifiedName" &&
    node.typeName.left.type === "Identifier" &&
    node.typeName.left.name === "React" &&
    node.typeName.right.type === "Identifier" &&
    node.typeName.right.name === "ReactElement"
  );
}

function hasAllowedReturnType(node) {
  if (!node.returnType) {
    return false;
  }

  const annotation = node.returnType.typeAnnotation;

  if (isReactElementReference(annotation)) {
    return true;
  }

  return (
    annotation &&
    annotation.type === "TSTypeReference" &&
    annotation.typeName.type === "Identifier" &&
    annotation.typeName.name === "Promise" &&
    annotation.typeParameters &&
    annotation.typeParameters.params &&
    annotation.typeParameters.params.length === 1 &&
    isReactElementReference(annotation.typeParameters.params[0])
  );
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
