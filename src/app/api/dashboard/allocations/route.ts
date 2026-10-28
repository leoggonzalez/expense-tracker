import { startOfMonth } from "date-fns";
import { NextResponse } from "next/server";

import { formatProjectionMonthKey } from "@/lib/projection_month";
import { Transaction } from "@/lib/transaction";
import { getCurrentUserAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const currentUser = await getCurrentUserAccount();
  if (!currentUser)
    return NextResponse.json(
      { ok: false },
      {
        status: 401,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      },
    );
  const monthStart = startOfMonth(new Date());
  const summary = await Transaction.getMonthCategoryAllocationsForUser(
    currentUser.id,
    monthStart,
  );
  const payload = {
    ...summary,
    monthKey: formatProjectionMonthKey(monthStart),
  };
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
