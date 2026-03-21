import { SpacesPageSection } from "@/app/(protected)/spaces/spaces_page_section";
import {
  formatSpacesMonthKey,
  formatSpacesMonthLabel,
  getAdjacentSpacesMonthKey,
  parseSpacesMonth,
} from "@/lib/spaces_month";
import { i18n } from "@/model/i18n";

type SpacesRouteProps = {
  searchParams: Promise<{
    currentMonth?: string;
  }>;
};

export default async function Page({
  searchParams,
}: SpacesRouteProps): Promise<React.ReactElement> {
  const query = await searchParams;
  const selectedMonthStart = parseSpacesMonth(query.currentMonth);
  const selectedMonthKey = formatSpacesMonthKey(selectedMonthStart);
  const selectedMonthLabel = formatSpacesMonthLabel(
    selectedMonthStart,
    i18n.locale || "en",
  );
  const previousMonthKey = getAdjacentSpacesMonthKey(selectedMonthKey, -1);
  const nextMonthKey = getAdjacentSpacesMonthKey(selectedMonthKey, 1);

  return (
    <SpacesPageSection
      currentMonthKey={selectedMonthKey}
      currentMonthLabel={selectedMonthLabel}
      previousMonthKey={previousMonthKey}
      nextMonthKey={nextMonthKey}
    />
  );
}
