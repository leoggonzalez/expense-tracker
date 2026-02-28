import Link from "next/link";
import { Stack, Text } from "@/elements";
import { EntryForm, BulkEntryForm, Container } from "@/components";
import { getRecentEntries } from "@/actions/entries";
import { EntryList } from "@/app/entries/entry_list";
import { i18n } from "@/model/i18n";

export default async function EntriesPage(): Promise<React.ReactElement> {
  const entriesData = await getRecentEntries(10);
  // Convert to plain objects for client components
  const entries = entriesData.map((entry) => ({
    id: entry.id,
    type: entry.type,
    groupName: entry.group.name,
    description: entry.description,
    amount: entry.amount,
    beginDate: entry.beginDate.toISOString(),
    endDate: entry.endDate?.toISOString() || null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  }));

  return (
    <Container>
      <Stack gap={32}>
        <Text size="h2" as="h2" weight="bold">
          {String(i18n.t("entries_page.title"))}
        </Text>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "32px",
          }}
        >
          <div>
            <div style={{ marginBottom: "16px" }}>
              <Text size="h4" as="h3" weight="semibold">
                {String(i18n.t("entries_page.add_new_entry"))}
              </Text>
            </div>
            <EntryForm />
          </div>

          <div>
            <div style={{ marginBottom: "16px" }}>
              <Text size="h4" as="h3" weight="semibold">
                {String(i18n.t("entries_page.add_multiple_entries"))}
              </Text>
            </div>
            <BulkEntryForm />
          </div>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <Text size="h4" as="h3" weight="semibold">
              {String(i18n.t("entries_page.recent_entries", { count: 10 }))}
            </Text>
            <Link
              href="/entries/all"
              style={{ color: "var(--color-primary)", fontWeight: 500 }}
            >
              {`${String(i18n.t("entries_page.see_all_entries"))} →`}
            </Link>
          </div>
          <EntryList entries={entries} />
        </div>
      </Stack>
    </Container>
  );
}
