import React from "react";
import "./button.scss";
import { AppLink } from "@/components/app_link/app_link";

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "transfer"
    | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  href?: string;
  ariaLabel?: string;
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
  href,
  ariaLabel,
}: ButtonProps): React.ReactElement {
  const classes = [
    "button",
    `button--variant-${variant}`,
    `button--size-${size}`,
    fullWidth && "button--full-width",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {startIcon && <span className="button__icon">{startIcon}</span>}
      {children}
    </>
  );

  if (href && !disabled) {
    return (
      <AppLink href={href} ariaLabel={ariaLabel}>
        <span className={classes}>{content}</span>
      </AppLink>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
}
