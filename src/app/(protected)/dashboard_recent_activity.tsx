"use client";

import type {
  DashboardRecentActivityPayload,
  DashboardTransactionItem,
} from "@/actions/transactions";
import { useDashboardSection } from "@/app/(protected)/use_dashboard_section";
import {
  AppLink,
  Button,
  LoadingSkeleton,
  TransactionList,
} from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

import React from "react";

const dashboardRecentActivityCache: {
  data: DashboardRecentActivityPayload | null;
} = {
  data: null,
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
      <Stack
        direction="row"
        align="center"
        justify="space-between"
        gap={16}
        fullWidth
      >
        <Stack direction="row" align="center" gap={12}>
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
  const { data, isLoading, hasError, retry } = useDashboardSection(
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
        <Text size="sm" color="secondary">
          {i18n.t("dashboard.activity_subtitle")}
        </Text>
        <Text as="div" size="sm" weight="medium">
          <AppLink href={getRecentTransactionsHref(data)}>
            {i18n.t("dashboard.recent_activity_link")}
          </AppLink>
        </Text>

        {hasError && !data ? (
          <Stack gap={12} align="flex-start">
            <Text color="secondary">
              {i18n.t("dashboard.recent_activity_load_failed")}
            </Text>
            <Button variant="secondary" size="sm" onClick={retry}>
              {i18n.t("common.retry")}
            </Button>
          </Stack>
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
