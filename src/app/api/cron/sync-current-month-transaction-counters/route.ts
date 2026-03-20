import { NextRequest, NextResponse } from "next/server";

import { syncAllCurrentMonthTransactionCounters } from "@/actions/transactions";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const authorizationHeader = request.headers.get("authorization");
  return authorizationHeader === `Bearer ${secret}`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await syncAllCurrentMonthTransactionCounters();

  return NextResponse.json({ ok: true });
}
