"use client";

import "./transaction_list.scss";

import { AppLink, Button, TransactionCard } from "@/components";
import { Card, Text } from "@/elements";
import { deleteTransaction } from "@/actions/transactions";
import { i18n } from "@/model/i18n";
import React from "react";

export type TransactionListItem = {
  id: string;
  type: string;
  spaceName: string;
  description: string;
  amount: number;
  beginDate: string;
  endDate: string | null;
  transferSpaceId?: string | null;
  transferSpaceName?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TransactionListSummaryRow = {
  id: string;
  label: React.ReactNode;
  value?: React.ReactNode;
  href?: string;
  tone?: "default" | "emphasis";
};

export interface TransactionListProps {
  transactions: TransactionListItem[];
  showEdit?: boolean;
  showDelete?: boolean;
  transactionHref?: (transaction: TransactionListItem) => string | null;
  transactionHrefBase?: string;
  topSummaryRows?: TransactionListSummaryRow[];
  summaryRows?: TransactionListSummaryRow[];
}

export function TransactionList({
  transactions: plainTransactions,
  showDelete = true,
  transactionHref,
  transactionHrefBase,
  topSummaryRows = [],
  summaryRows = [],
}: TransactionListProps): React.ReactElement {
  const handleDelete = async (id: string) => {
    if (confirm(i18n.t("transaction_list.delete_confirm") as string)) {
      await deleteTransaction(id);
    }
  };

  if (plainTransactions.length === 0) {
    return (
      <div className="transaction-list transaction-list--empty">
        <Card padding={32} variant="dashed">
          <Text color="secondary">{i18n.t("transaction_list.empty_state")}</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="transaction-list">
      <div className="transaction-list__list">
        <Card padding={0}>
          {topSummaryRows.map((row) => (
            <div
              key={row.id}
              className={[
                "transaction-list__summary-row",
                row.tone === "emphasis" && "transaction-list__summary-row--emphasis",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {row.href ? (
                <div className="transaction-list__summary-link">
                  <AppLink href={row.href}>{row.label}</AppLink>
                </div>
              ) : (
                <Text size="sm" color="secondary" as="span">
                  {row.label}
                </Text>
              )}
              {row.value ? (
                typeof row.value === "string" ? (
                  <Text size="sm" weight="bold" as="span">
                    {row.value}
                  </Text>
                ) : (
                  <span className="transaction-list__summary-value">{row.value}</span>
                )
              ) : null}
            </div>
          ))}

          {plainTransactions.map((transaction) => {
            const href =
              transactionHref?.(transaction) ??
              (transactionHrefBase ? `${transactionHrefBase}/${transaction.id}` : null);

            const rowMain = <TransactionCard transaction={transaction} />;

            const content = (
              <div className="transaction-list__content">
                {href ? (
                  <div className="transaction-list__link">
                    <AppLink href={href}>
                      <span className="transaction-list__link-content">
                        {rowMain}
                      </span>
                    </AppLink>
                  </div>
                ) : (
                  rowMain
                )}
              </div>
            );

            return (
              <div key={transaction.id} className="transaction-list__row">
                {content}
                {showDelete && (
                  <div className="transaction-list__actions">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      {i18n.t("transaction_list.delete")}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {summaryRows.map((row) => (
            <div
              key={row.id}
              className={[
                "transaction-list__summary-row",
                row.tone === "emphasis" && "transaction-list__summary-row--emphasis",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {row.href ? (
                <div className="transaction-list__summary-link">
                  <AppLink href={row.href}>{row.label}</AppLink>
                </div>
              ) : (
                <Text size="sm" color="secondary" as="span">
                  {row.label}
                </Text>
              )}
              {row.value ? (
                typeof row.value === "string" ? (
                  <Text size="sm" weight="bold" as="span">
                    {row.value}
                  </Text>
                ) : (
                  <span className="transaction-list__summary-value">{row.value}</span>
                )
              ) : null}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
