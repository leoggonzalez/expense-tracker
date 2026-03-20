"use strict";

function matchesPageName(name) {
  return typeof name === "string" && /_page$/i.test(name);
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow component identifiers ending in _page",
    },
    schema: [],
  },
  create(context) {
    function report(node, name) {
      if (matchesPageName(name)) {
        context.report({
          node,
          message: "Components ending in _page are prohibited.",
        });
      }
    }

    return {
      FunctionDeclaration(node) {
        if (node.id) {
          report(node.id, node.id.name);
        }
      },
      VariableDeclarator(node) {
        if (node.id.type === "Identifier") {
          report(node.id, node.id.name);
        }
      },
      TSTypeAliasDeclaration(node) {
        report(node.id, node.id.name);
      },
      TSInterfaceDeclaration(node) {
        report(node.id, node.id.name);
      },
    };
  },
};
