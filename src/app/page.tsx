import { Stack } from "@/elements";
import { Dashboard, Container } from "@/components";
import { getEntries, getRecentEntries } from "@/actions/entries";
import { requireCurrentUser } from "@/lib/session";

export default async function HomePage(): Promise<React.ReactElement> {
  await requireCurrentUser();
  const entriesData = await getEntries();
  const recentEntriesData = await getRecentEntries(10);
  // Convert to plain objects for client components
  const entries = entriesData.map((entry) => ({
    id: entry.id,
    type: entry.type,
    account: entry.account.name,
    description: entry.description,
    amount: entry.amount,
    beginDate: entry.beginDate.toISOString(),
    endDate: entry.endDate?.toISOString() || null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  }));
  const recentEntries = recentEntriesData.map((entry) => ({
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
    <Container>
      <Stack gap={32}>
        <Dashboard entries={entries} recentEntries={recentEntries} />
      </Stack>
    </Container>
  );
}
