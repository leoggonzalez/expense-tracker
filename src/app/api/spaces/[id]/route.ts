import { NextResponse } from "next/server";

import { getSpaceDetailPayloadForUser } from "@/actions/spaces";
import { parseSpacesMonth } from "@/lib/spaces_month";
import { getCurrentUserAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

type SpaceDetailRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: SpaceDetailRouteProps,
): Promise<NextResponse> {
  const currentUser = await getCurrentUserAccount();

  if (!currentUser) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const payload = await getSpaceDetailPayloadForUser(currentUser.id, {
    spaceId: id,
    page: Math.max(1, Number(searchParams.get("page") || "1") || 1),
    limit: 10,
    selectedMonthStart: parseSpacesMonth(
      searchParams.get("currentMonth") || undefined,
    ),
  });

  if (!payload) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
