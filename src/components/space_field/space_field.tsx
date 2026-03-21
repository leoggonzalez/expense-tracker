"use client";

import "./space_field.scss";

import React, { useState } from "react";

import { Input, Select } from "@/components";
import { Icon } from "@/elements";
import { i18n } from "@/model/i18n";

type SpaceFieldProps = {
  label: React.ReactNode;
  spaces: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
};

export function SpaceField({
  label,
  spaces,
  value,
  onChange,
  placeholder,
  required = false,
}: SpaceFieldProps): React.ReactElement {
  const hasMatchingSpace = spaces.includes(value);
  const [prefersCustomMode, setPrefersCustomMode] = useState(
    !hasMatchingSpace && !!value,
  );
  const isCustomMode = prefersCustomMode || (!hasMatchingSpace && !!value);

  const handleToggle = () => {
    setPrefersCustomMode((current) => {
      const next = !current;

      if (!next && !spaces.includes(value)) {
        onChange("");
      }

      return next;
    });
  };

  return (
    <div className="space-field">
      <div className="space-field__input">
        {isCustomMode ? (
          <div className="space-field__text-mode">
            <Input
              label={label}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              required={required}
              hasTrailingControl
            />
            <button
              type="button"
              className="space-field__toggle"
              onClick={handleToggle}
              aria-label={String(i18n.t("space_field.use_existing_space"))}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        ) : (
          <Select
            label={label}
            value={value}
            onChange={onChange}
            options={spaces.map((space) => ({
              value: space,
              label: space,
            }))}
            placeholder={placeholder}
            required={required}
            trailingContent={
              <button
                type="button"
                className="space-field__toggle"
                onClick={handleToggle}
                aria-label={String(i18n.t("space_field.edit_space_name"))}
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
