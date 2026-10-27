"use client";

import React from "react";

import type { DashboardAllocationsPayload } from "@/actions/transactions";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import { CategoryAllocationCard } from "@/components/category_allocation_chart/category_allocation_card";
import { Grid } from "@/elements";
import { getCategoryAllocationsForType } from "@/lib/category_allocation";
import { formatProjectionMonthLabel } from "@/lib/projection_month";
import { i18n } from "@/model/i18n";

export function DashboardAllocations(): React.ReactElement {
  // Keep a single private snapshot for both cards, without a cross-account module cache.
  const { data, isLoading, hasError, retry } =
    useProtectedPageSection<DashboardAllocationsPayload>(
      "/api/dashboard/allocations",
      "/api/dashboard/allocations",
      { entries: new Map() },
    );
  const monthLabel = data
    ? formatProjectionMonthLabel(data.monthKey, i18n.locale, {
        month: "long",
        year: "numeric",
      })
    : String(i18n.t("category_allocations.current_month"));

  return (
    <Grid minColumnWidth={360} gap={24}>
      {(["expense", "income"] as const).map((type) => (
        <CategoryAllocationCard
          key={type}
          type={type}
          categories={getCategoryAllocationsForType(
            data?.categories ?? [],
            type,
          )}
          total={data?.[type] ?? 0}
          monthLabel={monthLabel}
          isLoading={isLoading && !data}
          hasError={hasError && !data}
          onRetry={retry}
        />
      ))}
    </Grid>
  );
}
