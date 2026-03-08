import { Container, Dashboard } from "@/components";
import { getDashboardPayload } from "@/actions/entries";

import { Stack } from "@/elements";

export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<React.ReactElement> {
  const dashboardPayload = await getDashboardPayload();

  return (
    <Container>
      <Stack gap={32}>
        <Dashboard
          totals={dashboardPayload.totals}
          currentMonthRange={dashboardPayload.currentMonthRange}
          recentEntries={dashboardPayload.recentEntries}
        />
      </Stack>
    </Container>
  );
}
