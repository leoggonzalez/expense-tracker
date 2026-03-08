import { getAccounts, getEntriesWithFilters } from "@/actions/entries";

import { EntriesPage } from "@/components";

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

  // TODO: getEntriesWithFilters should already return an entry with the account name, so we don't have to do an extra query for each entry. Make sure entries only fetch their account name and nothign else.
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

  // TODO: Entries should come already formatted from the server
  const entries = entriesData.entries.map((entry) => ({
    id: entry.id,
    type: entry.type,
    accountName: entry.account.name,
    description: entry.description,
    amount: entry.amount,
    beginDate: entry.beginDate.toISOString(),
    endDate: entry.endDate?.toISOString() || null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  }));

  return (
    /* TODO: we shouldn't have a specific entries page component. Rather here we want 3 sections:
    1. A header with the title and the "add entry" button
    2. A filters section with all the filters (account, type, date range). 
    3. The entries list with pagination
    */
    <EntriesPage
      entries={entries}
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
      pagination={entriesData.pagination}
    />
  );
}
