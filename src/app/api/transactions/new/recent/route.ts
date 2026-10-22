import { NextResponse } from "next/server";

import { getNewTransactionRecentPayloadForUser } from "@/actions/transactions";
import { getCurrentUserAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const currentUser = await getCurrentUserAccount();

  if (!currentUser) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const spaceId =
    new URL(request.url).searchParams.get("space_id") || undefined;
  const payload = await getNewTransactionRecentPayloadForUser(
    currentUser.id,
    spaceId,
  );

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
