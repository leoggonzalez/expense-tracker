import "./text.scss";

import React from "react";

export interface TextProps {
  children: React.ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "h1" | "h2" | "h3" | "h4";
  color?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "success"
    | "success-light"
    | "danger"
    | "danger-light"
    | "warning"
    | "info"
    | "inverse";
  weight?: "normal" | "medium" | "semibold" | "bold";
  as?: "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "label";
  className?: string;
}

export function Text({
  children,
  size = "md",
  color = "primary",
  weight = "normal",
  as: Component = "p",
  className = "",
}: TextProps): React.ReactElement {
  const classes = [
    "text",
    `text--size-${size}`,
    `text--color-${color}`,
    `text--weight-${weight}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <Component className={classes}>{children}</Component>;
}
