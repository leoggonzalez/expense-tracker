import type { TransactionCategory } from "@prisma/client";

/** Minimum chart data for a single transaction type, without combined-category counts. */
export interface CategoryAllocationChartItem {
  category: TransactionCategory;
  amount: number;
  type: "expense" | "income";
}

/** Select the chosen side of mixed categories and sort by that card’s amounts. Percentages use the matching type’s total. */
export function getCategoryAllocationsForType(
  categories: readonly {
    category: TransactionCategory;
    income: number;
    expense: number;
  }[],
  type: "expense" | "income",
): CategoryAllocationChartItem[] {
  return categories
    .filter((category) => category[type] > 0)
    .map((category) => ({
      category: category.category,
      amount: category[type],
      type,
    }))
    .sort(
      (left, right) =>
        right.amount - left.amount ||
        left.category.localeCompare(right.category),
    );
}
