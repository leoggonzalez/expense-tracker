"use client";

import React from "react";
import { AppLink } from "@/components/app_link/app_link";
import { getCategoryTransactionsHref } from "@/lib/category_allocation";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import type { CategoryAllocationChartItem } from "@/lib/category_allocation";
import { Icon, Stack, Text } from "@/elements";
import { transactionCategoryCatalog } from "@/lib/category_catalog";
import { formatCurrency } from "@/lib/utils";
import { i18n } from "@/model/i18n";

import "@/components/category_allocation_chart/category_allocation_chart.scss";

interface CategoryAllocationChartProps {
  categories: CategoryAllocationChartItem[];
  type: "expense" | "income";
  total: number;
  monthLabel: string;
  monthKey: string;
}

/** Accessible category amounts accompany the decorative donut for one transaction type. */
export function CategoryAllocationChart({
  categories,
  total,
  monthLabel,
  monthKey,
  type,
}: CategoryAllocationChartProps): React.ReactElement {
  const rows = React.useRef(new Map<string, HTMLLIElement>());
  const sequence = React.useRef(0);
  const [highlight, setHighlight] = React.useState<{
    category: string;
    sequence: number;
  } | null>(null);

  function highlightCategory(category: string): void {
    const row = rows.current.get(category);
    if (!row) return;
    row.scrollIntoView({
      block: "nearest",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
    // A fresh key restarts the CSS flash even when the same segment is clicked repeatedly.
    setHighlight({ category, sequence: ++sequence.current });
  }

  const percentage = new Intl.NumberFormat(i18n.locale, {
    style: "percent",
    maximumFractionDigits: 1,
  });
  const data = categories
    .filter((category) => category.amount > 0)
    .map((category) => ({
      ...category,
      name: String(i18n.t(`transaction_categories.${category.category}`)),
    }));

  return (
    <Stack gap={24}>
      <div
        className="category-allocation-chart__plot"
        role="img"
        aria-label={String(
          i18n.t("category_allocations.chart_summary", {
            month: monthLabel,
            total: formatCurrency(total),
            type: String(i18n.t(`category_allocations.${type}`)),
          }),
        )}
      >
        <div className="category-allocation-chart__donut" aria-hidden="true">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            initialDimension={{ width: 280, height: 260 }}
          >
            <PieChart accessibilityLayer={false}>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="name"
                innerRadius="68%"
                outerRadius="92%"
                startAngle={90}
                endAngle={-270}
                paddingAngle={data.length > 1 ? 2 : 0}
                cornerRadius={5}
                stroke="none"
                isAnimationActive={false}
                cursor="pointer"
                onClick={(_sector, index) => {
                  const category = data[index];
                  if (category) highlightCategory(category.category);
                }}
              >
                {data.map((category) => (
                  <Cell
                    key={category.category}
                    fill={`var(${transactionCategoryCatalog[category.category].chartToken})`}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="category-allocation-chart__center" aria-hidden="true">
          <Stack gap={4} align="center">
            <Text element="span" type="caption" color="secondary">
              {i18n.t(`category_allocations.${type}_total`)}
            </Text>
            <Text element="span" type="title-bold">
              {formatCurrency(total)}
            </Text>
          </Stack>
        </div>
      </div>
      <ul
        className="category-allocation-chart__legend"
        aria-label={String(i18n.t(`category_allocations.${type}_title`))}
      >
        {categories.map((category) => {
          const metadata = transactionCategoryCatalog[category.category];
          const share = total > 0 ? category.amount / total : 0;
          const isHighlighted = highlight?.category === category.category;
          return (
            <li
              key={`${category.category}-${isHighlighted ? highlight.sequence : "idle"}`}
              ref={(element) => {
                if (element) rows.current.set(category.category, element);
                else rows.current.delete(category.category);
              }}
              className={`category-allocation-chart__item${isHighlighted ? " category-allocation-chart__item--highlighted" : ""}`}
              data-highlighted={isHighlighted || undefined}
              onAnimationEnd={(event) => {
                if (event.target === event.currentTarget) {
                  setHighlight((current) =>
                    current?.category === category.category ? null : current,
                  );
                }
              }}
            >
              <AppLink
                href={getCategoryTransactionsHref(
                  monthKey,
                  category.category,
                  type,
                )}
                ariaLabel={String(
                  i18n.t("category_allocations.view_transactions", {
                    category: i18n.t(
                      `transaction_categories.${category.category}`,
                    ),
                    type: i18n.t(`category_allocations.${type}`),
                    month: monthLabel,
                  }),
                )}
              >
                <Stack
                  line
                  gap={12}
                  align="center"
                  justify="space-between"
                  fullWidth
                >
                  <Stack line gap={10} align="center">
                    <span
                      className={`category-allocation-chart__icon category-allocation-chart__icon--${category.category}`}
                    >
                      <Icon name={metadata.icon} size={18} />
                    </span>
                    <Text element="span" type="caption-medium">
                      {i18n.t(`transaction_categories.${metadata.labelKey}`)}
                    </Text>
                  </Stack>
                  <div className="category-allocation-chart__value">
                    <Text element="span" type="caption-semibold">
                      {formatCurrency(category.amount)}
                    </Text>
                    <Text element="span" type="fine" color="secondary">
                      <span
                        aria-label={String(
                          i18n.t("category_allocations.category_share", {
                            share: percentage.format(share),
                            type: String(
                              i18n.t(`category_allocations.${type}`),
                            ),
                          }),
                        )}
                      >
                        {percentage.format(share)}
                      </span>
                    </Text>
                  </div>
                </Stack>
              </AppLink>
            </li>
          );
        })}
      </ul>
    </Stack>
  );
}
