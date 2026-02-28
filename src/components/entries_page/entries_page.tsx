import "./entries_page.scss";

import { BulkEntryForm, Container, EntryForm, EntryList } from "@/components";
import { EntryListItem } from "@/components/entry_list/entry_list";
import { Grid, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";
import Link from "next/link";
import React from "react";

export interface EntriesPageProps {
  entries: EntryListItem[];
}

export function EntriesPage({ entries }: EntriesPageProps): React.ReactElement {
  return (
    <Container>
      <Stack gap={32}>
        <Text size="h2" as="h2" weight="bold">
          {String(i18n.t("entries_page.title"))}
        </Text>

        <Grid minColumnWidth={320} gap={32}>
          <div className="entries-page__section">
            <div className="entries-page__section-heading">
              <Text size="h4" as="h3" weight="semibold">
                {String(i18n.t("entries_page.add_new_entry"))}
              </Text>
            </div>
            <EntryForm />
          </div>

          <div className="entries-page__section">
            <div className="entries-page__section-heading">
              <Text size="h4" as="h3" weight="semibold">
                {String(i18n.t("entries_page.add_multiple_entries"))}
              </Text>
            </div>
            <BulkEntryForm />
          </div>
        </Grid>

        <div>
          <Stack
            direction="row"
            justify="space-between"
            align="center"
            wrap
            className="entries-page__header"
          >
            <Text size="h4" as="h3" weight="semibold">
              {String(i18n.t("entries_page.recent_entries", { count: 10 }))}
            </Text>
            <Link href="/entries/all" className="entries-page__link">
              {`${String(i18n.t("entries_page.see_all_entries"))} →`}
            </Link>
          </Stack>
          <EntryList entries={entries} />
        </div>
      </Stack>
    </Container>
  );
}
