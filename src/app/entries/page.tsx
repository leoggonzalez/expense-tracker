import Link from 'next/link';
import { Stack, Text } from '@/elements';
import { EntryForm, BulkEntryForm, Container } from '@/components';
import { getRecentEntries } from '@/actions/entries';
import { EntryList } from './EntryList';

export default async function EntriesPage() {
  const entriesData = await getRecentEntries(10);
  // Convert to plain objects for client components
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

  return (
    <Container>
      <Stack gap={32}>
        <Text size="h2" as="h2" weight="bold">
          Manage Entries
        </Text>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <div>
            <Text size="h4" as="h3" weight="semibold" style={{ marginBottom: '16px' }}>
              Add New Entry
            </Text>
            <EntryForm />
          </div>

          <div>
            <Text size="h4" as="h3" weight="semibold" style={{ marginBottom: '16px' }}>
              Add Multiple Entries
            </Text>
            <BulkEntryForm />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Text size="h4" as="h3" weight="semibold">
              Recent Entries (10 most recent)
            </Text>
            <Link href="/entries/all" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
              See all entries →
            </Link>
          </div>
          <EntryList entries={entries} />
        </div>
      </Stack>
    </Container>
  );
}
