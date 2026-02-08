import { format as dateFnsFormat } from "date-fns";

/**
 * Format a number as currency (Euro)
 */
export function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  return `${sign}${absAmount.toFixed(2)} €`;
}

/**
 * Format a date for display
 */
export function formatDate(
  date: Date,
  formatStr: string = "MMM dd, yyyy",
): string {
  return dateFnsFormat(date, formatStr);
}

/**
 * Format a date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().split("T")[0];
}

/**
 * Parse a date string from input field
 */
export function parseDateFromInput(dateStr: string): Date | null {
  if (!dateStr) return null;
  return new Date(dateStr);
}

/**
 * Format month/year for display
 */
export function formatMonth(date: Date): string {
  return dateFnsFormat(date, "MMMM yyyy");
}

/**
 * Format month for input (YYYY-MM)
 */
export function formatMonthForInput(date: Date): string {
  return dateFnsFormat(date, "yyyy-MM");
}
