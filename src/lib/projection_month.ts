import { addMonths, format, startOfMonth } from "date-fns";

export function parseProjectionMonth(month: string | undefined): Date {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return startOfMonth(new Date());
  }

  const parsed = new Date(`${month}-01T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return startOfMonth(new Date());
  }

  return startOfMonth(parsed);
}

export function formatProjectionMonthKey(date: Date): string {
  return format(startOfMonth(date), "yyyy-MM");
}

export function getAdjacentProjectionMonthKey(
  monthKey: string,
  offset: number,
): string {
  return formatProjectionMonthKey(
    addMonths(parseProjectionMonth(monthKey), offset),
  );
}

export function formatProjectionMonthLabel(
  monthKey: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, options).format(
    parseProjectionMonth(monthKey),
  );
}
