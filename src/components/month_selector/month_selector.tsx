"use client";

import "./month_selector.scss";

import React from "react";

import { Input, Select } from "@/components";
import { Icon, Stack } from "@/elements";
import {
  EntryDateMode,
  normalizeDateValue,
  toModeValue,
} from "@/lib/entry_schedule";
import { i18n } from "@/model/i18n";

type MonthSelectorField = {
  value?: string;
  onChange: (value: string) => void;
};

type MonthSelectorProps = {
  label: React.ReactNode;
  mode: EntryDateMode;
  field?: MonthSelectorField;
  value?: string;
  onChange?: (value: string) => void;
  onEnableFullDate: () => void;
  editLabel: string;
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
  mode,
  field,
  value,
  onChange,
  onEnableFullDate,
  editLabel,
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

  if (mode === "date") {
    return (
      <Input
        label={label}
        type="date"
        value={toModeValue(fieldValue, "date")}
        onChange={handleFieldChange}
        required={required}
      />
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

  return (
    <div className="month-selector">
      <Stack gap={8}>
        <div className="month-selector__label">{label}</div>
        <Stack direction="row" gap={8} align="flex-end" wrap>
          <div className="month-selector__month-field">
            <Select
              label={monthLabel}
              value={month}
              onChange={updateMonth}
              options={getMonthOptions()}
              required={required}
            />
          </div>

          <div className="month-selector__year-field">
            <Select
              label={yearLabel}
              value={String(year)}
              onChange={updateYear}
              options={getYearOptions(year)}
              required={required}
            />
          </div>

          <button
            type="button"
            className="month-selector__toggle"
            onClick={onEnableFullDate}
            aria-label={editLabel}
          >
            <Icon name="edit" size={16} />
          </button>
        </Stack>
      </Stack>
    </div>
  );
}
