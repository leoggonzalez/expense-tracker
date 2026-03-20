"use client";

import "./transactions_table.scss";

import { Avatar, Currency, useNavigationProgress } from "@/components";
import { format } from "date-fns";
import React from "react";

import { Card, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export type TransactionsTableItem = {
  id: string;
  type: string;
  spaceName: string;
  description: string;
  amount: number;
  beginDate: string;
  endDate: string | null;
};

type TransactionsTableProps = {
  transactions: TransactionsTableItem[];
};

export function TransactionsTable({
  transactions,
}: TransactionsTableProps): React.ReactElement {
  const { push } = useNavigationProgress();

  if (transactions.length === 0) {
    return (
      <div className="transactions-table__empty">
        <Card padding={32} variant="dashed">
          <Text color="secondary">{i18n.t("transactions_page.empty_state")}</Text>
        </Card>
      </div>
    );
  }

  const formatTransactionDate = (beginDate: string): string => {
    const formattedBeginDate = format(new Date(beginDate), "MMM dd, yyyy");
    return formattedBeginDate;
  };

  return (
    <div className="transactions-table">
      <Card padding={0}>
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="transactions-table__row"
            onClick={() => push(`/transactions/${transaction.id}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                push(`/transactions/${transaction.id}`);
              }
            }}
            role="link"
            tabIndex={0}
          >
            <div className="transactions-table__space">
              <Avatar name={transaction.spaceName} />
            </div>
            <div className="transactions-table__details">
              <Text size="sm" weight="semibold">
                {transaction.description}
              </Text>
              <Text size="xs" color="secondary">
                {formatTransactionDate(transaction.beginDate)}
              </Text>
            </div>
            <div className="transactions-table__amount">
              <Currency value={transaction.amount} size="sm" weight="bold" />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
