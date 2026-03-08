import { notFound } from "next/navigation";

import { EntryDetailPage } from "@/components";
import { getAccounts, getEntryById } from "@/actions/entries";

export const dynamic = "force-dynamic";

type EntryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({
  params,
}: EntryPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const [entry, accounts] = await Promise.all([
    getEntryById(id),
    getAccounts(),
  ]);

  if (!entry) {
    notFound();
  }

  return (
    <EntryDetailPage
      accounts={accounts.map((account) => account.name)}
      entry={{
        id: entry.id,
        type: entry.type,
        accountName: entry.account.name,
        description: entry.description,
        amount: entry.amount,
        beginDate: entry.beginDate.toISOString(),
        endDate: entry.endDate?.toISOString() || null,
      }}
    />
  );
}
