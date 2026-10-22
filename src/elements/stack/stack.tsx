import "@/elements/stack/stack.scss";

import React from "react";

type StackStyle = React.CSSProperties & Record<`--${string}`, string>;
type Align = "start" | "center" | "end" | "stretch" | "baseline";
type Justify = "start" | "center" | "end" | "space-between" | "space-around";

export interface StackProps {
  children: React.ReactNode;
  line?: boolean;
  lineTablet?: boolean;
  lineDesktop?: boolean;
  gap?: number;
  gapTablet?: number;
  gapDesktop?: number;
  align?: Align;
  alignTablet?: Align;
  alignDesktop?: Align;
  justify?: Justify;
  justifyTablet?: Justify;
  justifyDesktop?: Justify;
  wrap?: boolean;
  wrapTablet?: boolean;
  wrapDesktop?: boolean;
  fullWidth?: boolean;
  fullHeight?: boolean;
  inline?: boolean;
}

function alignment(value: Align | Justify): string {
  return value === "start" || value === "end" ? `flex-${value}` : value;
}

export function Stack({
  children,
  line = false,
  lineTablet,
  lineDesktop,
  gap = 0,
  gapTablet,
  gapDesktop,
  align,
  alignTablet,
  alignDesktop,
  justify,
  justifyTablet,
  justifyDesktop,
  wrap = false,
  wrapTablet,
  wrapDesktop,
  fullWidth = false,
  fullHeight = false,
  inline = false,
}: StackProps): React.ReactElement {
  const style: StackStyle = {};
  const viewports = [
    { suffix: "", line, gap, align, justify, wrap },
    {
      suffix: "-tablet",
      line: lineTablet,
      gap: gapTablet,
      align: alignTablet,
      justify: justifyTablet,
      wrap: wrapTablet,
    },
    {
      suffix: "-desktop",
      line: lineDesktop,
      gap: gapDesktop,
      align: alignDesktop,
      justify: justifyDesktop,
      wrap: wrapDesktop,
    },
  ];

  for (const viewport of viewports) {
    const prefix: `--${string}` = `--stack${viewport.suffix}`;
    if (viewport.line !== undefined)
      style[`${prefix}-direction`] = viewport.line ? "row" : "column";
    if (viewport.gap !== undefined)
      style[`${prefix}-gap`] = `${viewport.gap}px`;
    if (viewport.align !== undefined)
      style[`${prefix}-align`] = alignment(viewport.align);
    if (viewport.justify !== undefined)
      style[`${prefix}-justify`] = alignment(viewport.justify);
    if (viewport.wrap !== undefined)
      style[`${prefix}-wrap`] = viewport.wrap ? "wrap" : "nowrap";
  }

  return (
    <div
      className={[
        "stack",
        fullWidth && "stack--full-width",
        fullHeight && "stack--full-height",
        inline && "stack--inline",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {children}
    </div>
  );
}
