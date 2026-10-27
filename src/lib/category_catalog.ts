import type { TransactionCategory } from "@prisma/client";
import type { IconName } from "@/elements/icon/icon_assets";

export interface TransactionCategoryMetadata {
  icon: IconName;
  labelKey: TransactionCategory;
  order: number;
  chartToken: "primary" | "success" | "danger" | "warning" | "info";
}

export const transactionCategoryCatalog = {
  shopping: {
    icon: "transactions",
    labelKey: "shopping",
    order: 0,
    chartToken: "primary",
  },
  food_groceries: {
    icon: "transactions",
    labelKey: "food_groceries",
    order: 1,
    chartToken: "success",
  },
  bars_restaurants: {
    icon: "transactions",
    labelKey: "bars_restaurants",
    order: 2,
    chartToken: "danger",
  },
  leisure_entertainment: {
    icon: "transactions",
    labelKey: "leisure_entertainment",
    order: 3,
    chartToken: "info",
  },
  housing_public_services: {
    icon: "spaces",
    labelKey: "housing_public_services",
    order: 4,
    chartToken: "warning",
  },
  transport_car: {
    icon: "transfer",
    labelKey: "transport_car",
    order: 5,
    chartToken: "primary",
  },
  atm: {
    icon: "transactions",
    labelKey: "atm",
    order: 6,
    chartToken: "warning",
  },
  income: {
    icon: "income",
    labelKey: "income",
    order: 7,
    chartToken: "success",
  },
  family_friends: {
    icon: "transactions",
    labelKey: "family_friends",
    order: 8,
    chartToken: "info",
  },
  insurance: {
    icon: "transactions",
    labelKey: "insurance",
    order: 9,
    chartToken: "warning",
  },
  pets: {
    icon: "transactions",
    labelKey: "pets",
    order: 10,
    chartToken: "info",
  },
  savings_investments: {
    icon: "transactions",
    labelKey: "savings_investments",
    order: 11,
    chartToken: "success",
  },
  health_personal_care: {
    icon: "transactions",
    labelKey: "health_personal_care",
    order: 12,
    chartToken: "danger",
  },
  travel: {
    icon: "transactions",
    labelKey: "travel",
    order: 13,
    chartToken: "primary",
  },
  subscriptions_digital_services: {
    icon: "transactions",
    labelKey: "subscriptions_digital_services",
    order: 14,
    chartToken: "info",
  },
  donations: {
    icon: "transactions",
    labelKey: "donations",
    order: 15,
    chartToken: "info",
  },
  uncategorized: {
    icon: "transactions",
    labelKey: "uncategorized",
    order: 16,
    chartToken: "warning",
  },
} satisfies Record<TransactionCategory, TransactionCategoryMetadata>;

export const transactionCategoryKeys = Object.keys(
  transactionCategoryCatalog,
) as TransactionCategory[];
