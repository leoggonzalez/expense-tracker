import "./new_entry_recent_entries.scss";

import React from "react";

import { AppLink, Container, EntryList, EntryListItem } from "@/components";
import { Stack, Text } from "@/elements";
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
        <Stack gap={12}>
          <Stack direction="row" align="center" justify="space-between" gap={8}>
            <Text size="h4" as="h2" weight="semibold">
              {i18n.t("new_entry_page.recent_entries")}
            </Text>
            <div className="new-entry-recent-entries__all-link">
              <AppLink href="/entries">
                {i18n.t("new_entry_page.open_all_entries")}
              </AppLink>
            </div>
          </Stack>

          <EntryList
            entries={entries}
            showDelete={false}
            entryHrefBase="/entries"
          />
        </Stack>
      </div>
    </Container>
  );
}
