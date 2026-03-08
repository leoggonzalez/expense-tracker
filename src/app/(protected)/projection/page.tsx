import { Container, ProjectionTable } from "@/components";

import { getProjectionEntries } from "@/actions/entries";

export const dynamic = "force-dynamic";

export default async function ProjectionPage(): Promise<React.ReactElement> {
  const entries = await getProjectionEntries();

  return (
    <Container>
      <ProjectionTable entries={entries} />
    </Container>
  );
}
