import { Box, Stack, Text } from '@/elements';
import { EntryForm } from '@/components';
import { getEntries } from '@/actions/entries';
import { EntryList } from './EntryList';

export default async function EntriesPage() {
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
        <Text size="h2" as="h2" weight="bold">
          Manage Entries
        </Text>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
          <div>
            <Text size="h4" as="h3" weight="semibold" style={{ marginBottom: '16px' }}>
              Add New Entry
            </Text>
            <EntryForm />
          </div>

          <div>
            <Text size="h4" as="h3" weight="semibold" style={{ marginBottom: '16px' }}>
              All Entries
            </Text>
            <EntryList entries={entries} />
          </div>
        </div>
      </Stack>
    </Box>
  );
}
