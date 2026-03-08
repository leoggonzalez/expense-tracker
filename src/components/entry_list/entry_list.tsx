"use client";

import "./entry_list.scss";

import { AppLink, Avatar, Button } from "@/components";
import { Card, Text } from "@/elements";
import { deleteEntry } from "@/actions/entries";
import { i18n } from "@/model/i18n";
import { format } from "date-fns";
import React from "react";

export type EntryListItem = {
  id: string;
  type: string;
  accountName: string;
  description: string;
  amount: number;
  beginDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EntryListSummaryRow = {
  id: string;
  label: string;
  value?: string;
  href?: string;
  tone?: "default" | "emphasis";
};

export interface EntryListProps {
  entries: EntryListItem[];
  showEdit?: boolean;
  showDelete?: boolean;
  entryHref?: (entry: EntryListItem) => string | null;
  entryHrefBase?: string;
  summaryRows?: EntryListSummaryRow[];
}

export function EntryList({
  entries: plainEntries,
  showDelete = true,
  entryHref,
  entryHrefBase,
  summaryRows = [],
}: EntryListProps): React.ReactElement {
  const handleDelete = async (id: string) => {
    if (confirm(i18n.t("entry_list.delete_confirm") as string)) {
      await deleteEntry(id);
    }
  };

  if (plainEntries.length === 0) {
    return (
      <div className="entry-list entry-list--empty">
        <Card padding={32} variant="dashed">
          <Text color="secondary">{i18n.t("entry_list.empty_state")}</Text>
        </Card>
      </div>
    );
  }

  const formatAmount = (type: string, amount: number): string => {
    const normalizedAmount =
      type === "expense" && amount > 0 ? -amount : amount;
    const sign = normalizedAmount < 0 ? "-" : "";
    return `${sign}${Math.abs(normalizedAmount).toFixed(2)} €`;
  };

  return (
    <div className="entry-list">
      <div className="entry-list__list">
        <Card padding={0}>
          {plainEntries.map((entry) => {
            const href =
              entryHref?.(entry) ??
              (entryHrefBase ? `${entryHrefBase}/${entry.id}` : null);

            const rowMain = (
              <div className="entry-list__row-main">
                <div className="entry-list__account">
                  <Avatar name={entry.accountName} />
                </div>
                <div className="entry-list__details">
                  <div className="entry-list__detail-line">
                    <Text size="sm" weight="semibold">
                      {entry.description}
                    </Text>
                  </div>
                  <div className="entry-list__detail-line">
                    <Text size="xs" color="secondary">
                      {format(new Date(entry.beginDate), "MMM dd, yyyy")}
                    </Text>
                  </div>
                </div>
                <div className="entry-list__amount">
                  <Text
                    size="sm"
                    weight="bold"
                    color={entry.type === "income" ? "success" : "danger"}
                  >
                    {formatAmount(entry.type, entry.amount)}
                  </Text>
                </div>
              </div>
            );

            const content = (
              <div className="entry-list__content">
                {href ? (
                  <div className="entry-list__link">
                    <AppLink href={href}>
                      <span className="entry-list__link-content">
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
              <div key={entry.id} className="entry-list__row">
                {content}
                {showDelete && (
                  <div className="entry-list__actions">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(entry.id)}
                    >
                      {i18n.t("entry_list.delete")}
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
                "entry-list__summary-row",
                row.tone === "emphasis" && "entry-list__summary-row--emphasis",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {row.href ? (
                <div className="entry-list__summary-link">
                  <AppLink href={row.href}>{row.label}</AppLink>
                </div>
              ) : (
                <Text size="sm" color="secondary">
                  {row.label}
                </Text>
              )}
              {row.value ? (
                <Text size="sm" weight="bold">
                  {row.value}
                </Text>
              ) : null}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
