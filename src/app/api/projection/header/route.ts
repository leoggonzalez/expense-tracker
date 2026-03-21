import { NextResponse } from "next/server";

import { getProjectionHeaderPayloadForUser } from "@/actions/transactions";
import { parseProjectionMonth } from "@/lib/projection_month";
import { getCurrentUserAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const currentUser = await getCurrentUserAccount();

  if (!currentUser) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const payload = await getProjectionHeaderPayloadForUser(
    currentUser.id,
    parseProjectionMonth(searchParams.get("month") || undefined),
  );

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
