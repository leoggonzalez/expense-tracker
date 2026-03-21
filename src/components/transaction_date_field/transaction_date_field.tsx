import "./transaction_date_field.scss";

import React from "react";

import { Input } from "@/components/input/input";
import { Icon, Stack } from "@/elements";

export type TransactionDateFieldMode = "month" | "date";

type TransactionDateFieldProps = {
  label: React.ReactNode;
  mode: TransactionDateFieldMode;
  value: string;
  onChange: (value: string) => void;
  onEnableFullDate: () => void;
  editLabel: string;
  required?: boolean;
};

export function TransactionDateField({
  label,
  mode,
  value,
  onChange,
  onEnableFullDate,
  editLabel,
  required = false,
}: TransactionDateFieldProps): React.ReactElement {
  return (
    <div className="transaction-date-field">
      <Stack direction="row" align="flex-end" gap={8} fullWidth>
        <div className="transaction-date-field__input">
          <Input
            label={label}
            type={mode}
            value={value}
            onChange={onChange}
            required={required}
            fullWidth
          />
        </div>
        {mode === "month" && (
          <button
            type="button"
            className="transaction-date-field__toggle"
            onClick={onEnableFullDate}
            aria-label={editLabel}
          >
            <Icon name="edit" size={16} />
          </button>
        )}
      </Stack>
    </div>
  );
}
