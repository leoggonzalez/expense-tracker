"use strict";

const path = require("path");

const ALLOWED_FILES = [
  path.normalize("src/elements/box/box.tsx"),
  path.normalize("src/elements/card/card.tsx"),
  path.normalize("src/elements/grid/grid.tsx"),
  path.normalize("src/elements/icon/icon.tsx"),
  path.normalize("src/elements/stack/stack.tsx"),
  path.normalize("src/components/loading_skeleton/loading_skeleton.tsx"),
  path.normalize("src/app/icon.tsx"),
  path.normalize("src/app/apple-icon.tsx"),
];

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow inline style props outside approved exceptions",
    },
    schema: [],
  },
  create(context) {
    const filename = path.normalize(context.getFilename());
    const isAllowed = ALLOWED_FILES.some((allowedFile) =>
      filename.endsWith(allowedFile),
    );

    if (isAllowed) {
      return {};
    }

    return {
      JSXAttribute(node) {
        if (node.name && node.name.name === "style") {
          context.report({
            node,
            message:
              "Inline style props are not allowed outside approved primitive exceptions.",
          });
        }
      },
    };
  },
};
