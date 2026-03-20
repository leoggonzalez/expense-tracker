"use client";

import "./entries_table.scss";

import { Avatar, Currency, useNavigationProgress } from "@/components";
import { format } from "date-fns";
import React from "react";

import { Card, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export type EntriesTableItem = {
  id: string;
  type: string;
  spaceName: string;
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
      <div className="entries-table__empty">
        <Card padding={32} variant="dashed">
          <Text color="secondary">{i18n.t("entries_page.empty_state")}</Text>
        </Card>
      </div>
    );
  }

  const formatEntryDate = (beginDate: string): string => {
    const formattedBeginDate = format(new Date(beginDate), "MMM dd, yyyy");
    return formattedBeginDate;
  };

  return (
    <div className="entries-table">
      <Card padding={0}>
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
            <div className="entries-table__space">
              <Avatar name={entry.spaceName} />
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
              <Currency value={entry.amount} size="sm" weight="bold" />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
