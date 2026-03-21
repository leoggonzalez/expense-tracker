"use client";

import "./space_field.scss";

import React, { useState } from "react";

import type { NewTransactionSpacesPayload } from "@/actions/transactions";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import { Input, Select } from "@/components";
import { Icon, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

const createFlowSpacesCache = {
  entries: new Map<string, NewTransactionSpacesPayload>(),
};

type SpaceFieldProps = {
  label: React.ReactNode;
  spaces: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  loadSpacesOnMount?: boolean;
};

export function SpaceField({
  label,
  spaces,
  value,
  onChange,
  placeholder,
  required = false,
  loadSpacesOnMount = false,
}: SpaceFieldProps): React.ReactElement {
  const endpoint = "/api/transactions/new/spaces";
  const { data, hasError, retry } = useProtectedPageSection(
    endpoint,
    endpoint,
    createFlowSpacesCache,
  );
  const resolvedSpaces =
    loadSpacesOnMount && spaces.length === 0 ? (data?.spaces || []) : spaces;
  const hasMatchingSpace = resolvedSpaces.includes(value);
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
            options={resolvedSpaces.map((space) => ({
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

      {loadSpacesOnMount && hasError && spaces.length === 0 ? (
        <div className="space-field__status">
          <Stack direction="row" gap={8} align="center">
            <Text size="xs" color="secondary">
              {i18n.t("new_transaction_page.form_load_failed")}
            </Text>
            <button
              type="button"
              className="space-field__retry"
              onClick={retry}
            >
              {i18n.t("common.retry")}
            </button>
          </Stack>
        </div>
      ) : null}
    </div>
  );
}
