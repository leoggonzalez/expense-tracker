import React from "react";
import "./container.scss";

export interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: "content" | "wide" | "full";
}

export function Container({
  children,
  maxWidth = "content",
}: ContainerProps): React.ReactElement {
  const classes = ["container", `container--${maxWidth}`].join(" ");

  return (
    <div className={classes}>
      <div className="container__content">{children}</div>
    </div>
  );
}
