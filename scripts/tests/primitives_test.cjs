require("tsx/cjs");
require.extensions[".scss"] = () => {};

const { test } = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { Text } = require("../../src/elements/text/text");
const { Box } = require("../../src/elements/box/box");
const { Stack } = require("../../src/elements/stack/stack");

test("typography retains Currento tokens and selects HTML semantics independently", () => {
  const cases = [
    ["body", "p", "md", "normal"],
    ["caption-medium", "span", "sm", "medium"],
    ["h2-bold", "h1", "h2", "bold"],
    ["lead-semibold", "span", "lg", "semibold"],
    ["display-bold", "p", "2xl", "bold"],
  ];
  for (const [type, element, size, weight] of cases) {
    const html = renderToStaticMarkup(
      React.createElement(Text, { type, element }, "Copy"),
    );
    assert.equal(
      html,
      `<${element} class="text text--size-${size} text--color-primary text--weight-${weight} text--transform-none text--tracking-default">Copy</${element}>`,
    );
  }
});

test("responsive padding permits zero overrides and preserves independent axes", () => {
  const { props } = Box({
    children: null,
    padding: { vertical: 16, horizontal: 24, top: 0 },
    paddingTablet: 0,
    paddingDesktop: { left: 8 },
    maxWidth: 480,
  });
  assert.equal(props.style["--box-padding-top"], "0px");
  assert.equal(props.style["--box-padding-right"], "24px");
  assert.equal(props.style["--box-padding-bottom"], "16px");
  assert.equal(props.style["--box-tablet-padding"], "0px");
  assert.equal(props.style["--box-desktop-padding-left"], "8px");
  assert.equal(props.style["--box-max-width"], "480px");
});

test("stack allows a horizontal base to reset to vertical and zero gap at larger sizes", () => {
  const { props } = Stack({
    children: null,
    line: true,
    lineTablet: false,
    lineDesktop: true,
    gap: 16,
    gapTablet: 0,
    align: "start",
    justify: "end",
    wrap: true,
    wrapDesktop: false,
  });
  assert.equal(props.style["--stack-direction"], "row");
  assert.equal(props.style["--stack-tablet-direction"], "column");
  assert.equal(props.style["--stack-desktop-direction"], "row");
  assert.equal(props.style["--stack-tablet-gap"], "0px");
  assert.equal(props.style["--stack-align"], "flex-start");
  assert.equal(props.style["--stack-justify"], "flex-end");
  assert.equal(props.style["--stack-desktop-wrap"], "nowrap");
});

test("section errors preserve inverse-surface typography and retry button styling", () => {
  const {
    SectionError,
  } = require("../../src/components/section_error/section_error");
  const html = renderToStaticMarkup(
    React.createElement(SectionError, {
      message: "Unavailable",
      retryLabel: "Retry",
      onRetry: () => {},
      tone: "inverse",
    }),
  );
  assert.match(html, /text--size-sm text--color-hero-muted/);
  assert.match(html, /button--variant-outline/);
  assert.match(html, /<button type="button"/);
});
