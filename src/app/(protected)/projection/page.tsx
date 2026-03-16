import { Container } from "@/components";
import { ProjectionPage as ProjectionPageContent } from "@/components/projection_page/projection_page";
import { startOfMonth } from "date-fns";

import { getProjectionPagePayload } from "@/actions/entries";

export const dynamic = "force-dynamic";

type ProjectionPageProps = {
  searchParams: Promise<{
    month?: string;
  }>;
};

function getFocusedMonth(month: string | undefined): Date {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return startOfMonth(new Date());
  }

  const parsed = new Date(`${month}-01T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return startOfMonth(new Date());
  }

  return startOfMonth(parsed);
}

export default async function ProjectionPage({
  searchParams,
}: ProjectionPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const focusedMonth = getFocusedMonth(params.month);
  const payload = await getProjectionPagePayload(focusedMonth);

  return (
    <Container>
      <ProjectionPageContent payload={payload} />
    </Container>
  );
}
