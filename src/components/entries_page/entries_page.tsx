import "./entries_page.scss";

import { Container, EntryList } from "@/components";
import { EntryListItem } from "@/components/entry_list/entry_list";
import { Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";
import React from "react";
import Link from "next/link";

export interface EntriesPageProps {
  entries: EntryListItem[];
}

export function EntriesPage({ entries }: EntriesPageProps): React.ReactElement {
  return (
    <Container>
      <Stack gap={32}>
        <Stack
          direction="row"
          justify="space-between"
          align="center"
          wrap
          className="entries-page__header"
        >
          <Text size="h2" as="h2" weight="bold">
            {i18n.t("entries_page.title")}
          </Text>
          <Link href="/entries/new/income" className="entries-page__button-link">
            <span className="entries-page__button">
              {i18n.t("entries_page.add_entry")}
            </span>
          </Link>
        </Stack>

        <EntryList
          entries={entries}
          entryHref={(entry) => `/entries/${entry.id}`}
        />
      </Stack>
    </Container>
  );
}
