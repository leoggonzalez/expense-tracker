import React from "react";
import { Stack, Text } from "@/elements";
import "./input.scss";

export interface InputProps {
  type?: "text" | "number" | "date" | "month" | "email";
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: React.ReactNode;
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
          <label htmlFor={id} className="input__label">
            <Text
              as="span"
              size="sm"
              weight="medium"
              color={labelTone === "secondary" ? "secondary" : "primary"}
            >
              {label}
            </Text>
            {required && <span className="input__required">*</span>}
          </label>
        )}
        <input
          id={id}
          name={name}
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
