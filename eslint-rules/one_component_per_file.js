"use strict";

const path = require("path");

module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Export one React component per component file" },
    schema: [],
    messages: {
      multiple:
        "Export exactly one component per file; move {{name}} into its own component file.",
    },
  },
  create(context) {
    if (
      !/[/\\]src[/\\](components|elements)[/\\].+\.(ts|tsx)$/.test(
        path.normalize(context.getFilename()),
      )
    )
      return {};
    const declarations = new Map();
    const exports = new Set();
    const isComponent = (name) => /^[A-Z][A-Za-z0-9]*$/.test(name || "");

    return {
      FunctionDeclaration(node) {
        if (isComponent(node.id?.name)) declarations.set(node.id.name, node);
      },
      VariableDeclarator(node) {
        if (
          node.id.type === "Identifier" &&
          isComponent(node.id.name) &&
          ["ArrowFunctionExpression", "FunctionExpression"].includes(
            node.init?.type,
          )
        )
          declarations.set(node.id.name, node);
      },
      ExportNamedDeclaration(node) {
        if (node.source) return; // Re-export barrels do not define components.
        if (node.declaration?.type === "FunctionDeclaration")
          exports.add(node.declaration.id?.name);
        if (node.declaration?.type === "VariableDeclaration") {
          for (const declaration of node.declaration.declarations)
            exports.add(declaration.id.name);
        }
        for (const specifier of node.specifiers)
          if (specifier.exportKind !== "type")
            exports.add(specifier.local.name);
      },
      ExportDefaultDeclaration(node) {
        exports.add(node.declaration.id?.name || node.declaration.name);
      },
      "Program:exit"() {
        const components = [...exports].filter((name) =>
          declarations.has(name),
        );
        for (const name of components.slice(1))
          context.report({
            node: declarations.get(name),
            messageId: "multiple",
            data: { name },
          });
      },
    };
  },
};
