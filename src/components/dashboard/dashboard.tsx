"use client";

import "./dashboard.scss";

import { Entry, EntryCollection } from "@/model";
import { Stack, Text } from "@/elements";

import React from "react";
import { i18n } from "@/model/i18n";
import { startOfMonth } from "date-fns";
import { EntryList, EntryListItem } from "@/components";

export interface DashboardProps {
  entries: Array<{
    id: string;
    type: string;
    account: string;
    description: string;
    amount: number;
    beginDate: string;
    endDate: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  recentEntries: EntryListItem[];
}

export function Dashboard({
  entries: plainEntries,
  recentEntries,
}: DashboardProps): React.ReactElement {
  // Convert plain objects to Entry instances
  const entries = plainEntries.map((entry) =>
    Entry.fromJSON({
      ...entry,
      beginDate: new Date(entry.beginDate),
      endDate: entry.endDate ? new Date(entry.endDate) : null,
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt),
    }),
  );

  const collection = new EntryCollection(entries);
  const currentMonth = startOfMonth(new Date());

  const income = collection.getTotalForMonth(currentMonth, "income");
  const expense = collection.getTotalForMonth(currentMonth, "expense");
  const net = income + expense; // expense is negative
  const activeEntriesCount = collection.getActiveInMonth(currentMonth).length;
  const activeEntriesTextKey =
    activeEntriesCount === 1
      ? "dashboard.entries_active_this_month_one"
      : "dashboard.entries_active_this_month_other";
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
          <div className="dashboard__card dashboard__card--income">
            <Text size="sm" color="secondary" weight="medium">
              {i18n.t("dashboard.income")}
            </Text>
            <Text size="2xl" weight="bold" color="success">
              {formatCurrency(income)}
            </Text>
          </div>

          <div className="dashboard__card dashboard__card--expense">
            <Text size="sm" color="secondary" weight="medium">
              {i18n.t("dashboard.expenses")}
            </Text>
            <Text size="2xl" weight="bold" color="danger">
              {formatCurrency(expense)}
            </Text>
          </div>

          <div className="dashboard__card dashboard__card--net">
            <Text size="sm" color="secondary" weight="medium">
              {i18n.t("dashboard.net")}
            </Text>
            <Text
              size="2xl"
              weight="bold"
              color={net >= 0 ? "success" : "danger"}
            >
              {formatCurrency(net)}
            </Text>
          </div>
        </div>

        <div className="dashboard__summary">
          <Text size="h4" as="h3" weight="semibold">
            {i18n.t("dashboard.active_entries")}
          </Text>
          <Text size="lg" color="secondary">
            {i18n.t(activeEntriesTextKey, { count: activeEntriesCount })}
          </Text>
        </div>

        <div className="dashboard__recent-section">
          <Text size="h4" as="h3" weight="semibold">
            {i18n.t("dashboard.recent_entries")}
          </Text>
          <EntryList
            entries={recentEntries}
            showDelete={false}
            entryHref={(entry) => `/entries/${entry.id}`}
          />
        </div>
      </Stack>
    </div>
  );
}
