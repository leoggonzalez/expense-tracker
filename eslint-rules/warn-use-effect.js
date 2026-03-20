"use strict";

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Warn when useEffect is used so it gets a manual review",
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee &&
          node.callee.type === "Identifier" &&
          node.callee.name === "useEffect"
        ) {
          context.report({
            node,
            message:
              "useEffect should stay rare. Confirm this effect is synchronizing with an external system.",
          });
        }
      },
    };
  },
};
