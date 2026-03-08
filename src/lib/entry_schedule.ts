import {
  addMonths,
  differenceInCalendarMonths,
  format,
  startOfMonth,
} from "date-fns";

export type EntryDateMode = "month" | "date";
export type EntryScheduleMode = "one_time" | "installments" | "unlimited";

export function normalizeDateValue(value: string, mode: EntryDateMode): string {
  if (!value) {
    return "";
  }

  return mode === "month" ? `${value}-01` : value;
}

export function toDate(value: string, mode: EntryDateMode): Date | null {
  const normalized = normalizeDateValue(value, mode);

  if (!normalized) {
    return null;
  }

  return new Date(normalized);
}

export function toModeValue(value: string, mode: EntryDateMode): string {
  if (!value) {
    return "";
  }

  return mode === "month"
    ? value.slice(0, 7)
    : normalizeDateValue(value, "date");
}

export function clampInstallments(installments: number): number {
  return Math.min(120, Math.max(1, installments));
}

export function getInstallmentEndDate(
  beginDate: Date,
  installments: number,
): Date {
  return addMonths(beginDate, clampInstallments(installments) - 1);
}

export function resolveEndDate(params: {
  scheduleMode: EntryScheduleMode;
  beginDate: Date;
  installments: number;
}): Date | null {
  const { scheduleMode, beginDate, installments } = params;

  if (scheduleMode === "unlimited") {
    return null;
  }

  if (scheduleMode === "one_time") {
    return beginDate;
  }

  return getInstallmentEndDate(beginDate, installments);
}

export function deriveScheduleFromDates(params: {
  beginDate: Date;
  endDate: Date | null;
}): {
  scheduleMode: EntryScheduleMode;
  installments: number;
} {
  const { beginDate, endDate } = params;

  if (!endDate) {
    return {
      scheduleMode: "unlimited",
      installments: 1,
    };
  }

  const beginMonth = format(startOfMonth(beginDate), "yyyy-MM");
  const endMonth = format(startOfMonth(endDate), "yyyy-MM");

  if (beginMonth === endMonth) {
    return {
      scheduleMode: "one_time",
      installments: 1,
    };
  }

  const installments = clampInstallments(
    differenceInCalendarMonths(startOfMonth(endDate), startOfMonth(beginDate)) +
      1,
  );

  return {
    scheduleMode: "installments",
    installments,
  };
}
