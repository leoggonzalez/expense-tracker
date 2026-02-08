import { ProjectionTable, Container } from "@/components";
import { getEntries } from "@/actions/entries";

export default async function ProjectionPage() {
  const entriesData = await getEntries();
  // Convert to plain objects for client components
  const entries = entriesData.map((entry) => ({
    id: entry.id,
    type: entry.type,
    group: entry.group.name,
    description: entry.description,
    amount: entry.amount,
    beginDate: entry.beginDate.toISOString(),
    endDate: entry.endDate?.toISOString() || null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  }));

  return (
    <Container maxWidth="wide">
      <ProjectionTable entries={entries} />
    </Container>
  );
}
