"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow React.FC and FC component typing",
    },
    schema: [],
  },
  create(context) {
    return {
      TSTypeReference(node) {
        const typeName = node.typeName;

        if (
          typeName &&
          typeName.type === "TSQualifiedName" &&
          typeName.left.type === "Identifier" &&
          typeName.left.name === "React" &&
          typeName.right.type === "Identifier" &&
          typeName.right.name === "FC"
        ) {
          context.report({
            node,
            message: "Do not use React.FC. Declare props explicitly instead.",
          });
        }

        if (typeName && typeName.type === "Identifier" && typeName.name === "FC") {
          context.report({
            node,
            message: "Do not use FC. Declare props explicitly instead.",
          });
        }
      },
    };
  },
};
