"use client";

import "./dashboard.scss";

import {
  AppLink,
  EntryList,
  EntryListItem,
  Hero,
  useAppPreferences,
} from "@/components";
import { Card, Icon, Stack, Text } from "@/elements";

import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import React from "react";
import { i18n } from "@/model/i18n";

export interface DashboardProps {
  totals: {
    income: number;
    expense: number;
    net: number;
  };
  currentMonthRange: {
    startDate: string;
    endDate: string;
  };
  upcomingPayments: EntryListItem[];
  recentEntries: EntryListItem[];
}

function formatPaymentDate(beginDate: string): string {
  return format(new Date(beginDate), "MMM d");
}

export function Dashboard({
  totals,
  currentMonthRange,
  upcomingPayments,
  recentEntries,
}: DashboardProps): React.ReactElement {
  useAppPreferences();

  const currentMonthQuery = `start_date=${currentMonthRange.startDate}&end_date=${currentMonthRange.endDate}`;

  return (
    <div className="dashboard">
      <Stack gap={24}>
        <Hero
          icon="dashboard"
          title={String(i18n.t("dashboard.hero_label"))}
          pattern="dashboard"
          actions={
            <>
              <AppLink href="/entries/new/income">
                <span className="dashboard__hero-action dashboard__hero-action--primary">
                  <Icon name="plus" size={18} />
                  <span>{i18n.t("dashboard.hero_add_action")}</span>
                </span>
              </AppLink>
              <button type="button" className="dashboard__hero-action">
                <Icon name="dots-horizontal" size={18} />
                <span>{i18n.t("dashboard.hero_more_action")}</span>
              </button>
            </>
          }
        >
          <div className="dashboard__hero-body">
            <Stack gap={10}>
              <Text as="h1" size="h1" color="inverse" weight="bold">
                {formatCurrency(totals.net)}
              </Text>
              <Text as="p" size="sm" color="inverse">
                {i18n.t("dashboard.hero_caption")}
              </Text>
            </Stack>
            <div className="dashboard__hero-stats">
              <AppLink href={`/entries?${currentMonthQuery}&type=income`}>
                <span className="dashboard__stat-card">
                  <Text as="span" size="xs" color="inverse" weight="medium">
                    {i18n.t("dashboard.income")}
                  </Text>
                  <Text as="span" size="lg" color="inverse" weight="semibold">
                    {formatCurrency(totals.income)}
                  </Text>
                </span>
              </AppLink>
              <AppLink href={`/entries?${currentMonthQuery}&type=expense`}>
                <span className="dashboard__stat-card dashboard__stat-card--soft">
                  <Text as="span" size="xs" color="inverse" weight="medium">
                    {i18n.t("dashboard.expenses")}
                  </Text>
                  <Text as="span" size="lg" color="inverse" weight="semibold">
                    {formatCurrency(Math.abs(totals.expense))}
                  </Text>
                </span>
              </AppLink>
            </div>
          </div>
        </Hero>

        <div className="dashboard__grid">
          <Card
            as="section"
            padding={24}
            title={String(i18n.t("dashboard.upcoming_payments"))}
            icon="calendar"
          >
            <Stack gap={20}>
              <div className="dashboard__section-link">
                <AppLink href={`/entries?${currentMonthQuery}&type=expense`}>
                  {i18n.t("dashboard.upcoming_payments_link")}
                </AppLink>
              </div>

              {upcomingPayments.length === 0 ? (
                <div className="dashboard__empty-state">
                  <Text color="secondary">
                    {i18n.t("dashboard.upcoming_payments_empty")}
                  </Text>
                </div>
              ) : (
                <div className="dashboard__payments-list">
                  {upcomingPayments.map((entry) => (
                    <div key={entry.id} className="dashboard__payment-row">
                      <div className="dashboard__payment-copy">
                        <Text as="span" size="sm" weight="semibold">
                          {entry.description}
                        </Text>
                        <Text as="span" size="xs" color="secondary">
                          {entry.accountName}
                        </Text>
                      </div>
                      <div className="dashboard__payment-meta">
                        <Text as="span" size="sm" weight="semibold">
                          {formatCurrency(Math.abs(entry.amount))}
                        </Text>
                        <Text as="span" size="xs" color="secondary">
                          {i18n.t("dashboard.payment_due", {
                            date: formatPaymentDate(entry.beginDate),
                          })}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Stack>
          </Card>

          <Card
            as="section"
            padding={24}
            title={String(i18n.t("dashboard.recent_entries"))}
            icon="activity"
          >
            <Stack gap={20}>
              <Text size="sm" color="secondary">
                {i18n.t("dashboard.activity_subtitle")}
              </Text>
              <div className="dashboard__section-link">
                <AppLink href={`/entries?${currentMonthQuery}`}>
                  {i18n.t("dashboard.recent_activity_link")}
                </AppLink>
              </div>
              <EntryList
                entries={recentEntries}
                showDelete={false}
                entryHrefBase="/entries"
              />
            </Stack>
          </Card>
        </div>
      </Stack>
    </div>
  );
}
