import { getAccountsCurrentMonthSummary } from "@/actions/accounts";
import { AccountsPage } from "@/components";
import { startOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

type AccountsRouteProps = {
  searchParams: Promise<{
    currentMonth?: string;
  }>;
};

function parseCurrentMonthOrNow(currentMonth: string | undefined): Date {
  if (!currentMonth || !/^\d{4}-\d{2}$/.test(currentMonth)) {
    return startOfMonth(new Date());
  }

  const parsed = new Date(`${currentMonth}-01T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return startOfMonth(new Date());
  }

  return startOfMonth(parsed);
}

export default async function Page({
  searchParams,
}: AccountsRouteProps): Promise<React.ReactElement> {
  const query = await searchParams;
  const selectedMonthStart = parseCurrentMonthOrNow(query.currentMonth);
  const accounts = await getAccountsCurrentMonthSummary(selectedMonthStart);

  return <AccountsPage accounts={accounts} selectedMonthStart={selectedMonthStart} />;
}
