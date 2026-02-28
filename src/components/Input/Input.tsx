import React from "react";
import "./input.scss";

export interface InputProps {
  type?: "text" | "number" | "date" | "month";
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  className?: string;
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
  className = "",
}: InputProps): React.ReactElement {
  return (
    <div className={`input ${className}`.trim()}>
      {label && (
        <label className="input__label">
          {label}
          {required && <span className="input__required">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        className="input__field"
      />
    </div>
  );
}
