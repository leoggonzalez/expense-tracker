import { Container, ProjectionOverview } from "@/components";
import { format, startOfMonth } from "date-fns";

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

  const chartData = payload.chartMonths.map((month) => ({
    monthLabel: format(new Date(`${month.monthKey}-01T00:00:00`), "MMM yyyy"),
    income: month.income,
    expenses: Math.abs(month.expense),
  }));

  return (
    <Container>
      <ProjectionOverview
        focusedMonthLabel={payload.focusedMonth.label}
        previousMonthKey={payload.previousMonthKey}
        nextMonthKey={payload.nextMonthKey}
        chartData={chartData}
        totals={payload.focusedMonthTotals}
        accounts={payload.focusedMonthAccounts}
      />
    </Container>
  );
}
