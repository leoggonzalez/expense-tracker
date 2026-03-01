"use client";

import "./projection_table.scss";

import { Entry, EntryCollection } from "@/model";
import { i18n } from "@/model/i18n";
import React, { useState } from "react";
import { Stack, Text } from "@/elements";
import { addMonths, format, startOfMonth } from "date-fns";

import { Input } from "@/components";

export interface ProjectionTableProps {
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

export function ProjectionTable({
  entries: plainEntries,
}: ProjectionTableProps): React.ReactElement {
  const currentDate = new Date();
  const [endDate, setEndDate] = useState<string>(
    format(addMonths(currentDate, 6), "yyyy-MM"),
  );

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

  // Calculate number of months from current month to end month
  const startMonth = startOfMonth(currentDate);
  const [endYear, endMonth] = endDate.split("-").map(Number);
  const endMonthDate = new Date(endYear, endMonth - 1, 1);

  const monthsDiff =
    (endMonthDate.getFullYear() - startMonth.getFullYear()) * 12 +
    (endMonthDate.getMonth() - startMonth.getMonth()) +
    1;

  const monthCount = Math.max(1, monthsDiff);

  const { accounts, monthlyTotals, months } = collection.getProjectionData(
    startMonth,
    monthCount,
  );

  const formatCurrency = (amount: number): string => {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";
    return `${sign}${absAmount.toFixed(2)} €`;
  };

  return (
    <div className="projection-table">
      <Stack gap={24}>
        <div className="projection-table__header">
          <Text size="h2" as="h2" weight="bold">
            {i18n.t("projection_table.title")}
          </Text>
          <div className="projection-table__date-selector">
            <Input
              type="month"
              label={i18n.t("projection_table.display_until")}
              value={endDate}
              onChange={setEndDate}
              min={format(currentDate, "yyyy-MM")}
            />
          </div>
        </div>

        <div className="projection-table__scroll-container">
          <table className="projection-table__table">
            <thead className="projection-table__thead">
              <tr className="projection-table__row">
                <th className="projection-table__cell projection-table__cell--header projection-table__cell--sticky">
                  {i18n.t("projection_table.account_description")}
                </th>
                {months.map((month) => (
                  <th
                    key={month.toISOString()}
                    className="projection-table__cell projection-table__cell--header"
                  >
                    {format(month, "MMM yyyy")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="projection-table__tbody">
              {accounts.map((account) => {
                return (
                  <React.Fragment key={account.account}>
                    <tr className="projection-table__row projection-table__row--group-header">
                      <td className="projection-table__cell projection-table__cell--sticky projection-table__cell--group-header">
                        <Text size="md" weight="bold">
                          {account.account}
                        </Text>
                      </td>
                    </tr>
                    {account.entries.map((entry) => (
                      <tr key={entry.id} className="projection-table__row">
                        <td className="projection-table__cell projection-table__cell--sticky">
                          <div className="projection-table__entry">
                            <Text size="xs" color="secondary">
                              {entry.description}
                            </Text>
                          </div>
                        </td>
                        {months.map((month) => {
                          const amount = entry.getAmountForMonth(month);
                          return (
                            <td
                              key={month.toISOString()}
                              className="projection-table__cell projection-table__cell--amount"
                            >
                              {amount !== 0 && (
                                <Text
                                  size="sm"
                                  color={amount > 0 ? "success" : "danger"}
                                >
                                  {formatCurrency(amount)}
                                </Text>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    <tr className="projection-table__row projection-table__row--group-total">
                      <td className="projection-table__cell projection-table__cell--sticky projection-table__cell--total">
                        <Text size="sm" weight="bold">
                          {i18n.t("projection_table.account_total", {
                            account: account.account,
                          })}
                        </Text>
                      </td>
                      {months.map((month) => {
                        const monthKey = format(month, "yyyy-MM");
                        const total = account.monthlyTotals.get(monthKey) || 0;
                        return (
                          <td
                            key={month.toISOString()}
                            className="projection-table__cell projection-table__cell--amount projection-table__cell--total"
                          >
                            <Text
                              size="sm"
                              weight="bold"
                              color={total > 0 ? "success" : "danger"}
                            >
                              {formatCurrency(total)}
                            </Text>
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}

              <tr className="projection-table__row projection-table__row--breakdown">
                <td className="projection-table__cell projection-table__cell--sticky projection-table__cell--breakdown">
                  <Text size="sm" color="success" weight="medium">
                    {i18n.t("projection_table.total_income")}
                  </Text>
                </td>
                {months.map((month) => {
                  const monthKey = format(month, "yyyy-MM");
                  const totals = monthlyTotals.get(monthKey);
                  return (
                    <td
                      key={month.toISOString()}
                      className="projection-table__cell projection-table__cell--amount projection-table__cell--breakdown"
                    >
                      <Text size="sm" color="success">
                        {formatCurrency(totals?.income || 0)}
                      </Text>
                    </td>
                  );
                })}
              </tr>

              <tr className="projection-table__row projection-table__row--breakdown">
                <td className="projection-table__cell projection-table__cell--sticky projection-table__cell--breakdown">
                  <Text size="sm" color="danger" weight="medium">
                    {i18n.t("projection_table.total_expenses")}
                  </Text>
                </td>
                {months.map((month) => {
                  const monthKey = format(month, "yyyy-MM");
                  const totals = monthlyTotals.get(monthKey);
                  return (
                    <td
                      key={month.toISOString()}
                      className="projection-table__cell projection-table__cell--amount projection-table__cell--breakdown"
                    >
                      <Text size="sm" color="danger">
                        {formatCurrency(totals?.expense || 0)}
                      </Text>
                    </td>
                  );
                })}
              </tr>

              {/* Grand total row */}
              <tr className="projection-table__row projection-table__row--grand-total">
                <td className="projection-table__cell projection-table__cell--sticky projection-table__cell--grand-total">
                  <Text size="md" weight="bold">
                    {i18n.t("projection_table.total")}
                  </Text>
                </td>
                {months.map((month) => {
                  const monthKey = format(month, "yyyy-MM");
                  const totals = monthlyTotals.get(monthKey);
                  const net = totals?.net || 0;
                  return (
                    <td
                      key={month.toISOString()}
                      className="projection-table__cell projection-table__cell--amount projection-table__cell--grand-total"
                    >
                      <Text
                        size="md"
                        weight="bold"
                        color={net > 0 ? "success-light" : "danger-light"}
                      >
                        {formatCurrency(net)}
                      </Text>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </Stack>
    </div>
  );
}
