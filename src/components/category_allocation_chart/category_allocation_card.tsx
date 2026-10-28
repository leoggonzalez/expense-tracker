"use client";

import React from "react";

import { LoadingSkeleton } from "@/components/loading_skeleton/loading_skeleton";
import { CategoryAllocationChart } from "@/components/category_allocation_chart/category_allocation_chart";
import { SectionError } from "@/components/section_error/section_error";
import { Card, Stack, Text } from "@/elements";
import type { CategoryAllocationChartItem } from "@/lib/category_allocation";
import { i18n } from "@/model/i18n";

interface CategoryAllocationCardProps {
  type: "expense" | "income";
  categories: CategoryAllocationChartItem[];
  total: number;
  monthLabel: string;
  monthKey: string;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
}

/** Presents one side of the monthly allocation snapshot, with independent empty-state copy. */
export function CategoryAllocationCard({
  type,
  categories,
  total,
  monthLabel,
  monthKey,
  isLoading,
  hasError,
  onRetry,
}: CategoryAllocationCardProps): React.ReactElement {
  return (
    <Card
      as="section"
      padding={24}
      title={String(i18n.t(`category_allocations.${type}_title`))}
      icon={type}
      fullHeight
    >
      <Stack gap={16}>
        <Text element="p" type="caption-medium" color="secondary">
          {monthLabel}
        </Text>
        {hasError ? (
          <SectionError
            message={i18n.t("category_allocations.load_failed")}
            retryLabel={i18n.t("common.retry")}
            onRetry={onRetry}
          />
        ) : isLoading ? (
          <Stack gap={24}>
            <Stack align="center">
              <LoadingSkeleton width="240px" height={240} radius={120} />
            </Stack>
            <LoadingSkeleton height={42} radius={12} />
            <LoadingSkeleton height={42} radius={12} />
            <LoadingSkeleton height={42} radius={12} />
          </Stack>
        ) : total > 0 ? (
          <CategoryAllocationChart
            categories={categories}
            total={total}
            monthLabel={monthLabel}
            monthKey={monthKey}
            type={type}
          />
        ) : (
          <Text element="p" color="secondary">
            {i18n.t(`category_allocations.${type}_empty`)}
          </Text>
        )}
        <Text element="p" type="fine" color="secondary">
          {i18n.t(`category_allocations.${type}_description`)}
        </Text>
      </Stack>
    </Card>
  );
}
