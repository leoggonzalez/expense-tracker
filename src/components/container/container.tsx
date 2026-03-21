import React from "react";
import "./container.scss";

export interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: "content" | "wide" | "full";
  layout?: "default" | "intrinsic" | "intrinsic-full-height";
}

export function Container({
  children,
  maxWidth = "content",
  layout = "default",
}: ContainerProps): React.ReactElement {
  const classes = ["container", `container--${maxWidth}`, `container--layout-${layout}`].join(" ");

  return (
    <div className={classes}>
      <div className="container__content">{children}</div>
    </div>
  );
}
