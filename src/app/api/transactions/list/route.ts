import { NextResponse } from "next/server";

import { getTransactionsPagePayloadForUser } from "@/actions/transactions";
import {
  normalizeTransactionsFiltersFromUrlSearchParams,
  toTransactionFiltersInput,
} from "@/lib/transactions_search";
import { getCurrentUserAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const currentUser = await getCurrentUserAccount();

  if (!currentUser) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filters = normalizeTransactionsFiltersFromUrlSearchParams(searchParams);
  const payload = await getTransactionsPagePayloadForUser(
    currentUser.id,
    toTransactionFiltersInput(filters),
  );

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
