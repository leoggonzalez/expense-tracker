import { notFound } from "next/navigation";

import { EntryDetailPage } from "@/components";
import { getEntryById } from "@/actions/entries";

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
  const entry = await getEntryById(id);

  if (!entry) {
    notFound();
  }

  return (
    <EntryDetailPage
      entry={{
        id: entry.id,
        type: entry.type,
        accountId: entry.accountId,
        accountName: entry.account.name,
        transferAccountId: entry.transferAccountId,
        transferAccountName: entry.transferAccount?.name || null,
        description: entry.description,
        amount: entry.amount,
        beginDate: entry.beginDate.toISOString(),
        endDate: entry.endDate?.toISOString() || null,
      }}
    />
  );
}
