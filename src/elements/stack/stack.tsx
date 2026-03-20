import "./stack.scss";

import React from "react";

type StackStyle = React.CSSProperties & Record<`--${string}`, string>;

export interface StackProps {
  children: React.ReactNode;
  direction?: "row" | "column";
  desktopDirection?: "row" | "column";
  gap?: number;
  fullWidth?: boolean;
  fullHeight?: boolean;
  inline?: boolean;
  align?: "flex-start" | "center" | "flex-end" | "stretch";
  justify?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around";
  wrap?: boolean;
}

export function Stack({
  children,
  direction = "column",
  desktopDirection,
  gap = 0,
  fullWidth = false,
  fullHeight = false,
  inline = false,
  align,
  justify,
  wrap = false,
}: StackProps): React.ReactElement {
  const style: StackStyle = {
    "--stack-direction": direction,
    "--stack-desktop-direction": desktopDirection || direction,
    "--stack-gap": `${gap}px`,
    "--stack-wrap": wrap ? "wrap" : "nowrap",
  };

  if (align) {
    style["--stack-align"] = align;
  }

  if (justify) {
    style["--stack-justify"] = justify;
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
