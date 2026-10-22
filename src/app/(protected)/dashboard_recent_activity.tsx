"use client";

import { SectionError } from "@/components/section_error/section_error";

import type {
  DashboardRecentActivityPayload,
  DashboardTransactionItem,
} from "@/actions/transactions";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import { AppLink, LoadingSkeleton, TransactionList } from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

import React from "react";

const dashboardRecentActivityCache: {
  entries: Map<string, DashboardRecentActivityPayload>;
} = {
  entries: new Map<string, DashboardRecentActivityPayload>(),
};

function getRecentTransactionsHref(
  payload: DashboardRecentActivityPayload | null,
): string {
  const searchParams = new URLSearchParams();

  if (payload) {
    searchParams.set("start_date", payload.currentMonthRange.startDate);
    searchParams.set("end_date", payload.currentMonthRange.endDate);
  }

  const query = searchParams.toString();
  return query ? `/transactions?${query}` : "/transactions";
}

function RecentActivityRowSkeleton(): React.ReactElement {
  return (
    <Card padding={20}>
      <Stack line align="center" justify="space-between" gap={16} fullWidth>
        <Stack line align="center" gap={12}>
          <LoadingSkeleton width="40px" height={40} radius={999} />
          <Stack gap={8}>
            <LoadingSkeleton width="148px" height={20} radius={10} />
            <LoadingSkeleton width="92px" height={14} radius={8} />
          </Stack>
        </Stack>
        <LoadingSkeleton width="88px" height={22} radius={10} />
      </Stack>
    </Card>
  );
}

export function DashboardRecentActivity(): React.ReactElement {
  const { data, isLoading, hasError, retry } = useProtectedPageSection(
    "/api/dashboard/recent-activity",
    "/api/dashboard/recent-activity",
    dashboardRecentActivityCache,
  );

  return (
    <Card
      as="section"
      padding={24}
      title={String(i18n.t("dashboard.recent_transactions"))}
      icon="activity"
      fullHeight
    >
      <Stack gap={20}>
        <Text element="p" type="caption" color="secondary">
          {i18n.t("dashboard.activity_subtitle")}
        </Text>
        <Text element="div" type="caption-medium">
          <AppLink href={getRecentTransactionsHref(data)}>
            {i18n.t("dashboard.recent_activity_link")}
          </AppLink>
        </Text>

        {hasError && !data ? (
          <SectionError
            message={i18n.t("dashboard.recent_activity_load_failed")}
            retryLabel={i18n.t("common.retry")}
            onRetry={retry}
          />
        ) : isLoading && !data ? (
          <Stack gap={12}>
            <RecentActivityRowSkeleton />
            <RecentActivityRowSkeleton />
            <RecentActivityRowSkeleton />
          </Stack>
        ) : (
          <TransactionList
            transactions={
              (data?.recentTransactions || []) as DashboardTransactionItem[]
            }
            showDelete={false}
            transactionHrefBase="/transactions"
          />
        )}
      </Stack>
    </Card>
  );
}
