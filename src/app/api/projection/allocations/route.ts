import { NextResponse } from "next/server";

import {
  formatProjectionMonthKey,
  parseProjectionMonth,
} from "@/lib/projection_month";
import { getCurrentUserAccount } from "@/lib/session";
import { Transaction } from "@/lib/transaction";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const headers = { "Cache-Control": "private, no-store, max-age=0" };
  const currentUser = await getCurrentUserAccount();
  if (!currentUser)
    return NextResponse.json({ ok: false }, { status: 401, headers });
  const { searchParams } = new URL(request.url);
  const monthStart = parseProjectionMonth(
    searchParams.get("month") || undefined,
  );
  const summary = await Transaction.getMonthCategoryAllocationsForUser(
    currentUser.id,
    monthStart,
  );
  return NextResponse.json(
    { ...summary, monthKey: formatProjectionMonthKey(monthStart) },
    { headers },
  );
}
