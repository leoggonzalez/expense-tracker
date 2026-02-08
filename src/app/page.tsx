import { Box, Stack } from '@/elements';
import { Dashboard } from '@/components';
import { getEntries } from '@/actions/entries';

export default async function HomePage() {
  const entriesData = await getEntries();
  // Convert to plain objects for client components
  const entries = entriesData.map((entry) => ({
    id: entry.id,
    type: entry.type,
    group: entry.group,
    description: entry.description,
    amount: entry.amount,
    beginDate: entry.beginDate.toISOString(),
    endDate: entry.endDate?.toISOString() || null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  }));

  return (
    <Box padding={32} maxWidth={1200}>
      <Stack gap={32}>
        <Dashboard entries={entries} />
      </Stack>
    </Box>
  );
}
