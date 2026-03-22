"use client";

import type { DashboardHeaderPayload } from "@/actions/transactions";
import {
  AppLink,
  Button,
  Hero,
  HeroMetric,
  HeroMetrics,
  LoadingSkeleton,
} from "@/components";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
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
            <Text as="h1" size="h1" color="hero" weight="bold">
              {formatCurrency(data.totals.net)}
            </Text>
          ) : (
            <LoadingSkeleton width="240px" height={58} radius={18} />
          )}

          <Text as="p" size="sm" color="hero-muted">
            {i18n.t("dashboard.hero_caption")}
          </Text>
        </Stack>

        {hasError && !data ? (
          <Stack gap={12} align="flex-start">
            <Text size="sm" color="hero-muted">
              {i18n.t("dashboard.header_load_failed")}
            </Text>
            <Button variant="outline" size="sm" onClick={retry}>
              {i18n.t("common.retry")}
            </Button>
          </Stack>
        ) : (
          <HeroMetrics columns={2}>
            <AppLink href={getCurrentMonthQuery(data, "income")}>
              <HeroMetric>
                <>
                  <Text as="span" size="xs" color="hero" weight="medium">
                    {i18n.t("dashboard.income")}
                  </Text>
                  {data ? (
                    <Text as="span" size="lg" color="hero" weight="semibold">
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
                  <Text as="span" size="xs" color="hero" weight="medium">
                    {i18n.t("dashboard.expenses")}
                  </Text>
                  {data ? (
                    <Text as="span" size="lg" color="hero" weight="semibold">
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
