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
  spaces: Array<{
    id: string;
    name: string;
    main: boolean | null;
  }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  loadSpacesOnMount?: boolean;
  size?: "md" | "lg";
  surface?: "default" | "subtle";
  labelTone?: "primary" | "secondary";
};

export function SpaceField({
  label,
  spaces,
  value,
  onChange,
  placeholder,
  required = false,
  loadSpacesOnMount = false,
  size = "md",
  surface = "default",
  labelTone = "primary",
}: SpaceFieldProps): React.ReactElement {
  const endpoint = "/api/transactions/new/spaces";
  const { data, hasError, isLoading, retry } = useProtectedPageSection(
    endpoint,
    endpoint,
    createFlowSpacesCache,
  );
  const resolvedSpaces =
    loadSpacesOnMount && spaces.length === 0 ? data?.spaces || [] : spaces;
  const resolvedSpaceNames = resolvedSpaces.map((space) => space.name);
  const singleResolvedSpaceName =
    resolvedSpaces.length === 1 ? resolvedSpaces[0].name : null;
  const hasMatchingSpace = resolvedSpaceNames.includes(value);
  const [prefersCustomMode, setPrefersCustomMode] = useState(
    !hasMatchingSpace && !!value,
  );
  const isCustomMode = prefersCustomMode || (!hasMatchingSpace && !!value);

  React.useEffect(() => {
    if (value || isCustomMode || !singleResolvedSpaceName) {
      return;
    }

    onChange(singleResolvedSpaceName);
  }, [isCustomMode, onChange, singleResolvedSpaceName, value]);

  const handleToggle = () => {
    setPrefersCustomMode((current) => {
      const next = !current;

      if (!next && !resolvedSpaceNames.includes(value)) {
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
              size={size}
              surface={surface}
              labelTone={labelTone}
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
              value: space.name,
              label: space.name,
            }))}
            placeholder={placeholder}
            required={required}
            isLoading={loadSpacesOnMount && isLoading && spaces.length === 0}
            size={size}
            surface={surface}
            labelTone={labelTone}
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
