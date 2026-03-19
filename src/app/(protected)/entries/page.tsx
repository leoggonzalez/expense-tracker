import { Card, Stack, Text } from "@/elements";
import {
  Button,
  Container,
  EntriesFilters,
  EntriesTable,
  Hero,
} from "@/components";
import { getAccounts, getEntriesWithFilters } from "@/actions/entries";

import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

type EntriesPageSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

type EntriesPageProps = {
  searchParams: EntriesPageSearchParams;
};

export default async function Page({
  searchParams,
}: EntriesPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const page = Math.max(
    1,
    Number(
      (Array.isArray(params.page) ? params.page[0] : params.page) || "1",
    ) || 1,
  );
  const account = Array.isArray(params.account)
    ? params.account[0] || ""
    : params.account || "";
  const rawType = Array.isArray(params.type) ? params.type[0] : params.type;
  const type =
    rawType === "income" || rawType === "expense" || rawType === "transfer"
      ? rawType
      : "";
  const startDate = Array.isArray(params.start_date)
    ? params.start_date[0] || ""
    : params.start_date || "";
  const endDate = Array.isArray(params.end_date)
    ? params.end_date[0] || ""
    : params.end_date || "";
  const rawSearchTerms = Array.isArray(params.search)
    ? params.search
    : params.search
      ? [params.search]
      : [];
  const searchTerms = Array.from(
    new Set(rawSearchTerms.map((term) => term.trim()).filter(Boolean)),
  );

  const [entriesData, accounts] = await Promise.all([
    getEntriesWithFilters({
      accountId: account || undefined,
      type: type || undefined,
      searchTerms,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit: 20,
    }),
    getAccounts(),
  ]);

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="entries"
          title={String(i18n.t("entries_page.title"))}
          pattern="entries"
          actions={[
            {
              icon: "plus",
              title: String(i18n.t("entries_page.add_entry")),
              ariaLabel: String(i18n.t("entries_page.add_entry")),
              href: "/entries/new/expense",
              variant: "primary",
            },
            {
              icon: "entries",
              title: String(i18n.t("entries_page.add_multiple_entries")),
              ariaLabel: String(i18n.t("entries_page.add_multiple_entries")),
              href: "/entries/new/multiple",
              variant: "outline",
            },
          ]}
        >
          <Stack gap={24}>
            <Text as="p" size="sm" color="inverse">
              {i18n.t("entries_page.subtitle")}
            </Text>
          </Stack>
        </Hero>

        <Card
          as="section"
          padding={24}
          title={String(i18n.t("entries_page.results_title"))}
          icon="activity"
        >
          <Stack gap={20}>
            <EntriesFilters
              accounts={accounts.map((entryAccount) => ({
                id: entryAccount.id,
                name: entryAccount.name,
              }))}
              filters={{
                account,
                type,
                startDate,
                endDate,
                searchTerms,
              }}
            />

            <Text size="sm" color="secondary">
              {i18n.t("entries_page.showing_results", {
                count: entriesData.entries.length,
                total: entriesData.pagination.total,
              })}
            </Text>

            <EntriesTable entries={entriesData.entries} />

            {entriesData.pagination.page < entriesData.pagination.totalPages ? (
              <form method="get">
                {account ? (
                  <input type="hidden" name="account" value={account} />
                ) : null}
                {type ? <input type="hidden" name="type" value={type} /> : null}
                {startDate ? (
                  <input type="hidden" name="start_date" value={startDate} />
                ) : null}
                {endDate ? (
                  <input type="hidden" name="end_date" value={endDate} />
                ) : null}
                {searchTerms.map((searchTerm) => (
                  <input
                    key={searchTerm}
                    type="hidden"
                    name="search"
                    value={searchTerm}
                  />
                ))}
                <input
                  type="hidden"
                  name="page"
                  value={String(entriesData.pagination.page + 1)}
                />
                <Button type="submit">
                  {i18n.t("entries_page.load_more_entries")}
                </Button>
              </form>
            ) : null}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
