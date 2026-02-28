import React from "react";
import "./checkbox.scss";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  className = "",
}: CheckboxProps): React.ReactElement {
  return (
    <label className={`checkbox ${className}`.trim()}>
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
