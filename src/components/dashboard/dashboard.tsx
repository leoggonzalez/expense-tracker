"use client";

import "./dashboard.scss";

import { Entry, EntryCollection } from "@/model";
import { Stack, Text } from "@/elements";

import React from "react";
import { i18n } from "@/model/i18n";
import { startOfMonth } from "date-fns";

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
}

export function Dashboard({
  entries: plainEntries,
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
  const accountBreakdown =
    collection.getCurrentMonthBreakdownByAccount(currentMonth);

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

        <div className="dashboard__account-section">
          <Text size="h4" as="h3" weight="semibold">
            {i18n.t("dashboard.accounts_this_month")}
          </Text>

          {accountBreakdown.length === 0 ? (
            <div className="dashboard__account-empty">
              <Text color="secondary">
                {i18n.t("dashboard.no_accounts_this_month")}
              </Text>
            </div>
          ) : (
            <div className="dashboard__account-list">
              {accountBreakdown.map((accountItem) => (
                <div
                  key={accountItem.account}
                  className="dashboard__account-card"
                >
                  <Text size="md" weight="semibold">
                    {accountItem.account}
                  </Text>
                  <div className="dashboard__account-metrics">
                    <div>
                      <Text size="xs" color="secondary">
                        {i18n.t("dashboard.account_income")}
                      </Text>
                      <Text size="sm" weight="semibold" color="success">
                        {formatCurrency(accountItem.income)}
                      </Text>
                    </div>
                    <div>
                      <Text size="xs" color="secondary">
                        {i18n.t("dashboard.account_expenses")}
                      </Text>
                      <Text size="sm" weight="semibold" color="danger">
                        {formatCurrency(accountItem.expense)}
                      </Text>
                    </div>
                    <div>
                      <Text size="xs" color="secondary">
                        {i18n.t("dashboard.account_net")}
                      </Text>
                      <Text
                        size="sm"
                        weight="semibold"
                        color={accountItem.net >= 0 ? "success" : "danger"}
                      >
                        {formatCurrency(accountItem.net)}
                      </Text>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Stack>
    </div>
  );
}
