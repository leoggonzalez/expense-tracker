import React from "react";
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
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="checkbox__input"
      />
      {label && <span className="checkbox__label">{label}</span>}
    </label>
  );
}
