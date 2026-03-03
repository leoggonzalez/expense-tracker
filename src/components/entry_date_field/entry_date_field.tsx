import "./entry_date_field.scss";

import React from "react";

import { Input } from "@/components/input/input";
import { Icon } from "@/elements";

export type EntryDateFieldMode = "month" | "date";

type EntryDateFieldProps = {
  label: React.ReactNode;
  mode: EntryDateFieldMode;
  value: string;
  onChange: (value: string) => void;
  onEnableFullDate: () => void;
  editLabel: string;
  required?: boolean;
};

export function EntryDateField({
  label,
  mode,
  value,
  onChange,
  onEnableFullDate,
  editLabel,
  required = false,
}: EntryDateFieldProps): React.ReactElement {
  return (
    <div className="entry-date-field">
      <div className="entry-date-field__input">
        <Input
          label={label}
          type={mode}
          value={value}
          onChange={onChange}
          required={required}
        />
      </div>
      {mode === "month" && (
        <button
          type="button"
          className="entry-date-field__toggle"
          onClick={onEnableFullDate}
          aria-label={editLabel}
        >
          <Icon name="edit" size={16} />
        </button>
      )}
    </div>
  );
}
