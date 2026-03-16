import {
  AccountDetailPage,
} from "@/components";
import { getAccountDetailPageData, unarchiveAccount } from "@/actions/accounts";

import { notFound } from "next/navigation";
import { startOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

type AccountRouteProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
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
  params,
  searchParams,
}: AccountRouteProps): Promise<React.ReactElement> {
  const { id } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number(query.page || "1") || 1);
  const selectedMonthStart = parseCurrentMonthOrNow(query.currentMonth);

  const data = await getAccountDetailPageData({
    accountId: id,
    page,
    limit: 10,
    selectedMonthStart,
  });

  if (!data) {
    notFound();
  }

  async function handleUnarchiveAction(): Promise<void> {
    "use server";

    await unarchiveAccount(id);
  }

  return <AccountDetailPage data={data} onUnarchiveAction={handleUnarchiveAction} />;
}
