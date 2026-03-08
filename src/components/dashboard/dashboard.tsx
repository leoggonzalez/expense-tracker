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

        <div className="dashboard__cards">
          <Grid gap={16}>
            <div className="dashboard__card-link dashboard__card-link--income">
              <AppLink href={`/entries?${currentMonthQuery}&type=income`}>
                <Card padding={16}>
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
            </div>

            <div className="dashboard__card-link dashboard__card-link--expense">
              <AppLink href={`/entries?${currentMonthQuery}&type=expense`}>
                <Card padding={16}>
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
            </div>

            <div className="dashboard__card dashboard__card--net">
              <Card padding={16}>
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
            </div>
          </Grid>
        </div>

        <div className="dashboard__recent-section">
          <Stack gap={16}>
            <div className="dashboard__recent-header">
              <Stack direction="row" align="center" justify="space-between">
                <Text size="h4" as="h3" weight="semibold">
                  {i18n.t("dashboard.recent_entries")}
                </Text>
                <span className="dashboard__recent-link">
                  <AppLink href={`/entries?${currentMonthQuery}`}>
                    {i18n.t("dashboard.see_all_entries")}
                  </AppLink>
                </span>
              </Stack>
            </div>
            <EntryList
              entries={recentEntries}
              showDelete={false}
              entryHref={(entry) => `/entries/${entry.id}`}
            />
          </Stack>
        </div>
      </Stack>
    </div>
  );
}
