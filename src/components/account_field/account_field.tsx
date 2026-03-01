"use client";

import "./account_field.scss";

import React, { useEffect, useMemo, useState } from "react";

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
  const hasMatchingAccount = useMemo(
    () => accounts.includes(value),
    [accounts, value],
  );
  const [isCustomMode, setIsCustomMode] = useState(
    !hasMatchingAccount && !!value,
  );

  useEffect(() => {
    if (value && !accounts.includes(value)) {
      setIsCustomMode(true);
    }
  }, [accounts, value]);

  const handleToggle = () => {
    setIsCustomMode((current) => {
      const next = !current;

      if (!next && !accounts.includes(value)) {
        onChange("");
      }

      return next;
    });
  };

  return (
    <div className="account-field">
      <div className="account-field__control">
        <div className="account-field__input">
          {isCustomMode ? (
            <Input
              label={label}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              required={required}
            />
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
            />
          )}
        </div>
        <button
          type="button"
          className="account-field__toggle"
          onClick={handleToggle}
          aria-label={String(
            isCustomMode
              ? i18n.t("account_field.use_existing_account")
              : i18n.t("account_field.add_new_account"),
          )}
        >
          <Icon name={isCustomMode ? "close" : "plus"} size={18} />
        </button>
      </div>
    </div>
  );
}
