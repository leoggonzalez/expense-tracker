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
    | "inverse"
    | "hero"
    | "hero-muted";
  weight?: "normal" | "medium" | "semibold" | "bold";
  as?: "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "label";
  transform?: "none" | "uppercase" | "lowercase" | "capitalize";
  tracking?: "default" | "tight";
}

export function Text({
  children,
  size = "md",
  color = "primary",
  weight = "normal",
  as: Component = "p",
  transform = "none",
  tracking = "default",
}: TextProps): React.ReactElement {
  const classes = [
    "text",
    `text--size-${size}`,
    `text--color-${color}`,
    `text--weight-${weight}`,
    `text--transform-${transform}`,
    `text--tracking-${tracking}`,
  ]
    .filter(Boolean)
    .join(" ");

  return <Component className={classes}>{children}</Component>;
}
