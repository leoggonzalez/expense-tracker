"use client";

import "./dashboard.scss";

import { Card, Stack, Text } from "@/elements";
import { Currency, EntryList, EntryListItem } from "@/components";

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

  return (
    <div className="dashboard">
      <Stack gap={24}>
        <Text size="h2" as="h2" weight="bold">
          {i18n.t("dashboard.current_month_overview")}
        </Text>

        <div className="dashboard__cards">
          <div className="dashboard__cards-grid">
            <div className="dashboard__card-link dashboard__card-link--income">
              <AppLink href={`/entries?${currentMonthQuery}&type=income`}>
                <div className="dashboard__card-surface dashboard__card-surface--income">
                  <Card padding={16}>
                    <Stack gap={8}>
                      <Text size="sm" color="secondary" weight="medium">
                        {i18n.t("dashboard.income")}
                      </Text>
                      <Currency
                        value={totals.income}
                        size="2xl"
                        weight="bold"
                      />
                    </Stack>
                  </Card>
                </div>
              </AppLink>
            </div>

            <div className="dashboard__card-link dashboard__card-link--expense">
              <AppLink href={`/entries?${currentMonthQuery}&type=expense`}>
                <div className="dashboard__card-surface dashboard__card-surface--expense">
                  <Card padding={16}>
                    <Stack gap={8}>
                      <Text size="sm" color="secondary" weight="medium">
                        {i18n.t("dashboard.expenses")}
                      </Text>
                      <Currency
                        value={totals.expense}
                        size="2xl"
                        weight="bold"
                      />
                    </Stack>
                  </Card>
                </div>
              </AppLink>
            </div>

            <div className="dashboard__card dashboard__card--net">
              <div className="dashboard__card-surface dashboard__card-surface--net">
                <Card padding={16}>
                  <Stack gap={8}>
                    <Text size="sm" color="secondary" weight="medium">
                      {i18n.t("dashboard.net")}
                    </Text>
                    <Currency value={totals.net} size="2xl" weight="bold" />
                  </Stack>
                </Card>
              </div>
            </div>
          </div>
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
