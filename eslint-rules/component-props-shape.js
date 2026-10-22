"use strict";

const path = require("path");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Require component props to use an explicit interface",
    },
    schema: [],
    messages: {
      interface: "Declare component props with an explicit local interface.",
    },
  },
  create(context) {
    if (
      !/[/\\]src[/\\](components|elements)[/\\].+\.(ts|tsx)$/.test(
        path.normalize(context.getFilename()),
      )
    )
      return {};
    const interfaces = new Set();
    const components = [];

    function collect(node) {
      if (
        node?.type === "FunctionDeclaration" &&
        /^[A-Z]/.test(node.id?.name || "")
      )
        components.push(node);
    }

    return {
      TSInterfaceDeclaration(node) {
        interfaces.add(node.id.name);
      },
      ExportNamedDeclaration(node) {
        collect(node.declaration);
      },
      ExportDefaultDeclaration(node) {
        collect(node.declaration);
      },
      "Program:exit"() {
        for (const component of components) {
          const [parameter] = component.params;
          if (!parameter) continue;
          const props =
            parameter.type === "AssignmentPattern" ? parameter.left : parameter;
          const annotation = props.typeAnnotation?.typeAnnotation;
          if (
            annotation?.type !== "TSTypeReference" ||
            annotation.typeName.type !== "Identifier" ||
            !interfaces.has(annotation.typeName.name)
          ) {
            context.report({ node: props, messageId: "interface" });
          }
        }
      },
    };
  },
};
