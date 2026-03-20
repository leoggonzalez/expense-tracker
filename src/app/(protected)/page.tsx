import {
  Container,
  DashboardHero,
  DashboardPanels,
  RecentActivityPanel,
  UpcomingPaymentsPanel,
} from "@/components";
import { Stack } from "@/elements";
import { getDashboardPayload } from "@/actions/transactions";

export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<React.ReactElement> {
  const dashboardPayload = await getDashboardPayload();

  return (
    <Container>
      <Stack gap={24}>
        <DashboardHero
          totals={dashboardPayload.totals}
          currentMonthRange={dashboardPayload.currentMonthRange}
        />
        <DashboardPanels>
          <UpcomingPaymentsPanel
            currentMonthRange={dashboardPayload.currentMonthRange}
            upcomingPayments={dashboardPayload.upcomingPayments}
          />
          <RecentActivityPanel
            currentMonthRange={dashboardPayload.currentMonthRange}
            recentTransactions={dashboardPayload.recentTransactions}
          />
        </DashboardPanels>
      </Stack>
    </Container>
  );
}
