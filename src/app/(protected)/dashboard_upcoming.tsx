"use client";

import type { DashboardUpcomingPayload } from "@/actions/transactions";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import { AppLink, Button, LoadingSkeleton } from "@/components";
import { Card, Stack, Text } from "@/elements";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { i18n } from "@/model/i18n";

import React from "react";

const dashboardUpcomingCache = {
  entries: new Map<string, DashboardUpcomingPayload>(),
};

function getUpcomingTransactionsHref(
  payload: DashboardUpcomingPayload | null,
): string {
  const searchParams = new URLSearchParams();

  if (payload) {
    searchParams.set("start_date", payload.currentMonthRange.startDate);
    searchParams.set("end_date", payload.currentMonthRange.endDate);
  }

  searchParams.set("type", "expense");

  return `/transactions?${searchParams.toString()}`;
}

function formatPaymentDate(beginDate: string): string {
  return format(new Date(beginDate), "MMM d");
}

function UpcomingPaymentRowSkeleton(): React.ReactElement {
  return (
    <Card variant="secondary" radius={24} padding={18}>
      <Stack
        direction="row"
        align="center"
        justify="space-between"
        gap={16}
        fullWidth
      >
        <Stack gap={8} align="flex-start">
          <LoadingSkeleton width="120px" height={20} radius={10} />
          <LoadingSkeleton width="96px" height={14} radius={8} />
        </Stack>
        <Stack gap={8} align="flex-end">
          <LoadingSkeleton width="92px" height={20} radius={10} />
          <LoadingSkeleton width="76px" height={14} radius={8} />
        </Stack>
      </Stack>
    </Card>
  );
}

export function DashboardUpcoming(): React.ReactElement {
  const { data, isLoading, hasError, retry } = useProtectedPageSection(
    "/api/dashboard/upcoming",
    "/api/dashboard/upcoming",
    dashboardUpcomingCache,
  );

  return (
    <Card
      as="section"
      padding={24}
      title={String(i18n.t("dashboard.upcoming_payments"))}
      icon="calendar"
      fullHeight
    >
      <Stack gap={20}>
        <Text as="div" size="sm" weight="medium">
          <AppLink href={getUpcomingTransactionsHref(data)}>
            {i18n.t("dashboard.upcoming_payments_link")}
          </AppLink>
        </Text>

        {hasError && !data ? (
          <Stack gap={12} align="flex-start">
            <Text color="secondary">
              {i18n.t("dashboard.upcoming_load_failed")}
            </Text>
            <Button variant="secondary" size="sm" onClick={retry}>
              {i18n.t("common.retry")}
            </Button>
          </Stack>
        ) : isLoading && !data ? (
          <Stack gap={14}>
            <UpcomingPaymentRowSkeleton />
            <UpcomingPaymentRowSkeleton />
            <UpcomingPaymentRowSkeleton />
          </Stack>
        ) : data && data.upcomingPayments.length === 0 ? (
          <Card variant="secondary" radius={24} padding={20}>
            <Text color="secondary">
              {i18n.t("dashboard.upcoming_payments_empty")}
            </Text>
          </Card>
        ) : (
          <Stack gap={14}>
            {data?.upcomingPayments.map((transaction) => (
              <AppLink
                key={transaction.id}
                href={`/transactions/${transaction.id}`}
                ariaLabel={transaction.description}
              >
                <Card
                  variant="secondary"
                  radius={24}
                  padding={{
                    paddingTop: 16,
                    paddingRight: 18,
                    paddingBottom: 16,
                    paddingLeft: 18,
                  }}
                >
                  <Stack
                    direction="row"
                    align="center"
                    justify="space-between"
                    gap={16}
                    fullWidth
                  >
                    <Stack gap={4} align="flex-start">
                      <Text as="span" size="sm" weight="semibold">
                        {transaction.description}
                      </Text>
                      <Text as="span" size="xs" color="secondary">
                        {transaction.spaceName}
                      </Text>
                    </Stack>
                    <Stack gap={4} align="flex-end">
                      <Text as="span" size="sm" weight="semibold">
                        {formatCurrency(Math.abs(transaction.amount))}
                      </Text>
                      <Text as="span" size="xs" color="secondary">
                        {i18n.t("dashboard.payment_due", {
                          date: formatPaymentDate(transaction.beginDate),
                        })}
                      </Text>
                    </Stack>
                  </Stack>
                </Card>
              </AppLink>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
