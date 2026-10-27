import type { TransactionCategory } from "@prisma/client";
import type { IconName } from "@/elements/icon/icon_assets";

export interface TransactionCategoryMetadata {
  icon: IconName;
  labelKey: TransactionCategory;
  order: number;
  chartToken: `--color-category-${TransactionCategory}`;
}

export const transactionCategoryCatalog = {
  shopping: {
    icon: "shopping",
    labelKey: "shopping",
    order: 0,
    chartToken: "--color-category-shopping",
  },
  food_groceries: {
    icon: "groceries",
    labelKey: "food_groceries",
    order: 1,
    chartToken: "--color-category-food_groceries",
  },
  bars_restaurants: {
    icon: "restaurant",
    labelKey: "bars_restaurants",
    order: 2,
    chartToken: "--color-category-bars_restaurants",
  },
  leisure_entertainment: {
    icon: "entertainment",
    labelKey: "leisure_entertainment",
    order: 3,
    chartToken: "--color-category-leisure_entertainment",
  },
  housing_public_services: {
    icon: "housing",
    labelKey: "housing_public_services",
    order: 4,
    chartToken: "--color-category-housing_public_services",
  },
  transport_car: {
    icon: "transport",
    labelKey: "transport_car",
    order: 5,
    chartToken: "--color-category-transport_car",
  },
  atm: {
    icon: "atm",
    labelKey: "atm",
    order: 6,
    chartToken: "--color-category-atm",
  },
  income: {
    icon: "income",
    labelKey: "income",
    order: 7,
    chartToken: "--color-category-income",
  },
  family_friends: {
    icon: "family",
    labelKey: "family_friends",
    order: 8,
    chartToken: "--color-category-family_friends",
  },
  insurance: {
    icon: "insurance",
    labelKey: "insurance",
    order: 9,
    chartToken: "--color-category-insurance",
  },
  pets: {
    icon: "pets",
    labelKey: "pets",
    order: 10,
    chartToken: "--color-category-pets",
  },
  savings_investments: {
    icon: "investments",
    labelKey: "savings_investments",
    order: 11,
    chartToken: "--color-category-savings_investments",
  },
  health_personal_care: {
    icon: "health",
    labelKey: "health_personal_care",
    order: 12,
    chartToken: "--color-category-health_personal_care",
  },
  travel: {
    icon: "travel",
    labelKey: "travel",
    order: 13,
    chartToken: "--color-category-travel",
  },
  subscriptions_digital_services: {
    icon: "subscriptions",
    labelKey: "subscriptions_digital_services",
    order: 14,
    chartToken: "--color-category-subscriptions_digital_services",
  },
  donations: {
    icon: "donations",
    labelKey: "donations",
    order: 15,
    chartToken: "--color-category-donations",
  },
  uncategorized: {
    icon: "uncategorized",
    labelKey: "uncategorized",
    order: 16,
    chartToken: "--color-category-uncategorized",
  },
} satisfies Record<TransactionCategory, TransactionCategoryMetadata>;

export const transactionCategoryKeys = Object.keys(
  transactionCategoryCatalog,
) as TransactionCategory[];
