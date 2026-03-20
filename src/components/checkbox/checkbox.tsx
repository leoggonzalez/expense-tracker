import React from "react";
import { Stack, Text } from "@/elements";
import "./checkbox.scss";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
}

export function Checkbox({
  checked,
  onChange,
  label,
}: CheckboxProps): React.ReactElement {
  return (
    <label className="checkbox">
      <Stack direction="row" align="center" gap={8}>
        <input
          type="checkbox"
          checked={checked}
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
