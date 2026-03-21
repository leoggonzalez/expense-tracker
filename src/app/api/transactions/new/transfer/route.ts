import { NextResponse } from "next/server";

import { getNewTransferSpacesPayloadForUser } from "@/actions/transactions";
import { getCurrentUserAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const currentUser = await getCurrentUserAccount();

  if (!currentUser) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const payload = await getNewTransferSpacesPayloadForUser(currentUser.id);

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
