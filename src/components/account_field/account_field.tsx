"use client";

import "./account_field.scss";

import React, { useState } from "react";

import { Input, Select } from "@/components";
import { Icon } from "@/elements";
import { i18n } from "@/model/i18n";

type AccountFieldProps = {
  label: React.ReactNode;
  accounts: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
};

export function AccountField({
  label,
  accounts,
  value,
  onChange,
  placeholder,
  required = false,
}: AccountFieldProps): React.ReactElement {
  const hasMatchingAccount = accounts.includes(value);
  const [prefersCustomMode, setPrefersCustomMode] = useState(
    !hasMatchingAccount && !!value,
  );
  const isCustomMode = prefersCustomMode || (!hasMatchingAccount && !!value);

  const handleToggle = () => {
    setPrefersCustomMode((current) => {
      const next = !current;

      if (!next && !accounts.includes(value)) {
        onChange("");
      }

      return next;
    });
  };

  return (
    <div className="account-field">
      <div className="account-field__input">
        {isCustomMode ? (
          <div className="account-field__text-mode">
            <Input
              label={label}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              required={required}
            />
            <button
              type="button"
              className="account-field__toggle"
              onClick={handleToggle}
              aria-label={String(i18n.t("account_field.use_existing_account"))}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        ) : (
          <Select
            label={label}
            value={value}
            onChange={onChange}
            options={accounts.map((account) => ({
              value: account,
              label: account,
            }))}
            placeholder={placeholder}
            required={required}
            trailingContent={
              <button
                type="button"
                className="account-field__toggle"
                onClick={handleToggle}
                aria-label={String(i18n.t("account_field.edit_account_name"))}
              >
                <Icon name="edit" size={16} />
              </button>
            }
          />
        )}
      </div>
    </div>
  );
}
