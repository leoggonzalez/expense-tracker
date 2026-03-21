import { NextResponse } from "next/server";

import { getSpaceEditPayloadForUser } from "@/actions/spaces";
import { getCurrentUserAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

type SpaceEditRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: SpaceEditRouteProps,
): Promise<NextResponse> {
  const currentUser = await getCurrentUserAccount();

  if (!currentUser) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id } = await params;
  const payload = await getSpaceEditPayloadForUser(currentUser.id, id);

  if (!payload) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
