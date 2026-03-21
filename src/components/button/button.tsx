import React from "react";
import "./button.scss";
import { AppLink } from "@/components/app_link/app_link";
import { Stack } from "@/elements";

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "outline-danger"
    | "success"
    | "transfer"
    | "outline"
    | "cta";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  fullWidth?: boolean | "mobile-only";
  startIcon?: React.ReactNode;
  href?: string;
  ariaLabel?: string;
  contentAlign?: "center" | "start";
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
  contentAlign = "center",
}: ButtonProps): React.ReactElement {
  const classes = [
    "button",
    `button--variant-${variant}`,
    `button--size-${size}`,
    fullWidth === true && "button--full-width",
    fullWidth === "mobile-only" && "button--full-width-mobile-only",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <span
      className={[
        "button__content",
        `button__content--align-${contentAlign}`,
      ].join(" ")}
    >
      <Stack
        direction="row"
        align="center"
        justify={contentAlign === "start" ? "flex-start" : "center"}
        gap={4}
        inline
      >
        {startIcon && <span className="button__icon">{startIcon}</span>}
        {children}
      </Stack>
    </span>
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
