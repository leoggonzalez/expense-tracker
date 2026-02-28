import React from "react";
import "./container.scss";

export interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: "content" | "wide" | "full";
  className?: string;
}

export function Container({
  children,
  maxWidth = "content",
  className = "",
}: ContainerProps): React.ReactElement {
  const classes = ["container", `container--${maxWidth}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <div className="container__content">{children}</div>
    </div>
  );
}
