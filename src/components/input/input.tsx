"use client";

import "@/components/input/input.scss";
import { Stack, Text } from "@/elements";
import React, { useId } from "react";

export interface InputProps {
  type?: "text" | "number" | "date" | "month" | "email";
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: React.ReactNode;
  ariaLabel?: string;
  required?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  disabled?: boolean;
  readOnly?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  pattern?: string;
  name?: string;
  id?: string;
  size?: "md" | "lg";
  surface?: "default" | "subtle";
  labelTone?: "primary" | "secondary";
  hasTrailingControl?: boolean;
  fullWidth?: boolean;
}

export function Input({
  type = "text",
  value,
  onChange,
  placeholder,
  label,
  ariaLabel,
  required = false,
  min,
  max,
  step,
  disabled = false,
  readOnly = false,
  inputMode,
  autoComplete,
  pattern,
  name,
  id,
  size = "md",
  surface = "default",
  labelTone = "primary",
  hasTrailingControl = false,
  fullWidth = false,
}: InputProps): React.ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const classes = [
    "input",
    `input--size-${size}`,
    `input--surface-${surface}`,
    hasTrailingControl && "input--with-trailing-control",
    fullWidth && "input--full-width",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <Stack gap={4}>
        {label && (
          <label htmlFor={inputId} className="input__label">
            <Text
              element="span"
              type="caption-medium"
              color={labelTone === "secondary" ? "secondary" : "primary"}
            >
              {label}
            </Text>
            {required && <span className="input__required">*</span>}
          </label>
        )}
        <input
          id={inputId}
          name={name}
          aria-label={ariaLabel}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          readOnly={readOnly}
          inputMode={inputMode}
          autoComplete={autoComplete}
          pattern={pattern}
          className="input__field"
        />
      </Stack>
    </div>
  );
}
