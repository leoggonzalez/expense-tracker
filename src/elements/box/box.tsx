import "@/elements/box/box.scss";

import React from "react";

type BoxStyle = React.CSSProperties & Record<`--${string}`, string>;

export interface BoxPadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  vertical?: number;
  horizontal?: number;
}

export interface BoxProps {
  children: React.ReactNode;
  padding?: number | BoxPadding;
  paddingTablet?: number | BoxPadding;
  paddingDesktop?: number | BoxPadding;
  maxWidth?: number;
  maxWidthTablet?: number;
  maxWidthDesktop?: number;
}

export function Box({
  children,
  padding,
  paddingTablet,
  paddingDesktop,
  maxWidth,
  maxWidthTablet,
  maxWidthDesktop,
}: BoxProps): React.ReactElement {
  const style: BoxStyle = {};
  const viewports = [
    { suffix: "", padding, maxWidth },
    { suffix: "-tablet", padding: paddingTablet, maxWidth: maxWidthTablet },
    { suffix: "-desktop", padding: paddingDesktop, maxWidth: maxWidthDesktop },
  ];

  for (const viewport of viewports) {
    const prefix: `--${string}` = `--box${viewport.suffix}`;
    const value = viewport.padding;
    if (typeof value === "number") {
      style[`${prefix}-padding`] = `${value}px`;
    } else if (value) {
      const sides = {
        top: value.top ?? value.vertical,
        bottom: value.bottom ?? value.vertical,
        left: value.left ?? value.horizontal,
        right: value.right ?? value.horizontal,
      };
      for (const [side, amount] of Object.entries(sides)) {
        if (amount !== undefined)
          style[`${prefix}-padding-${side}`] = `${amount}px`;
      }
    }
    if (viewport.maxWidth !== undefined)
      style[`${prefix}-max-width`] = `${viewport.maxWidth}px`;
  }

  return (
    <div className="box" style={style}>
      {children}
    </div>
  );
}
