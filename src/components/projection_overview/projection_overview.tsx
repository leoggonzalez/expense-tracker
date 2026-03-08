"use client";

import "./projection_overview.scss";

import { AppLink, EntryList, useNavigationProgress } from "@/components";
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
import { Box, Card, Grid, Icon, Stack, Text } from "@/elements";

import React from "react";
import { i18n } from "@/model/i18n";

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

function formatTooltipValue(value: unknown): string {
  const numericValue = typeof value === "number" ? value : Number(value ?? 0);
  return formatCurrency(Number.isFinite(numericValue) ? numericValue : 0);
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
        <Stack direction="row" align="center" justify="space-between" gap={16}>
          <Text size="h2" as="h2" weight="bold">
            {focusedMonthLabel}
          </Text>
          <Stack direction="row" align="center" gap={8}>
            <Stack direction="row" gap={8}>
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
            </Stack>
          </Stack>
        </Stack>

        <div className="projection-overview__chart-card">
          <Card padding={20}>
            <Stack gap={12}>
              <Text size="h4" as="h3" weight="semibold">
                {i18n.t("projection_page.chart_title")}
              </Text>
              <div className="projection-overview__chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="monthLabel"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => formatTooltipValue(value)} />
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
        </div>

        <Stack gap={12}>
          <Text size="h4" as="h3" weight="semibold">
            {i18n.t("projection_page.month_totals")}
          </Text>
          <div className="projection-overview__totals-grid">
            <Grid
              gap={16}
              columns="repeat(var(--projection-totals-columns, 1), minmax(0, 1fr))"
            >
              <Card padding={8}>
                <Text size="sm" color="secondary">
                  {i18n.t("projection_page.income")}
                </Text>
                <Text size="2xl" weight="bold" color="success">
                  {formatCurrency(totals.income)}
                </Text>
              </Card>
              <Card padding={8}>
                <Text size="sm" color="secondary">
                  {i18n.t("projection_page.expenses")}
                </Text>
                <Text size="2xl" weight="bold" color="danger">
                  {formatCurrency(totals.expense)}
                </Text>
              </Card>
              <Card padding={8}>
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
              </Card>
            </Grid>
          </div>
        </Stack>

        <Stack gap={24}>
          <Text size="h4" as="h3" weight="semibold">
            {i18n.t("projection_page.accounts_with_entries")}
          </Text>

          <Stack gap={32}>
            {accounts.length === 0 ? (
              <Card padding={20} variant="dashed">
                <Text color="secondary">
                  {i18n.t("projection_page.empty_month_entries")}
                </Text>
              </Card>
            ) : (
              accounts.map((account) => (
                <div
                  key={account.accountId}
                  className="projection-overview__account-group"
                >
                  <Stack gap={16}>
                    <Stack
                      direction="row"
                      align="center"
                      justify="space-between"
                      gap={8}
                    >
                      <Stack direction="row" align="center" gap={8}>
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
                      </Stack>

                      <span className="projection-overview__account-link">
                        <AppLink href={`/accounts/${account.accountId}`}>
                          {i18n.t("projection_page.open_account")}
                        </AppLink>
                      </span>
                    </Stack>

                    <EntryList
                      entries={account.entries}
                      showDelete={false}
                      entryHref={(entry) => `/entries/${entry.id}`}
                    />
                  </Stack>
                </div>
              ))
            )}
          </Stack>
        </Stack>

        <span className="projection-overview__all-entries-link">
          <AppLink href="/entries">
            {i18n.t("projection_page.see_all_entries")}
          </AppLink>
        </span>
      </Stack>
    </div>
  );
}
