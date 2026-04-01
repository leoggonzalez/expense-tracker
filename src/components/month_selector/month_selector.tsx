"use client";

import "./month_selector.scss";

import React, { useEffect, useRef, useState } from "react";

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
  surface?: "default" | "subtle";
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

function isFullDateValue(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isFullMonthValue(value: string): boolean {
  return /^\d{4}-\d{2}$/.test(value);
}

function toDateInputValue(value: string): string {
  if (isFullDateValue(value)) {
    return toModeValue(value, "date");
  }

  if (isFullMonthValue(value)) {
    return normalizeDateValue(value, "month");
  }

  return "";
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
  surface = "default",
}: MonthSelectorProps): React.ReactElement {
  const fieldValue = field?.value ?? value ?? "";
  const handleFieldChange = field?.onChange ?? onChange;

  if (!handleFieldChange) {
    throw new Error(
      "MonthSelector requires either field.onChange or onChange to be provided.",
    );
  }

  const [isDateMode, setIsDateMode] = useState(
    inferTransactionDateMode(fieldValue) === "date",
  );
  const lastCommittedValueRef = useRef(fieldValue);

  // eslint-disable-next-line warn-use-effect -- This effect mirrors the externally controlled field value into a local ref so partial native date edits can preserve the last committed value.
  useEffect(() => {
    if (fieldValue) {
      lastCommittedValueRef.current = fieldValue;
    }
  }, [fieldValue]);

  // eslint-disable-next-line warn-use-effect -- This effect keeps the local mode state synchronized with the externally controlled field value when it changes outside the selector.
  useEffect(() => {
    if (isFullDateValue(fieldValue)) {
      setIsDateMode(true);
      return;
    }

    if (isFullMonthValue(fieldValue)) {
      setIsDateMode(false);
    }
  }, [fieldValue]);

  const normalizedValue = toModeValue(
    normalizeDateValue(fieldValue, inferTransactionDateMode(fieldValue)),
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
  const stableValue = fieldValue || lastCommittedValueRef.current;
  const dateValue = isDateMode
    ? toDateInputValue(stableValue)
    : toDateInputValue(fieldValue);

  const switchToDateMode = (): void => {
    setIsDateMode(true);
    handleFieldChange(normalizeDateValue(stableValue, "month"));
  };

  const switchToMonthMode = (): void => {
    setIsDateMode(false);
    handleFieldChange(
      toModeValue(normalizeDateValue(stableValue, "date"), "month"),
    );
  };

  const handleDateChange = (nextValue: string): void => {
    if (!nextValue) {
      return;
    }

    handleFieldChange(nextValue);
  };

  return (
    <div
      className={["month-selector", `month-selector--surface-${surface}`].join(
        " ",
      )}
    >
      <Stack gap={8}>
        <Text as="div" size="sm" weight="medium" color="secondary">
          {label}
          {required && <span className="month-selector__required">*</span>}
        </Text>
        <div className="month-selector__control">
          <Box padding={12}>
            <div className="month-selector__inner">
              {isDateMode ? (
                <label className="month-selector__date-field">
                  <input
                    className="month-selector__date-input"
                    type="date"
                    value={dateValue}
                    onChange={(event) => handleDateChange(event.target.value)}
                    required={required}
                    aria-label={String(label)}
                  />
                </label>
              ) : (
                <>
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
                </>
              )}

              <button
                type="button"
                className="month-selector__toggle"
                onClick={isDateMode ? switchToMonthMode : switchToDateMode}
                aria-label={isDateMode ? closeLabel : editLabel}
              >
                <Icon name={isDateMode ? "close" : "edit"} size={16} />
              </button>
            </div>
          </Box>
        </div>
      </Stack>
    </div>
  );
}
