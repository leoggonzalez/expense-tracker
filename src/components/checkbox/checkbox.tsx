import React from "react";
import { Stack, Text } from "@/elements";
import "./checkbox.scss";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
}: CheckboxProps): React.ReactElement {
  return (
    <label className="checkbox">
      <Stack direction="row" align="center" gap={8}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="checkbox__input"
        />
        {label ? (
          <Text as="span" size="md" weight="medium">
            {label}
          </Text>
        ) : null}
      </Stack>
    </label>
  );
}
