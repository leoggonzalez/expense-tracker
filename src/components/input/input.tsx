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
}: InputProps): React.ReactElement {
  return (
    <div className="input">
      <Stack gap={4}>
        {label && (
          <label htmlFor={id}>
            <Text as="span" size="sm" weight="medium">
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
