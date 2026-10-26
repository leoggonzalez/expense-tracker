"use client";

import { SectionError } from "@/components/section_error/section_error";

import type {
  DashboardUpcomingItem,
  DashboardUpcomingPayload,
} from "@/actions/transactions";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import { AppLink, LoadingSkeleton } from "@/components";
import { Card, Stack, Text } from "@/elements";
import { formatCurrency } from "@/lib/utils";
import { i18n } from "@/model/i18n";
import { format } from "date-fns";

import React from "react";

const dashboardUpcomingCache = {
  entries: new Map<string, DashboardUpcomingPayload>(),
};

function getUpcomingTransactionsHref(
  payload: DashboardUpcomingPayload | null,
): string {
  const searchParams = new URLSearchParams();

  if (payload) {
    searchParams.set("start_date", payload.upcomingRange.startDate);
    searchParams.set("end_date", payload.upcomingRange.endDate);
  }

  return `/transactions?${searchParams.toString()}`;
}

function formatPaymentDate(beginDate: string): string {
  return format(new Date(beginDate), "MMM d");
}

function getUpcomingPaymentHref(payment: DashboardUpcomingItem): string {
  if (payment.kind === "transaction") {
    return `/transactions/${payment.id}`;
  }

  const searchParams = new URLSearchParams({
    currentMonth: payment.projectedMonthRange.startDate.slice(0, 7),
  });

  return `/spaces/${payment.spaceId}?${searchParams.toString()}`;
}

function getUpcomingItemLabel(payment: DashboardUpcomingItem): string {
  if (payment.kind === "transaction") {
    return payment.description;
  }

  return String(
    i18n.t("dashboard.transactions_for_space", {
      space: payment.spaceName,
    }),
  );
}

function UpcomingPaymentRowSkeleton(): React.ReactElement {
  return (
    <Card variant="secondary" radius={24} padding={18}>
      <Stack line align="center" justify="space-between" gap={16} fullWidth>
        <Stack gap={8} align="start">
          <LoadingSkeleton width="120px" height={20} radius={10} />
          <LoadingSkeleton width="96px" height={14} radius={8} />
        </Stack>
        <Stack gap={8} align="end">
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
      title={String(i18n.t("dashboard.upcoming_transactions"))}
      icon="calendar"
      fullHeight
    >
      <Stack gap={20}>
        <Text element="div" type="caption-medium">
          <AppLink href={getUpcomingTransactionsHref(data)}>
            {i18n.t("dashboard.upcoming_transactions_link")}
          </AppLink>
        </Text>

        {hasError && !data ? (
          <SectionError
            message={i18n.t("dashboard.upcoming_load_failed")}
            retryLabel={i18n.t("common.retry")}
            onRetry={retry}
          />
        ) : isLoading && !data ? (
          <Stack gap={14}>
            <UpcomingPaymentRowSkeleton />
            <UpcomingPaymentRowSkeleton />
            <UpcomingPaymentRowSkeleton />
          </Stack>
        ) : data && data.upcomingPayments.length === 0 ? (
          <Card variant="secondary" radius={24} padding={20}>
            <Text element="p" color="secondary">
              {i18n.t("dashboard.upcoming_transactions_empty")}
            </Text>
          </Card>
        ) : (
          <Stack gap={14}>
            {data?.upcomingPayments.map((payment) => (
              <AppLink
                key={payment.id}
                href={getUpcomingPaymentHref(payment)}
                ariaLabel={getUpcomingItemLabel(payment)}
              >
                <Card
                  variant="secondary"
                  radius={24}
                  padding={{
                    top: 16,
                    right: 18,
                    bottom: 16,
                    left: 18,
                  }}
                >
                  <Stack
                    line
                    align="center"
                    justify="space-between"
                    gap={16}
                    fullWidth
                  >
                    <Stack gap={4} align="start">
                      <Text element="span" type="caption-semibold">
                        {getUpcomingItemLabel(payment)}
                      </Text>
                      <Text element="span" type="fine" color="secondary">
                        {payment.spaceName}
                      </Text>
                    </Stack>
                    <Stack gap={4} align="end">
                      <Text element="span" type="caption-semibold">
                        {formatCurrency(Math.abs(payment.amount))}
                      </Text>
                      <Text element="span" type="fine" color="secondary">
                        {i18n.t("dashboard.payment_due", {
                          date: formatPaymentDate(payment.dueDate),
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
