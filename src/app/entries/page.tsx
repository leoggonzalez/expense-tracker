import { EntriesPage } from "@/components";
import { getRecentEntries } from "@/actions/entries";

export default async function Page(): Promise<React.ReactElement> {
  const entriesData = await getRecentEntries(10);
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

  return <EntriesPage entries={entries} />;
}
