import "./card.scss";

import React from "react";

import { Box, BoxPadding } from "@/elements/box/box";

export interface CardProps {
  children: React.ReactNode;
  padding?: number | BoxPadding;
  variant?: "default" | "secondary" | "dashed";
  as?: "div" | "section" | "article";
}

export function Card({
  children,
  padding,
  variant = "default",
  as: Component = "div",
}: CardProps): React.ReactElement {
  const classes = ["card", `card--${variant}`].join(" ");

  return (
    <Component className={classes}>
      <Box padding={padding}>{children}</Box>
    </Component>
  );
}
