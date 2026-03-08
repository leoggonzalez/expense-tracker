"use client";

import "./entry_list.scss";

import { AppLink, Button, EntryCard } from "@/components";
import { Card, Text } from "@/elements";
import { deleteEntry } from "@/actions/entries";
import { i18n } from "@/model/i18n";
import React from "react";

export type EntryListItem = {
  id: string;
  type: string;
  accountName: string;
  description: string;
  amount: number;
  beginDate: string;
  endDate: string | null;
  transferAccountId?: string | null;
  transferAccountName?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EntryListSummaryRow = {
  id: string;
  label: React.ReactNode;
  value?: React.ReactNode;
  href?: string;
  tone?: "default" | "emphasis";
};

export interface EntryListProps {
  entries: EntryListItem[];
  showEdit?: boolean;
  showDelete?: boolean;
  entryHref?: (entry: EntryListItem) => string | null;
  entryHrefBase?: string;
  topSummaryRows?: EntryListSummaryRow[];
  summaryRows?: EntryListSummaryRow[];
}

export function EntryList({
  entries: plainEntries,
  showDelete = true,
  entryHref,
  entryHrefBase,
  topSummaryRows = [],
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

  return (
    <div className="entry-list">
      <div className="entry-list__list">
        <Card padding={0}>
          {topSummaryRows.map((row) => (
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
                  <span className="entry-list__summary-value">{row.value}</span>
                )
              ) : null}
            </div>
          ))}

          {plainEntries.map((entry) => {
            const href =
              entryHref?.(entry) ??
              (entryHrefBase ? `${entryHrefBase}/${entry.id}` : null);

            const rowMain = (
              <EntryCard entry={entry} />
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
                  <span className="entry-list__summary-value">{row.value}</span>
                )
              ) : null}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
