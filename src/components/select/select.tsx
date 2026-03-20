import React from "react";

import { Icon, Stack, Text } from "@/elements";

import "./select.scss";

export interface SelectOption {
  value: string;
  label: React.ReactNode;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: React.ReactNode;
  placeholder?: string;
  required?: boolean;
  trailingContent?: React.ReactNode;
}

export function Select({
  value,
  onChange,
  options,
  label,
  placeholder,
  required = false,
  trailingContent,
}: SelectProps): React.ReactElement {
  return (
    <div className="select">
      <Stack gap={4}>
        {label && (
          <label>
            <Text as="span" size="sm" weight="medium">
              {label}
            </Text>
            {required && <span className="select__required">*</span>}
          </label>
        )}
        <div className="select__control">
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

          <div className="select__trailing">
            <span className="select__chevron">
              <Icon name="chevron-down" size={18} />
            </span>
            {trailingContent}
          </div>
        </div>
      </Stack>
    </div>
  );
}
