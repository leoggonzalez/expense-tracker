import "@/components/checkbox/checkbox.scss";
import { Stack, Text } from "@/elements";
import React from "react";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  variant?: "default" | "switch";
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  variant = "default",
}: CheckboxProps): React.ReactElement {
  const isSwitch = variant === "switch";

  return (
    <label className={["checkbox", `checkbox--${variant}`].join(" ")}>
      <Stack line align="center" gap={isSwitch ? 16 : 8}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="checkbox__input"
        />
        {label ? (
          <Text element="span" type="body-medium">
            {label}
          </Text>
        ) : null}
        <span className="checkbox__control" aria-hidden="true" />
      </Stack>
    </label>
  );
}
