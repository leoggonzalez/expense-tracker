import "./stack.scss";

import React from "react";

type StackStyle = React.CSSProperties & Record<`--${string}`, string>;

export interface StackProps {
  children: React.ReactNode;
  direction?: "row" | "column";
  gap?: number;
  align?: "flex-start" | "center" | "flex-end" | "stretch";
  justify?:
  | "flex-start"
  | "center"
  | "flex-end"
  | "space-between"
  | "space-around";
  wrap?: boolean;
  className?: string;
}

export function Stack({
  children,
  direction = "column",
  gap = 0,
  align,
  justify,
  wrap = false,
  className = "",
}: StackProps): React.ReactElement {
  const style: StackStyle = {
    "--stack-direction": direction,
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
    <div className={`stack ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
