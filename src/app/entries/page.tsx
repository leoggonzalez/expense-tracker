import { EntriesPage } from "@/components";
import { getAccounts, getEntriesWithFilters } from "@/actions/entries";
import { requireCurrentUser } from "@/lib/session";

type EntriesPageSearchParams = Promise<{
  page?: string;
  account?: string;
  type?: string;
  date?: string;
  start_date?: string;
  end_date?: string;
}>;

type EntriesPageProps = {
  searchParams: EntriesPageSearchParams;
};

export default async function Page({
  searchParams,
}: EntriesPageProps): Promise<React.ReactElement> {
  await requireCurrentUser();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || "1") || 1);
  const account = params.account || "";
  const type =
    params.type === "income" || params.type === "expense" ? params.type : "";
  const exactDate = params.date || "";
  const startDate = params.start_date || "";
  const endDate = params.end_date || "";

  const [entriesData, accounts] = await Promise.all([
    getEntriesWithFilters({
      accountId: account || undefined,
      type: type || undefined,
      date: exactDate ? new Date(exactDate) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit: 20,
    }),
    getAccounts(),
  ]);

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
    <EntriesPage
      entries={entries}
      accounts={accounts.map((entryAccount) => ({
        id: entryAccount.id,
        name: entryAccount.name,
      }))}
      filters={{
        account,
        type,
        date: exactDate,
        startDate,
        endDate,
      }}
      pagination={entriesData.pagination}
    />
  );
}
