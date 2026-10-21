import "@/elements/text/text.scss";

import React from "react";

import {
  textVariants,
  type TextType,
  type TextVariant,
  type TextWeight,
} from "@/elements/text/text_types";

export interface TextProps {
  children: React.ReactNode;
  type?: TextType;
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
  element?:
    | "p"
    | "span"
    | "div"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "label";
  transform?: "none" | "uppercase" | "lowercase" | "capitalize";
  tracking?: "default" | "tight";
}

export function Text({
  children,
  type = "body",
  color = "primary",
  element: Component = "div",
  transform = "none",
  tracking = "default",
}: TextProps): React.ReactElement {
  const [variant, weight = "normal"] = type.split("-") as [
    TextVariant,
    TextWeight?,
  ];
  const size = textVariants[variant];

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
