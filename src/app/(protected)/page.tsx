import { Container, Dashboard } from "@/components";
import { getDashboardPayload } from "@/actions/entries";

export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<React.ReactElement> {
  const dashboardPayload = await getDashboardPayload();

  return (
    <Container>
      <Dashboard
        totals={dashboardPayload.totals}
        currentMonthRange={dashboardPayload.currentMonthRange}
        recentEntries={dashboardPayload.recentEntries}
        upcomingPayments={dashboardPayload.upcomingPayments}
      />
    </Container>
  );
}
