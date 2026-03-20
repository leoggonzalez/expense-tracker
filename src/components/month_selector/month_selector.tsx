"use client";

import "./month_selector.scss";

import React from "react";

import { Input } from "@/components";
import { Box, Icon, Stack, Text } from "@/elements";
import {
  inferTransactionDateMode,
  normalizeDateValue,
  toModeValue,
} from "@/lib/transaction_schedule";
import { i18n } from "@/model/i18n";

type MonthSelectorField = {
  value?: string;
  onChange: (value: string) => void;
};

type MonthSelectorProps = {
  label: React.ReactNode;
  field?: MonthSelectorField;
  value?: string;
  onChange?: (value: string) => void;
  editLabel: string;
  closeLabel: string;
  monthLabel: React.ReactNode;
  yearLabel: React.ReactNode;
  required?: boolean;
};

function getMonthOptions(): Array<{ value: string; label: string }> {
  const locale = i18n.locale || "en";

  return Array.from({ length: 12 }, (_, index) => {
    const monthIndex = index + 1;
    const monthValue = String(monthIndex).padStart(2, "0");
    const monthLabel = new Intl.DateTimeFormat(locale, {
      month: "long",
    }).format(new Date(2000, index, 1));

    return {
      value: monthValue,
      label: monthLabel,
    };
  });
}

function getYearOptions(
  selectedYear: number,
): Array<{ value: string; label: string }> {
  const currentYear = new Date().getFullYear();
  const endYear = currentYear + 20;
  const years = [];

  for (let year = currentYear; year <= endYear; year += 1) {
    years.push(year);
  }

  if (!years.includes(selectedYear)) {
    years.push(selectedYear);
  }

  return years
    .sort((a, b) => a - b)
    .map((year) => ({
      value: String(year),
      label: String(year),
    }));
}

export function MonthSelector({
  label,
  field,
  value,
  onChange,
  editLabel,
  closeLabel,
  monthLabel,
  yearLabel,
  required = false,
}: MonthSelectorProps): React.ReactElement {
  const fieldValue = field?.value ?? value ?? "";
  const handleFieldChange = field?.onChange ?? onChange;

  if (!handleFieldChange) {
    throw new Error(
      "MonthSelector requires either field.onChange or onChange to be provided.",
    );
  }

  const mode = inferTransactionDateMode(fieldValue);

  if (mode === "date") {
    return (
      <div className="month-selector">
        <Stack gap={8}>
          <Text as="div" size="sm" weight="medium" color="secondary">
            {label}
            {required && <span className="month-selector__required">*</span>}
          </Text>
          <div className="month-selector__date-mode">
            <Input
              type="date"
              value={toModeValue(fieldValue, "date")}
              onChange={handleFieldChange}
              required={required}
            />
            <button
              type="button"
              className="month-selector__toggle"
              onClick={() =>
                handleFieldChange(
                  toModeValue(normalizeDateValue(fieldValue, "date"), "month"),
                )
              }
              aria-label={closeLabel}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </Stack>
      </div>
    );
  }

  const normalizedValue = toModeValue(
    normalizeDateValue(fieldValue, mode),
    "month",
  );
  const [yearRaw, monthRaw] = normalizedValue.split("-");
  const fallbackDate = new Date();
  const year = Number(yearRaw || fallbackDate.getFullYear());
  const month =
    monthRaw || String(fallbackDate.getMonth() + 1).padStart(2, "0");

  const updateMonth = (nextMonth: string): void => {
    handleFieldChange(`${year}-${nextMonth}`);
  };

  const updateYear = (nextYear: string): void => {
    handleFieldChange(`${nextYear}-${month}`);
  };
  const monthOptions = getMonthOptions();
  const yearOptions = getYearOptions(year);
  const selectedMonthLabel =
    monthOptions.find((option) => option.value === month)?.label || month;

  return (
    <div className="month-selector">
      <Stack gap={8}>
        <Text as="div" size="sm" weight="medium" color="secondary">
          {label}
        </Text>
        <div className="month-selector__control">
          <Box padding={12}>
            <Stack direction="row" align="center" gap={8} fullWidth>
              <label className="month-selector__tag">
                <Text as="span" size="sm" weight="semibold">
                  {selectedMonthLabel}
                </Text>
                <select
                  className="month-selector__native-select"
                  value={month}
                  onChange={(event) => updateMonth(event.target.value)}
                  required={required}
                  aria-label={String(monthLabel)}
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="month-selector__tag">
                <Text as="span" size="sm" weight="semibold">
                  {year}
                </Text>
                <select
                  className="month-selector__native-select"
                  value={String(year)}
                  onChange={(event) => updateYear(event.target.value)}
                  required={required}
                  aria-label={String(yearLabel)}
                >
                  {yearOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className="month-selector__toggle"
                onClick={() =>
                  handleFieldChange(normalizeDateValue(fieldValue, "month"))
                }
                aria-label={editLabel}
              >
                <Icon name="edit" size={16} />
              </button>
            </Stack>
          </Box>
        </div>
      </Stack>
    </div>
  );
}
