import React from "react";

import { LoadingSkeleton } from "@/components/loading_skeleton/loading_skeleton";
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
  isLoading?: boolean;
  size?: "md" | "lg";
  surface?: "default" | "subtle";
  labelTone?: "primary" | "secondary";
}

export function Select({
  value,
  onChange,
  options,
  label,
  placeholder,
  required = false,
  trailingContent,
  isLoading = false,
  size = "md",
  surface = "default",
  labelTone = "primary",
}: SelectProps): React.ReactElement {
  const classes = [
    "select",
    `select--size-${size}`,
    `select--surface-${surface}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <Stack gap={4}>
        {label && (
          <label className="select__label">
            <Text
              as="span"
              size="sm"
              weight="medium"
              color={labelTone === "secondary" ? "secondary" : "primary"}
            >
              {label}
            </Text>
            {required && <span className="select__required">*</span>}
          </label>
        )}
        <div className="select__control">
          {isLoading ? (
            <div className="select__loading" aria-hidden="true">
              <LoadingSkeleton height={size === "lg" ? 56 : 48} radius={18} />
            </div>
          ) : (
            <>
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
            </>
          )}
          {isLoading ? (
            <div className="select__loading-label">
              <Text as="span" size="xs" color="secondary">
                {placeholder}
              </Text>
            </div>
          ) : null}
        </div>
      </Stack>
    </div>
  );
}
