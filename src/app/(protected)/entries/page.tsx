import { getAccounts, getEntriesWithFilters } from "@/actions/entries";

import { Container, EntriesPage } from "@/components";

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

  return (
    <Container maxWidth="wide">
      <EntriesPage
        accounts={accounts.map((entryAccount) => ({
          id: entryAccount.id,
          name: entryAccount.name,
        }))}
        entriesData={entriesData}
        filters={{
          account,
          type,
          startDate,
          endDate,
        }}
      />
    </Container>
  );
}
