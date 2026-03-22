import { endOfMonth } from "date-fns";
import type { TransactionFiltersInput } from "@/lib/transaction";
import { inferTransactionDateMode, toDate } from "@/lib/transaction_schedule";

export type NormalizedTransactionsFilters = {
  page: number;
  space: string;
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
    type,
    startDate,
    endDate,
    searchTerms,
  };
}

export function normalizeTransactionsFiltersFromUrlSearchParams(
  searchParams: URLSearchParams,
): NormalizedTransactionsFilters {
  const rawSearchTerms = searchParams
    .getAll("search")
    .map((term) => term.trim())
    .filter(Boolean);

  return {
    page: Math.max(1, Number(searchParams.get("page") || "1") || 1),
    space: searchParams.get("space") || "",
    type: ["income", "expense", "transfer"].includes(
      searchParams.get("type") || "",
    )
      ? (searchParams.get("type") as "income" | "expense" | "transfer")
      : "",
    startDate: searchParams.get("start_date") || "",
    endDate: searchParams.get("end_date") || "",
    searchTerms: Array.from(new Set(rawSearchTerms)),
  };
}

export function buildTransactionsFiltersQuery(
  filters: NormalizedTransactionsFilters,
): string {
  const searchParams = new URLSearchParams();

  if (filters.space) {
    searchParams.set("space", filters.space);
  }

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
