import React from "react";
import "./box.scss";

type BoxStyle = React.CSSProperties & Record<`--${string}`, string>;

export interface BoxPadding {
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
}

export interface BoxProps {
  children: React.ReactNode;
  padding?: number | BoxPadding;
  maxWidth?: number;
  className?: string;
}

export function Box({
  children,
  padding,
  maxWidth,
  className = "",
}: BoxProps): React.ReactElement {
  const style: BoxStyle = {};

  if (typeof padding === "number") {
    style["--box-padding"] = `${padding}px`;
  } else if (padding) {
    if (padding.paddingTop !== undefined)
      style["--box-padding-top"] = `${padding.paddingTop}px`;
    if (padding.paddingRight !== undefined)
      style["--box-padding-right"] = `${padding.paddingRight}px`;
    if (padding.paddingBottom !== undefined)
      style["--box-padding-bottom"] = `${padding.paddingBottom}px`;
    if (padding.paddingLeft !== undefined)
      style["--box-padding-left"] = `${padding.paddingLeft}px`;
  }

  if (maxWidth !== undefined) {
    style["--box-max-width"] = `${maxWidth}px`;
  }

  return (
    <div className={`box ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
