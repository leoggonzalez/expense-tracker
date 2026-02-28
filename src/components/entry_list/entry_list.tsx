"use client";

import "./entry_list.scss";

import { Button } from "@/components";
import { Stack, Text } from "@/elements";
import { deleteEntry } from "@/actions/entries";
import { i18n } from "@/model/i18n";
import { Entry } from "@/model";
import { format } from "date-fns";
import React from "react";

export type EntryListItem = {
  id: string;
  type: string;
  groupName: string;
  description: string;
  amount: number;
  beginDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export interface EntryListProps {
  entries: EntryListItem[];
  showEdit?: boolean;
}

export function EntryList({
  entries: plainEntries,
}: EntryListProps): React.ReactElement {
  const handleDelete = async (id: string) => {
    if (confirm(String(i18n.t("entry_list.delete_confirm")))) {
      await deleteEntry(id);
    }
  };

  const entries = plainEntries.map((entry) =>
    Entry.fromJSON({
      ...entry,
      beginDate: new Date(entry.beginDate),
      endDate: entry.endDate ? new Date(entry.endDate) : null,
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt),
    }),
  );

  if (entries.length === 0) {
    return (
      <div className="entry-list entry-list--empty">
        <Text color="secondary">
          {String(i18n.t("entry_list.empty_state"))}
        </Text>
      </div>
    );
  }

  return (
    <div className="entry-list">
      <Stack gap={12}>
        {entries.map((entry) => (
          <div key={entry.id} className="entry-list__item">
            <div className="entry-list__content">
              <div className="entry-list__main">
                <Text size="sm" weight="semibold">
                  {entry.groupName}
                </Text>
                <Text size="xs" color="secondary">
                  {entry.description}
                </Text>
              </div>
              <div className="entry-list__details">
                <Text
                  size="sm"
                  weight="bold"
                  color={entry.isIncome() ? "success" : "danger"}
                >
                  {entry.getFormattedAmount()}
                </Text>
                <Text size="xs" color="secondary">
                  {format(entry.beginDate, "MMM dd, yyyy")}
                  {entry.endDate &&
                    ` - ${format(entry.endDate, "MMM dd, yyyy")}`}
                </Text>
              </div>
            </div>
            <div className="entry-list__actions">
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDelete(entry.id)}
              >
                {String(i18n.t("entry_list.delete"))}
              </Button>
            </div>
          </div>
        ))}
      </Stack>
    </div>
  );
}
