import "./new_entry_recent_entries.scss";

import { AppLink, Container, EntryList, EntryListItem } from "@/components";
import { Card, Stack, Text } from "@/elements";

import React from "react";
import { i18n } from "@/model/i18n";

type NewEntryRecentEntriesProps = {
  entries: EntryListItem[];
};

export function NewEntryRecentEntries({
  entries,
}: NewEntryRecentEntriesProps): React.ReactElement {
  return (
    <Container>
      <div className="new-entry-recent-entries">
        <Card
          as="section"
          padding={24}
          title={String(i18n.t("new_entry_page.recent_entries"))}
          icon="activity"
        >
          <Stack gap={20}>
            <Stack gap={12}>
              <Text size="sm" color="secondary">
                {i18n.t("new_entry_page.recent_entries_subtitle")}
              </Text>
              <div className="new-entry-recent-entries__all-link">
                <AppLink href="/entries">
                  {i18n.t("new_entry_page.open_all_entries")}
                </AppLink>
              </div>
            </Stack>

            <div className="new-entry-recent-entries__list-shell">
              <EntryList
                entries={entries}
                showDelete={false}
                entryHrefBase="/entries"
              />
            </div>
          </Stack>
        </Card>
      </div>
    </Container>
  );
}
