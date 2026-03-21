"use client";

import "./projection_table.scss";

import { Currency, Input, useNavigationProgress } from "@/components";
import { Transaction, TransactionCollection } from "@/model";
import { i18n } from "@/model/i18n";
import React, { useState } from "react";
import { Card, Stack, Text } from "@/elements";
import { addMonths, format, startOfMonth } from "date-fns";

export interface ProjectionTableProps {
  transactions: Array<{
    id: string;
    type: string;
    space: string;
    description: string;
    amount: number;
    beginDate: string;
    endDate: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

export function ProjectionTable({
  transactions: plainTransactions,
}: ProjectionTableProps): React.ReactElement {
  const { push } = useNavigationProgress();

  // Convert plain objects to Transaction instances
  const transactions = plainTransactions.map((transaction) =>
    Transaction.fromJSON({
      ...transaction,
      beginDate: new Date(transaction.beginDate),
      endDate: transaction.endDate ? new Date(transaction.endDate) : null,
      createdAt: new Date(transaction.createdAt),
      updatedAt: new Date(transaction.updatedAt),
    }),
  );

  const currentDate = new Date();
  const fallbackStartMonth = startOfMonth(currentDate);
  const earliestBeginDate = transactions.reduce<Date | null>((earliest, transaction) => {
    if (!earliest || transaction.beginDate < earliest) {
      return transaction.beginDate;
    }

    return earliest;
  }, null);
  const startMonth = earliestBeginDate
    ? startOfMonth(earliestBeginDate)
    : fallbackStartMonth;
  const defaultEndMonth = addMonths(fallbackStartMonth, 5);
  const [endDate, setEndDate] = useState<string>(
    format(
      defaultEndMonth < startMonth ? startMonth : defaultEndMonth,
      "yyyy-MM",
    ),
  );

  const collection = new TransactionCollection(transactions);

  // Calculate number of months from start month to end month
  const [endYear, endMonth] = endDate.split("-").map(Number);
  const endMonthDate = new Date(endYear, endMonth - 1, 1);

  const monthsDiff =
    (endMonthDate.getFullYear() - startMonth.getFullYear()) * 12 +
    (endMonthDate.getMonth() - startMonth.getMonth()) +
    1;

  const monthCount = Math.max(1, monthsDiff);

  const { spaces, monthlyTotals, months } = collection.getProjectionData(
    startMonth,
    monthCount,
  );

  return (
    <div className="projection-table">
      <Stack gap={24}>
        <div className="projection-table__header">
          <Stack
            gap={16}
            direction="row"
            justify="space-between"
            align="flex-end"
            wrap
          >
            <Text size="h2" as="h2" weight="bold">
              {i18n.t("projection_table.title")}
            </Text>
            <div className="projection-table__date-selector">
              <Input
                type="month"
                label={i18n.t("projection_table.display_until")}
                value={endDate}
                onChange={setEndDate}
                min={format(startMonth, "yyyy-MM")}
              />
            </div>
          </Stack>
        </div>

        <div className="projection-table__scroll-container">
          <Card>
            <table className="projection-table__table">
              <thead className="projection-table__thead">
                <tr className="projection-table__row">
                  <th className="projection-table__cell projection-table__cell--header projection-table__cell--sticky projection-table__cell--header-sticky">
                    {i18n.t("projection_table.space_description")}
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
                {spaces.map((space) => {
                  return (
                    <React.Fragment key={space.space}>
                      <tr className="projection-table__row projection-table__row--group-header">
                        <td className="projection-table__cell projection-table__cell--sticky projection-table__cell--group-header">
                          <Text size="md" weight="bold">
                            {space.space}
                          </Text>
                        </td>
                        {months.map((month) => (
                          <td
                            key={month.toISOString()}
                            className="projection-table__cell projection-table__cell--group-header"
                          />
                        ))}
                      </tr>
                      {space.transactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="projection-table__row projection-table__row--interactive"
                          onClick={() => push(`/transactions/${transaction.id}`)}
                        >
                          <td className="projection-table__cell projection-table__cell--sticky">
                            <div className="projection-table__transaction">
                              <Stack gap={4}>
                                <Text size="xs" color="secondary">
                                  {transaction.description}
                                </Text>
                              </Stack>
                            </div>
                          </td>
                          {months.map((month) => {
                            const amount = transaction.getAmountForMonth(month);
                            return (
                              <td
                                key={month.toISOString()}
                                className="projection-table__cell projection-table__cell--amount"
                              >
                                {amount !== 0 && (
                                  <Currency value={amount} size="sm" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      <tr className="projection-table__row projection-table__row--group-total">
                        <td className="projection-table__cell projection-table__cell--sticky projection-table__cell--total">
                          <Text size="sm" weight="bold">
                            {i18n.t("projection_table.space_total", {
                              space: space.space,
                            })}
                          </Text>
                        </td>
                        {months.map((month) => {
                          const monthKey = format(month, "yyyy-MM");
                          const total =
                            space.monthlyTotals.get(monthKey) || 0;
                          return (
                            <td
                              key={month.toISOString()}
                              className="projection-table__cell projection-table__cell--amount projection-table__cell--total"
                            >
                              <Currency value={total} size="sm" weight="bold" />
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
                        <Currency value={totals?.income || 0} size="sm" />
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
                        <Currency value={totals?.expense || 0} size="sm" />
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
                        <Currency value={net} size="md" weight="bold" />
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      </Stack>
    </div>
  );
}
