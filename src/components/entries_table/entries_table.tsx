"use client";

import "./entries_table.scss";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import React from "react";

import { Text } from "@/elements";
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
  const router = useRouter();

  if (entries.length === 0) {
    return (
      <div className="entries-table__empty">
        <Text color="secondary">{i18n.t("entries_page.empty_state")}</Text>
      </div>
    );
  }

  const formatAmount = (type: string, amount: number): string => {
    const normalizedAmount =
      type === "expense" && amount > 0 ? -amount : amount;
    const sign = normalizedAmount < 0 ? "-" : "";
    return `${sign}${Math.abs(normalizedAmount).toFixed(2)} €`;
  };

  const formatEntryDate = (beginDate: string, endDate: string | null): string => {
    const formattedBeginDate = format(new Date(beginDate), "MMM dd, yyyy");

    if (!endDate) {
      return formattedBeginDate;
    }

    return `${formattedBeginDate} - ${format(new Date(endDate), "MMM dd, yyyy")}`;
  };

  return (
    <div className="entries-table">
      <div className="entries-table__scroll">
        <table className="entries-table__table">
          <thead className="entries-table__head">
            <tr>
              <th className="entries-table__cell entries-table__cell--header">
                {i18n.t("entries_page.account")}
              </th>
              <th
                className={[
                  "entries-table__cell",
                  "entries-table__cell--header",
                  "entries-table__cell--details",
                ].join(" ")}
              >
                {i18n.t("entries_page.details")}
              </th>
              <th
                className={[
                  "entries-table__cell",
                  "entries-table__cell--header",
                  "entries-table__cell--amount",
                ].join(" ")}
              >
                {i18n.t("entries_page.amount")}
              </th>
              <th
                className={[
                  "entries-table__cell",
                  "entries-table__cell--header",
                  "entries-table__cell--date",
                ].join(" ")}
              >
                {i18n.t("entries_page.date")}
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="entries-table__row"
                onClick={() => router.push(`/entries/${entry.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/entries/${entry.id}`);
                  }
                }}
                role="link"
                tabIndex={0}
              >
                <td className="entries-table__cell">
                  <Text size="sm" weight="semibold">
                    {entry.accountName}
                  </Text>
                </td>
                <td className="entries-table__cell entries-table__cell--details">
                  <div className="entries-table__details">
                    <span
                      className={[
                        "entries-table__type",
                        `entries-table__type--${entry.type}`,
                      ].join(" ")}
                    >
                      {entry.type === "income"
                        ? i18n.t("common.income")
                        : i18n.t("common.expense")}
                    </span>
                    <Text size="sm">{entry.description}</Text>
                  </div>
                </td>
                <td className="entries-table__cell entries-table__cell--amount">
                  <Text
                    size="sm"
                    weight="bold"
                    color={entry.type === "income" ? "success" : "danger"}
                  >
                    {formatAmount(entry.type, entry.amount)}
                  </Text>
                </td>
                <td className="entries-table__cell entries-table__cell--date">
                  <Text size="sm" color="secondary">
                    {formatEntryDate(entry.beginDate, entry.endDate)}
                  </Text>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
