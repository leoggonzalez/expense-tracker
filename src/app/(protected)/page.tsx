import { Container } from "@/components";
import { DashboardAllocations } from "@/app/(protected)/dashboard_allocations";
import { DashboardHeader } from "@/app/(protected)/dashboard_header";
import { DashboardRecentActivity } from "@/app/(protected)/dashboard_recent_activity";
import { DashboardUpcoming } from "@/app/(protected)/dashboard_upcoming";
import { Grid, Stack } from "@/elements";

export default async function HomePage(): Promise<React.ReactElement> {
  return (
    <Container>
      <Stack gap={24}>
        <DashboardHeader />

        <DashboardAllocations />

        <Grid minColumnWidth={360} gap={24}>
          <DashboardUpcoming />
          <DashboardRecentActivity />
        </Grid>
      </Stack>
    </Container>
  );
}
