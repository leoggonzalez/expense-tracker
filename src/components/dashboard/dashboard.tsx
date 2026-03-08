"use client";

import "./dashboard.scss";

import { Card, Grid, Stack, Text } from "@/elements";
import { EntryList, EntryListItem } from "@/components";

import { AppLink } from "@/components";
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
  recentEntries: EntryListItem[];
}

export function Dashboard({
  totals,
  currentMonthRange,
  recentEntries,
}: DashboardProps): React.ReactElement {
  const currentMonthQuery = `start_date=${currentMonthRange.startDate}&end_date=${currentMonthRange.endDate}`;
  const formatCurrency = (amount: number): string => {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";
    return `${sign}${absAmount.toFixed(2)} €`;
  };

  return (
    <div className="dashboard">
      <Stack gap={24}>
        <Text size="h2" as="h2" weight="bold">
          {i18n.t("dashboard.current_month_overview")}
        </Text>

        <Grid gap={16} className="dashboard__cards">
          <AppLink
            href={`/entries?${currentMonthQuery}&type=income`}
            className="dashboard__card-link"
          >
            <Card
              padding={16}
              className="dashboard__card dashboard__card--income"
            >
              <Stack gap={8}>
                <Text size="sm" color="secondary" weight="medium">
                  {i18n.t("dashboard.income")}
                </Text>
                <Text size="2xl" weight="bold" color="success">
                  {formatCurrency(totals.income)}
                </Text>
              </Stack>
            </Card>
          </AppLink>

          <AppLink
            href={`/entries?${currentMonthQuery}&type=expense`}
            className="dashboard__card-link"
          >
            <Card
              padding={16}
              className="dashboard__card dashboard__card--expense"
            >
              <Stack gap={8}>
                <Text size="sm" color="secondary" weight="medium">
                  {i18n.t("dashboard.expenses")}
                </Text>
                <Text size="2xl" weight="bold" color="danger">
                  {formatCurrency(totals.expense)}
                </Text>
              </Stack>
            </Card>
          </AppLink>

          <Card padding={16} className="dashboard__card dashboard__card--net">
            <Stack gap={8}>
              <Text size="sm" color="secondary" weight="medium">
                {i18n.t("dashboard.net")}
              </Text>
              <Text
                size="2xl"
                weight="bold"
                color={totals.net >= 0 ? "success" : "danger"}
              >
                {formatCurrency(totals.net)}
              </Text>
            </Stack>
          </Card>
        </Grid>

        <Stack gap={16} className="dashboard__recent-section">
          <Stack
            direction="row"
            align="center"
            justify="space-between"
            className="dashboard__recent-header"
          >
            <Text size="h4" as="h3" weight="semibold">
              {i18n.t("dashboard.recent_entries")}
            </Text>
            <AppLink
              href={`/entries?${currentMonthQuery}`}
              className="dashboard__recent-link"
            >
              {i18n.t("dashboard.see_all_entries")}
            </AppLink>
          </Stack>
          <EntryList
            entries={recentEntries}
            showDelete={false}
            entryHref={(entry) => `/entries/${entry.id}`}
          />
        </Stack>
      </Stack>
    </div>
  );
}
