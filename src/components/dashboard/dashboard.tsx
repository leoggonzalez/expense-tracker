"use client";

import "./dashboard.scss";

import { Entry, EntryCollection } from "@/model";
import { Stack, Text } from "@/elements";

import React from "react";
import { i18n } from "@/model/i18n";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { EntryList, EntryListItem } from "@/components";
import Link from "next/link";

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
  const currentMonthEnd = endOfMonth(currentMonth);

  const income = collection.getTotalForMonth(currentMonth, "income");
  const expense = collection.getTotalForMonth(currentMonth, "expense");
  const net = income + expense; // expense is negative
  const currentMonthQuery = `start_date=${format(currentMonth, "yyyy-MM-dd")}&end_date=${format(
    currentMonthEnd,
    "yyyy-MM-dd",
  )}`;
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
          <Link
            href={`/entries?${currentMonthQuery}&type=income`}
            className="dashboard__card-link"
          >
            <div className="dashboard__card dashboard__card--income">
              <Text size="sm" color="secondary" weight="medium">
                {i18n.t("dashboard.income")}
              </Text>
              <Text size="2xl" weight="bold" color="success">
                {formatCurrency(income)}
              </Text>
            </div>
          </Link>

          <Link
            href={`/entries?${currentMonthQuery}&type=expense`}
            className="dashboard__card-link"
          >
            <div className="dashboard__card dashboard__card--expense">
              <Text size="sm" color="secondary" weight="medium">
                {i18n.t("dashboard.expenses")}
              </Text>
              <Text size="2xl" weight="bold" color="danger">
                {formatCurrency(expense)}
              </Text>
            </div>
          </Link>

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

        <div className="dashboard__recent-section">
          <div className="dashboard__recent-header">
            <Text size="h4" as="h3" weight="semibold">
              {i18n.t("dashboard.recent_entries")}
            </Text>
            <Link
              href={`/entries?${currentMonthQuery}`}
              className="dashboard__recent-link"
            >
              {i18n.t("dashboard.see_all_entries")}
            </Link>
          </div>
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
