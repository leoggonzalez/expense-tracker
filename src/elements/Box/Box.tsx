import React from "react";
import "./box.scss";

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

export const Box: React.FC<BoxProps> = ({
  children,
  padding,
  maxWidth,
  className = "",
}) => {
  const style: React.CSSProperties = {};

  if (typeof padding === "number") {
    style.padding = `${padding}px`;
  } else if (padding) {
    if (padding.paddingTop !== undefined)
      style.paddingTop = `${padding.paddingTop}px`;
    if (padding.paddingRight !== undefined)
      style.paddingRight = `${padding.paddingRight}px`;
    if (padding.paddingBottom !== undefined)
      style.paddingBottom = `${padding.paddingBottom}px`;
    if (padding.paddingLeft !== undefined)
      style.paddingLeft = `${padding.paddingLeft}px`;
  }

  if (maxWidth !== undefined) {
    style.maxWidth = `${maxWidth}px`;
  }

  return (
    <div className={`box ${className}`.trim()} style={style}>
      {children}
    </div>
  );
};
