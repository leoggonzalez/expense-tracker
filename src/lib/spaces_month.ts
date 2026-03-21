import { addMonths, format, startOfMonth } from "date-fns";

export function parseSpacesMonth(currentMonth: string | undefined): Date {
  if (!currentMonth || !/^\d{4}-\d{2}$/.test(currentMonth)) {
    return startOfMonth(new Date());
  }

  const parsed = new Date(`${currentMonth}-01T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return startOfMonth(new Date());
  }

  return startOfMonth(parsed);
}

export function formatSpacesMonthLabel(
  date: Date,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    month: "long",
    year: "numeric",
  },
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatSpacesMonthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

export function getAdjacentSpacesMonthKey(
  monthKey: string,
  offset: number,
): string {
  return formatSpacesMonthKey(addMonths(parseSpacesMonth(monthKey), offset));
}
