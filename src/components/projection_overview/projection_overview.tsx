"use client";

import "./projection_overview.scss";

import { AppLink, EntryList, useNavigationProgress } from "@/components";
import { Card, Icon, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ProjectionOverviewProps = {
  focusedMonthLabel: string;
  previousMonthKey: string;
  nextMonthKey: string;
  chartData: Array<{
    monthLabel: string;
    income: number;
    expenses: number;
  }>;
  totals: {
    income: number;
    expense: number;
    net: number;
  };
  accounts: Array<{
    accountId: string;
    accountName: string;
    monthTotal: number;
    entries: Array<{
      id: string;
      type: string;
      accountName: string;
      description: string;
      amount: number;
      beginDate: string;
      endDate: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
  }>;
};

function formatCurrency(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${Math.abs(amount).toFixed(2)} €`;
}

export function ProjectionOverview({
  focusedMonthLabel,
  previousMonthKey,
  nextMonthKey,
  chartData,
  totals,
  accounts,
}: ProjectionOverviewProps): React.ReactElement {
  const { push } = useNavigationProgress();

  return (
    <div className="projection-overview">
      <Stack gap={24}>
        <div className="projection-overview__header">
          <Text size="h2" as="h2" weight="bold">
            {focusedMonthLabel}
          </Text>
          <div className="projection-overview__navigation">
            <button
              type="button"
              className="projection-overview__nav-button"
              onClick={() => push(`/projection?month=${previousMonthKey}`)}
              aria-label={i18n.t("projection_page.previous_month") as string}
            >
              <Icon name="chevron-left" />
            </button>
            <button
              type="button"
              className="projection-overview__nav-button"
              onClick={() => push(`/projection?month=${nextMonthKey}`)}
              aria-label={i18n.t("projection_page.next_month") as string}
            >
              <Icon name="chevron-right" />
            </button>
          </div>
        </div>

        <Card padding={20} className="projection-overview__chart-card">
          <Stack gap={12}>
            <Text size="h4" as="h3" weight="semibold">
              {i18n.t("projection_page.chart_title")}
            </Text>
            <div className="projection-overview__chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="monthLabel" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar
                    dataKey="income"
                    name={i18n.t("projection_page.income") as string}
                    fill="var(--color-success)"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    name={i18n.t("projection_page.expenses") as string}
                    fill="var(--color-danger)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Stack>
        </Card>

        <Card padding={20} className="projection-overview__totals-card">
          <Stack gap={12}>
            <Text size="h4" as="h3" weight="semibold">
              {i18n.t("projection_page.month_totals")}
            </Text>
            <div className="projection-overview__totals-grid">
              <div className="projection-overview__total-item">
                <Text size="sm" color="secondary">
                  {i18n.t("projection_page.income")}
                </Text>
                <Text size="lg" weight="bold" color="success">
                  {formatCurrency(totals.income)}
                </Text>
              </div>
              <div className="projection-overview__total-item">
                <Text size="sm" color="secondary">
                  {i18n.t("projection_page.expenses")}
                </Text>
                <Text size="lg" weight="bold" color="danger">
                  {formatCurrency(totals.expense)}
                </Text>
              </div>
              <div className="projection-overview__total-item projection-overview__total-item--net">
                <Text size="sm" color="secondary">
                  {i18n.t("projection_page.total")}
                </Text>
                <Text
                  size="2xl"
                  weight="bold"
                  color={totals.net >= 0 ? "success" : "danger"}
                >
                  {formatCurrency(totals.net)}
                </Text>
              </div>
            </div>
          </Stack>
        </Card>

        <Stack gap={16}>
          <Text size="h4" as="h3" weight="semibold">
            {i18n.t("projection_page.accounts_with_entries")}
          </Text>

          {accounts.length === 0 ? (
            <Card padding={20} variant="dashed">
              <Text color="secondary">
                {i18n.t("projection_page.empty_month_entries")}
              </Text>
            </Card>
          ) : (
            accounts.map((account) => (
              <div key={account.accountId} className="projection-overview__account-group">
                <div className="projection-overview__account-header">
                  <Text size="md" weight="bold">
                    {account.accountName}
                  </Text>
                  <Text
                    size="sm"
                    weight="bold"
                    color={account.monthTotal >= 0 ? "success" : "danger"}
                  >
                    {formatCurrency(account.monthTotal)}
                  </Text>
                </div>

                <EntryList
                  entries={account.entries}
                  showDelete={false}
                  entryHref={(entry) => `/entries/${entry.id}`}
                />

                <AppLink
                  href={`/accounts/${account.accountId}`}
                  className="projection-overview__account-link"
                >
                  {i18n.t("projection_page.open_account")}
                </AppLink>
              </div>
            ))
          )}
        </Stack>

        <AppLink href="/entries" className="projection-overview__all-entries-link">
          {i18n.t("projection_page.see_all_entries")}
        </AppLink>
      </Stack>
    </div>
  );
}
