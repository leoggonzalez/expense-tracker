import { getAccounts, getEntriesWithFilters } from "@/actions/entries";

import {
  AppLink,
  Container,
  EntriesFilters,
  EntriesPagination,
  EntriesTable,
} from "@/components";
import { Stack, Text } from "@/elements";
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
    params.type === "income" || params.type === "expense" ? params.type : "";
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

  return (
    <Container maxWidth="wide">
      <Stack gap={24}>
        <Stack direction="row" align="center" justify="space-between" wrap gap={16}>
          <Text size="h2" as="h2" weight="bold">
            {i18n.t("entries_page.title")}
          </Text>
          <AppLink href="/entries/new/expense">
            {i18n.t("entries_page.add_entry")}
          </AppLink>
        </Stack>

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

        <Text size="sm" color="secondary">
          {i18n.t("entries_page.showing_results", {
            count: entriesData.entries.length,
            total: entriesData.pagination.total,
          })}
        </Text>

        <EntriesTable entries={entriesData.entries} />

        {entriesData.pagination.totalPages > 1 && (
          <EntriesPagination
            currentPage={entriesData.pagination.page}
            totalPages={entriesData.pagination.totalPages}
          />
        )}
      </Stack>
    </Container>
  );
}
