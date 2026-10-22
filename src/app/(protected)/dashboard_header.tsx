"use client";

import { SectionError } from "@/components/section_error/section_error";

import type { DashboardHeaderPayload } from "@/actions/transactions";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import {
  AppLink,
  Hero,
  HeroMetric,
  HeroMetrics,
  LoadingSkeleton,
} from "@/components";
import { Stack, Text } from "@/elements";
import { formatCurrency } from "@/lib/utils";
import { i18n } from "@/model/i18n";

import React from "react";

const dashboardHeaderCache = {
  entries: new Map<string, DashboardHeaderPayload>(),
};

function getCurrentMonthQuery(
  payload: DashboardHeaderPayload | null,
  type?: "income" | "expense",
): string {
  const searchParams = new URLSearchParams();

  if (payload) {
    searchParams.set("start_date", payload.currentMonthRange.startDate);
    searchParams.set("end_date", payload.currentMonthRange.endDate);
  }

  if (type) {
    searchParams.set("type", type);
  }

  const query = searchParams.toString();
  return query ? `/transactions?${query}` : "/transactions";
}

export function DashboardHeader(): React.ReactElement {
  const { data, isLoading, hasError, retry } = useProtectedPageSection(
    "/api/dashboard/header",
    "/api/dashboard/header",
    dashboardHeaderCache,
  );

  return (
    <Hero
      icon="dashboard"
      title={String(i18n.t("dashboard.hero_label"))}
      pattern="dashboard"
      isBodyLoading={isLoading}
    >
      <Stack gap={24}>
        <Stack gap={10}>
          {data ? (
            <Text element="h1" type="h1-bold" color="hero">
              {formatCurrency(data.totals.net)}
            </Text>
          ) : (
            <LoadingSkeleton width="240px" height={58} radius={18} />
          )}

          <Text element="p" type="caption" color="hero-muted">
            {i18n.t("dashboard.hero_caption")}
          </Text>
        </Stack>

        {hasError && !data ? (
          <SectionError
            tone="inverse"
            message={i18n.t("dashboard.header_load_failed")}
            retryLabel={i18n.t("common.retry")}
            onRetry={retry}
          />
        ) : (
          <HeroMetrics columns={2}>
            <AppLink href={getCurrentMonthQuery(data, "income")}>
              <HeroMetric>
                <>
                  <Text element="span" type="fine-medium" color="hero">
                    {i18n.t("dashboard.income")}
                  </Text>
                  {data ? (
                    <Text element="span" type="lead-semibold" color="hero">
                      {formatCurrency(data.totals.income)}
                    </Text>
                  ) : (
                    <LoadingSkeleton width="140px" height={28} radius={12} />
                  )}
                </>
              </HeroMetric>
            </AppLink>

            <AppLink href={getCurrentMonthQuery(data, "expense")}>
              <HeroMetric tone="soft">
                <>
                  <Text element="span" type="fine-medium" color="hero">
                    {i18n.t("dashboard.expenses")}
                  </Text>
                  {data ? (
                    <Text element="span" type="lead-semibold" color="hero">
                      {formatCurrency(Math.abs(data.totals.expense))}
                    </Text>
                  ) : (
                    <LoadingSkeleton width="140px" height={28} radius={12} />
                  )}
                </>
              </HeroMetric>
            </AppLink>
          </HeroMetrics>
        )}
      </Stack>
    </Hero>
  );
}
