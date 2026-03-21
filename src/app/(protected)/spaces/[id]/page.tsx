import { SpaceDetailSection } from "@/app/(protected)/spaces/[id]/space_detail_section";
import {
  formatSpacesMonthKey,
  formatSpacesMonthLabel,
  getAdjacentSpacesMonthKey,
  parseSpacesMonth,
} from "@/lib/spaces_month";
import { i18n } from "@/model/i18n";

type SpaceRouteProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
    currentMonth?: string;
    confirmArchive?: string;
    confirmUnarchive?: string;
  }>;
};

export default async function Page({
  params,
  searchParams,
}: SpaceRouteProps): Promise<React.ReactElement> {
  const { id } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number(query.page || "1") || 1);
  const selectedMonthStart = parseSpacesMonth(query.currentMonth);
  const selectedMonthKey = formatSpacesMonthKey(selectedMonthStart);
  const selectedMonthLabel = formatSpacesMonthLabel(
    selectedMonthStart,
    i18n.locale || "en",
  );
  const previousMonthKey = getAdjacentSpacesMonthKey(selectedMonthKey, -1);
  const nextMonthKey = getAdjacentSpacesMonthKey(selectedMonthKey, 1);

  return (
    <SpaceDetailSection
      id={id}
      currentMonthKey={selectedMonthKey}
      currentMonthLabel={selectedMonthLabel}
      previousMonthKey={previousMonthKey}
      nextMonthKey={nextMonthKey}
      page={page}
      isArchiveDialogOpen={query.confirmArchive === "1"}
      isUnarchiveDialogOpen={query.confirmUnarchive === "1"}
    />
  );
}
