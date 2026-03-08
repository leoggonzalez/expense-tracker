"use client";

import "./entries_table.scss";

import { Avatar, useNavigationProgress } from "@/components";
import { format } from "date-fns";
import React from "react";

import { Card, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export type EntriesTableItem = {
  id: string;
  type: string;
  accountName: string;
  description: string;
  amount: number;
  beginDate: string;
  endDate: string | null;
};

type EntriesTableProps = {
  entries: EntriesTableItem[];
};

export function EntriesTable({
  entries,
}: EntriesTableProps): React.ReactElement {
  const { push } = useNavigationProgress();

  if (entries.length === 0) {
    return (
      <Card padding={32} variant="dashed" className="entries-table__empty">
        <Text color="secondary">{i18n.t("entries_page.empty_state")}</Text>
      </Card>
    );
  }

  const formatAmount = (type: string, amount: number): string => {
    const normalizedAmount =
      type === "expense" && amount > 0 ? -amount : amount;
    const sign = normalizedAmount < 0 ? "-" : "";
    return `${sign}${Math.abs(normalizedAmount).toFixed(2)} €`;
  };

  const formatEntryDate = (
    beginDate: string,
  ): string => {
    const formattedBeginDate = format(new Date(beginDate), "MMM dd, yyyy");
    return formattedBeginDate;
  };

  return (
    <Card padding={0} className="entries-table">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="entries-table__row"
          onClick={() => push(`/entries/${entry.id}`)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              push(`/entries/${entry.id}`);
            }
          }}
          role="link"
          tabIndex={0}
        >
          <div className="entries-table__account">
            <Avatar name={entry.accountName} />
          </div>
          <div className="entries-table__details">
            <Text size="sm" weight="semibold">
              {entry.description}
            </Text>
            <Text size="xs" color="secondary">
              {formatEntryDate(entry.beginDate)}
            </Text>
          </div>
          <div className="entries-table__amount">
            <Text
              size="sm"
              weight="bold"
              color={entry.type === "income" ? "success" : "danger"}
            >
              {formatAmount(entry.type, entry.amount)}
            </Text>
          </div>
        </div>
      ))}
    </Card>
  );
}
