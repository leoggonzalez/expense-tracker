import { EntriesPage } from "@/components";
import { getRecentEntries } from "@/actions/entries";
import { requireCurrentUser } from "@/lib/session";

export default async function Page(): Promise<React.ReactElement> {
  await requireCurrentUser();
  const entriesData = await getRecentEntries(10);
  const entries = entriesData.map((entry) => ({
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

  return <EntriesPage entries={entries} />;
}
