import React from "react";
import "./button.scss";

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  startIcon,
}: ButtonProps): React.ReactElement {
  const classes = [
    "button",
    `button--variant-${variant}`,
    `button--size-${size}`,
    fullWidth && "button--full-width",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {startIcon && <span className="button__icon">{startIcon}</span>}
      {children}
    </button>
  );
}
