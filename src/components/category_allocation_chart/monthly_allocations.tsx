"use client";

import React from "react";

import type { DashboardAllocationsPayload } from "@/actions/transactions";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import { CategoryAllocationCard } from "@/components/category_allocation_chart/category_allocation_card";
import { Grid } from "@/elements";
import { getCategoryAllocationsForType } from "@/lib/category_allocation";
import { formatProjectionMonthLabel } from "@/lib/projection_month";
import { i18n } from "@/model/i18n";

interface MonthlyAllocationsProps {
  monthKey?: string;
}

/** One private month snapshot drives both allocation cards on dashboard and projection routes. */
export function MonthlyAllocations({
  monthKey,
}: MonthlyAllocationsProps): React.ReactElement {
  const endpoint = monthKey
    ? `/api/projection/allocations?month=${encodeURIComponent(monthKey)}`
    : "/api/dashboard/allocations";
  // Keep a single private snapshot for both cards, without a cross-account module cache.
  const { data, isLoading, hasError, retry } =
    useProtectedPageSection<DashboardAllocationsPayload>(endpoint, endpoint, {
      entries: new Map(),
    });
  const visibleData = !monthKey || data?.monthKey === monthKey ? data : null;
  const displayedMonth = monthKey ?? visibleData?.monthKey;
  const monthLabel = displayedMonth
    ? formatProjectionMonthLabel(displayedMonth, i18n.locale, {
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
            visibleData?.categories ?? [],
            type,
          )}
          total={visibleData?.[type] ?? 0}
          monthLabel={monthLabel}
          monthKey={displayedMonth ?? ""}
          isLoading={!visibleData && (isLoading || !hasError)}
          hasError={hasError && !visibleData}
          onRetry={retry}
        />
      ))}
    </Grid>
  );
}
