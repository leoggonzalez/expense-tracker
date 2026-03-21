import { NextResponse } from "next/server";

import { getTransactionDetailPayloadForUser } from "@/actions/transactions";
import { getCurrentUserAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

type TransactionDetailRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: TransactionDetailRouteProps,
): Promise<NextResponse> {
  const currentUser = await getCurrentUserAccount();

  if (!currentUser) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id } = await params;
  const payload = await getTransactionDetailPayloadForUser(currentUser.id, id);

  if (!payload) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
