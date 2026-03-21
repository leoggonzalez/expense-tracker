import { NextResponse } from "next/server";

import { getCurrentUserAccountProfilePayloadForUser } from "@/actions/user_account";
import { getCurrentUserAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const currentUser = await getCurrentUserAccount();

  if (!currentUser) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const payload = await getCurrentUserAccountProfilePayloadForUser(
    currentUser.id,
  );

  if (!payload) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
