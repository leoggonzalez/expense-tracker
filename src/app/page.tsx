import { Stack } from "@/elements";
import { Dashboard, Container } from "@/components";
import { getEntries } from "@/actions/entries";
import { requireCurrentUser } from "@/lib/session";

export default async function HomePage(): Promise<React.ReactElement> {
  await requireCurrentUser();
  const entriesData = await getEntries();
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

  return (
    <Container>
      <Stack gap={32}>
        <Dashboard entries={entries} />
      </Stack>
    </Container>
  );
}
