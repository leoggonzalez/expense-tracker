"use client";

import "./entry_list.scss";

import { Stack, Text } from "@/elements";

import { Button } from "@/components";
import { Entry } from "@/model";
import React from "react";
import { deleteEntry } from "@/actions/entries";
import { describe } from "node:test";
import { format } from "date-fns";
import { group } from "console";

export interface EntryListProps {
  entries: Array<{
    id: string;
    type: string;
    groupName: string;
    description: string;
    amount: number;
    beginDate: string;
    endDate: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  showEdit?: boolean;
}

export const EntryList: React.FC<EntryListProps> = ({
  entries: plainEntries,
  showEdit = false,
}) => {
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      await deleteEntry(id);
    }
  };

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

  if (entries.length === 0) {
    return (
      <div className="entry-list entry-list--empty">
        <Text color="secondary">No entries yet. Add your first entry!</Text>
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
                Delete
              </Button>
            </div>
          </div>
        ))}
      </Stack>
    </div>
  );
};
