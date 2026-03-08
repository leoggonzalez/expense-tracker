import { getRecentEntries } from "@/actions/entries";
import { NewEntryRecentEntries } from "@/components";

type EntriesNewLayoutProps = {
  children: React.ReactNode;
};

export default async function Layout({
  children,
}: EntriesNewLayoutProps): Promise<React.ReactElement> {
  const recentEntries = await getRecentEntries(5);

  const serializedEntries = recentEntries.map((entry) => ({
    id: entry.id,
    type: entry.type,
    accountName: entry.account.name,
    description: entry.description,
    amount:
      entry.type === "expense" && entry.amount > 0
        ? -entry.amount
        : entry.amount,
    beginDate: entry.beginDate.toISOString(),
    endDate: entry.endDate?.toISOString() || null,
    transferAccountId: entry.transferAccountId,
    transferAccountName: entry.transferAccount?.name || null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  }));

  return (
    <>
      {children}
      <NewEntryRecentEntries entries={serializedEntries} />
    </>
  );
}
