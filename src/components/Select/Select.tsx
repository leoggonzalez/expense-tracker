import React from "react";
import "./Select.scss";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  label,
  placeholder,
  required = false,
  className = "",
}) => {
  return (
    <div className={`select ${className}`.trim()}>
      {label && (
        <label className="select__label">
          {label}
          {required && <span className="select__required">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="select__field"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
