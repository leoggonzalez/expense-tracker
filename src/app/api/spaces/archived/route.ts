import { NextResponse } from "next/server";

import { getArchivedSpacesPayloadForUser } from "@/actions/spaces";
import { parseSpacesMonth } from "@/lib/spaces_month";
import { getCurrentUserAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const currentUser = await getCurrentUserAccount();

  if (!currentUser) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const payload = await getArchivedSpacesPayloadForUser(
    currentUser.id,
    parseSpacesMonth(searchParams.get("currentMonth") || undefined),
  );

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
