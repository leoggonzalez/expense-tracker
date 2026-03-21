"use client";

import type { ProjectionChartPayload } from "@/actions/transactions";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import { Button, LoadingSkeleton, ProjectionChart } from "@/components";
import { Card, Stack, Text } from "@/elements";
import { formatProjectionMonthLabel } from "@/lib/projection_month";
import { i18n } from "@/model/i18n";

const projectionChartCache = {
  entries: new Map<string, ProjectionChartPayload>(),
};

type ProjectionChartSectionProps = {
  monthKey: string;
};

function ProjectionChartSkeleton(): React.ReactElement {
  return <LoadingSkeleton width="100%" height={320} radius={24} />;
}

export function ProjectionChartSection({
  monthKey,
}: ProjectionChartSectionProps): React.ReactElement {
  const endpoint = `/api/projection/chart?month=${monthKey}`;
  const { data, isLoading, hasError, retry } = useProtectedPageSection(
    endpoint,
    endpoint,
    projectionChartCache,
  );
  const locale = i18n.locale || "en";
  const chartData =
    data?.chartMonths.map((month) => ({
      monthLabel: formatProjectionMonthLabel(month.monthKey, locale, {
        month: "short",
        year: "numeric",
      }),
      income: month.income,
      expenses: Math.abs(month.expense),
    })) || [];

  return (
    <Card
      as="section"
      padding={24}
      title={String(i18n.t("projection_page.chart_title"))}
      icon="projection"
    >
      {hasError && !data ? (
        <Stack gap={12} align="flex-start">
          <Text color="secondary">{i18n.t("projection_page.chart_load_failed")}</Text>
          <Button variant="secondary" size="sm" onClick={retry}>
            {i18n.t("common.retry")}
          </Button>
        </Stack>
      ) : isLoading && !data ? (
        <ProjectionChartSkeleton />
      ) : (
        <ProjectionChart data={chartData} />
      )}
    </Card>
  );
}
