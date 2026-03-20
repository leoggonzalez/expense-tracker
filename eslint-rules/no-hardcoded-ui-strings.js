"use strict";

const path = require("path");

const UI_ATTRIBUTES = new Set([
  "alt",
  "aria-label",
  "label",
  "placeholder",
  "title",
]);

function isRelevantFile(filename) {
  return /[/\\]src[/\\](app|components|elements)[/\\].+\.(ts|tsx)$/.test(filename);
}

function looksLikeUiText(value) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return false;
  }

  if (/^[\d\s.,:;!?/\\()[\]{}%+-]+$/.test(trimmedValue)) {
    return false;
  }

  if (/^[a-z0-9_.-]+$/i.test(trimmedValue) && !/\s/.test(trimmedValue)) {
    return false;
  }

  return /[A-Za-z]/.test(trimmedValue);
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Warn on hardcoded user-facing strings in UI code",
    },
    schema: [],
  },
  create(context) {
    const filename = path.normalize(context.getFilename());

    if (!isRelevantFile(filename)) {
      return {};
    }

    return {
      JSXText(node) {
        if (looksLikeUiText(node.value)) {
          context.report({
            node,
            message:
              "Potential hardcoded UI copy found. Prefer sourcing user-facing text from src/locales/en.json.",
          });
        }
      },
      JSXAttribute(node) {
        if (!node.name || !UI_ATTRIBUTES.has(node.name.name)) {
          return;
        }

        if (
          node.value &&
          node.value.type === "Literal" &&
          looksLikeUiText(node.value.value)
        ) {
          context.report({
            node,
            message:
              "Potential hardcoded UI copy found. Prefer sourcing user-facing text from src/locales/en.json.",
          });
        }
      },
      Property(node) {
        const keyName =
          node.key && node.key.type === "Identifier" ? node.key.name : null;

        if (
          (keyName === "title" || keyName === "description") &&
          node.value &&
          node.value.type === "Literal" &&
          looksLikeUiText(node.value.value)
        ) {
          context.report({
            node,
            message:
              "Potential hardcoded metadata copy found. Prefer sourcing it from locale messages.",
          });
        }
      },
    };
  },
};
