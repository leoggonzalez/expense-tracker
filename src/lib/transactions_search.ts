import { endOfMonth } from "date-fns";
import type { TransactionCategory } from "@prisma/client";
import { transactionCategoryKeys } from "@/lib/category_catalog";
import type { TransactionFiltersInput } from "@/lib/transaction";
import { inferTransactionDateMode, toDate } from "@/lib/transaction_schedule";

export type NormalizedTransactionsFilters = {
  page: number;
  space: string;
  category: TransactionCategory | "";
  month: string;
  type: "" | "income" | "expense" | "transfer";
  startDate: string;
  endDate: string;
  searchTerms: string[];
};

function getFirstValue(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];

  return Array.isArray(value) ? value[0] : value;
}

export function normalizeTransactionsFilters(
  params: Record<string, string | string[] | undefined>,
): NormalizedTransactionsFilters {
  const page = Math.max(1, Number(getFirstValue(params, "page") || "1") || 1);
  const space = getFirstValue(params, "space") || "";
  const rawType = getFirstValue(params, "type");
  const type =
    rawType === "income" || rawType === "expense" || rawType === "transfer"
      ? rawType
      : "";
  const rawCategory = getFirstValue(params, "category") || "";
  const category = transactionCategoryKeys.includes(
    rawCategory as TransactionCategory,
  )
    ? (rawCategory as TransactionCategory)
    : "";
  const rawMonth = getFirstValue(params, "month") || "";
  const month =
    /^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth) && Number(rawMonth.slice(0, 4)) > 0
      ? rawMonth
      : "";
  const startDate = getFirstValue(params, "start_date") || "";
  const endDate = getFirstValue(params, "end_date") || "";
  const rawSearchTerms = Array.isArray(params.search)
    ? params.search
    : params.search
      ? [params.search]
      : [];
  const searchTerms = Array.from(
    new Set(rawSearchTerms.map((term) => term.trim()).filter(Boolean)),
  );

  return {
    page,
    space,
    category,
    month,
    type,
    startDate,
    endDate,
    searchTerms,
  };
}

export function normalizeTransactionsFiltersFromUrlSearchParams(
  searchParams: URLSearchParams,
): NormalizedTransactionsFilters {
  return normalizeTransactionsFilters({
    page: searchParams.get("page") || undefined,
    space: searchParams.get("space") || undefined,
    category: searchParams.get("category") || undefined,
    month: searchParams.get("month") || undefined,
    type: searchParams.get("type") || undefined,
    start_date: searchParams.get("start_date") || undefined,
    end_date: searchParams.get("end_date") || undefined,
    search: searchParams.getAll("search"),
  });
}

export function buildTransactionsFiltersQuery(
  filters: NormalizedTransactionsFilters,
): string {
  const searchParams = new URLSearchParams();

  if (filters.space) {
    searchParams.set("space", filters.space);
  }

  if (filters.category) searchParams.set("category", filters.category);
  if (filters.month) searchParams.set("month", filters.month);

  if (filters.type) {
    searchParams.set("type", filters.type);
  }

  if (filters.startDate) {
    searchParams.set("start_date", filters.startDate);
  }

  if (filters.endDate) {
    searchParams.set("end_date", filters.endDate);
  }

  filters.searchTerms.forEach((term) => {
    searchParams.append("search", term);
  });

  if (filters.page > 1) {
    searchParams.set("page", String(filters.page));
  }

  return searchParams.toString();
}

export function toTransactionFiltersInput(
  filters: NormalizedTransactionsFilters,
): TransactionFiltersInput {
  const parsedStartDate = filters.startDate
    ? toDate(filters.startDate, inferTransactionDateMode(filters.startDate))
    : undefined;
  const parsedEndDate = filters.endDate
    ? toDate(filters.endDate, inferTransactionDateMode(filters.endDate))
    : undefined;

  return {
    spaceId: filters.space || undefined,
    category: filters.category || undefined,
    reportingMonth: filters.month
      ? new Date(`${filters.month}-01T00:00:00`)
      : undefined,
    type: filters.type || undefined,
    searchTerms: filters.searchTerms,
    startDate: parsedStartDate || undefined,
    endDate:
      parsedEndDate && filters.endDate.length <= 7
        ? endOfMonth(parsedEndDate)
        : parsedEndDate || undefined,
    page: filters.page,
    limit: 20,
  };
}
