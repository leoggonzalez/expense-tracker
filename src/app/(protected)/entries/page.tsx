import { getAccounts, getEntriesWithFilters } from "@/actions/entries";

import {
  Container,
  EntriesFilters,
  EntriesPagination,
  EntriesTable,
  Hero,
  HeroActionLink,
  HeroMetric,
  HeroMetrics,
} from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

type EntriesPageSearchParams = Promise<{
  page?: string;
  account?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
}>;

type EntriesPageProps = {
  searchParams: EntriesPageSearchParams;
};

export default async function Page({
  searchParams,
}: EntriesPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || "1") || 1);
  const account = params.account || "";
  const type =
    params.type === "income" ||
    params.type === "expense" ||
    params.type === "transfer"
      ? params.type
      : "";
  const startDate = params.start_date || "";
  const endDate = params.end_date || "";

  const [entriesData, accounts] = await Promise.all([
    getEntriesWithFilters({
      accountId: account || undefined,
      type: type || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit: 20,
    }),
    getAccounts(),
  ]);
  const activeFilterCount = Object.values({
    account,
    type,
    startDate,
    endDate,
  }).filter(Boolean).length;

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="entries"
          title={String(i18n.t("entries_page.title"))}
          pattern="entries"
          actions={
            <>
              <HeroActionLink href="/entries/new/expense" variant="primary">
                {i18n.t("entries_page.add_entry")}
              </HeroActionLink>
              <HeroActionLink href="/entries/new/multiple">
                {i18n.t("entries_page.add_multiple_entries")}
              </HeroActionLink>
            </>
          }
        >
          <Stack gap={24}>
            <Text as="p" size="sm" color="inverse">
              {i18n.t("entries_page.subtitle")}
            </Text>

            <HeroMetrics columns={3}>
              <HeroMetric>
                <Text as="span" size="xs" color="inverse" weight="medium">
                  {i18n.t("entries_page.summary_shown")}
                </Text>
                <Text as="span" size="lg" color="inverse" weight="semibold">
                  {entriesData.entries.length}
                </Text>
              </HeroMetric>
              <HeroMetric tone="soft">
                <Text as="span" size="xs" color="inverse" weight="medium">
                  {i18n.t("entries_page.summary_total")}
                </Text>
                <Text as="span" size="lg" color="inverse" weight="semibold">
                  {entriesData.pagination.total}
                </Text>
              </HeroMetric>
              <HeroMetric tone="soft">
                <Text as="span" size="xs" color="inverse" weight="medium">
                  {i18n.t("entries_page.summary_filters")}
                </Text>
                <Text as="span" size="lg" color="inverse" weight="semibold">
                  {activeFilterCount}
                </Text>
              </HeroMetric>
            </HeroMetrics>
          </Stack>
        </Hero>

        <Card
          as="section"
          padding={24}
          title={String(i18n.t("entries_page.filters"))}
          icon="entries"
        >
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
            }}
          />
        </Card>

        <Card
          as="section"
          padding={24}
          title={String(i18n.t("entries_page.results_title"))}
          icon="activity"
        >
          <Stack gap={20}>
            <Text size="sm" color="secondary">
              {i18n.t("entries_page.showing_results", {
                count: entriesData.entries.length,
                total: entriesData.pagination.total,
              })}
            </Text>

            <EntriesTable entries={entriesData.entries} />

            {entriesData.pagination.totalPages > 1 ? (
              <EntriesPagination
                currentPage={entriesData.pagination.page}
                totalPages={entriesData.pagination.totalPages}
              />
            ) : null}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
