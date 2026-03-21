import { Container } from "@/components";
import { ProjectionChartSection } from "@/app/(protected)/projection/projection_chart_section";
import { ProjectionHeader } from "@/app/(protected)/projection/projection_header";
import { ProjectionSpaces } from "@/app/(protected)/projection/projection_spaces";
import { Stack } from "@/elements";

import {
  formatProjectionMonthLabel,
  formatProjectionMonthKey,
  getAdjacentProjectionMonthKey,
  parseProjectionMonth,
} from "@/lib/projection_month";
import { i18n } from "@/model/i18n";

type ProjectionPageProps = {
  searchParams: Promise<{
    month?: string;
  }>;
};

export default async function ProjectionPage({
  searchParams,
}: ProjectionPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const focusedMonthKey = formatProjectionMonthKey(
    parseProjectionMonth(params.month),
  );
  const focusedMonthLabel = formatProjectionMonthLabel(
    focusedMonthKey,
    i18n.locale || "en",
    {
      month: "long",
      year: "numeric",
    },
  );
  const previousMonthKey = getAdjacentProjectionMonthKey(focusedMonthKey, -1);
  const nextMonthKey = getAdjacentProjectionMonthKey(focusedMonthKey, 1);

  return (
    <Container>
      <Stack gap={24}>
        <ProjectionHeader
          focusedMonthLabel={focusedMonthLabel}
          monthKey={focusedMonthKey}
          previousMonthKey={previousMonthKey}
          nextMonthKey={nextMonthKey}
        />

        <Stack gap={24}>
          <ProjectionChartSection monthKey={focusedMonthKey} />
          <ProjectionSpaces monthKey={focusedMonthKey} />
        </Stack>
      </Stack>
    </Container>
  );
}
