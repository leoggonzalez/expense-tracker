import { NextResponse } from "next/server";

import { getSpaceDetailPayloadForUser } from "@/actions/spaces";
import { getCurrentUserAccount } from "@/lib/session";
import { createSpaceMonthPdf } from "@/lib/space_month_pdf";
import { parseSpacesMonth } from "@/lib/spaces_month";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface SpaceExportRouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: Request,
  { params }: SpaceExportRouteProps,
): Promise<NextResponse> {
  const headers = { "Cache-Control": "private, no-store, max-age=0" };
  const user = await getCurrentUserAccount();
  if (!user) return NextResponse.json({ ok: false }, { status: 401, headers });
  const { id } = await params;
  const report = await getSpaceDetailPayloadForUser(user.id, {
    spaceId: id,
    page: 1,
    limit: 1,
    selectedMonthStart: parseSpacesMonth(
      new URL(request.url).searchParams.get("currentMonth") || undefined,
    ),
  });
  if (!report)
    return NextResponse.json({ ok: false }, { status: 404, headers });
  const pdf = await createSpaceMonthPdf(report);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      ...headers,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="currento-${report.selectedMonth.key}.pdf"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
