import { NextResponse } from "next/server";

import { CategoryMatch } from "@/lib/category_match";
import { CATEGORY_NORMALIZATION_VERSION } from "@/lib/category_matching";
import { getCurrentUserAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const currentUser = await getCurrentUserAccount();
  if (!currentUser) return NextResponse.json({ ok: false }, { status: 401 });

  const payload = await CategoryMatch.listForUser(currentUser.id);
  return NextResponse.json(
    {
      ownerId: currentUser.id,
      ...payload,
      normalizationVersion: CATEGORY_NORMALIZATION_VERSION,
    },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
