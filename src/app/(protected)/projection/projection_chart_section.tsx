"use client";

import { SectionError } from "@/components/section_error/section_error";

import type { ProjectionChartPayload } from "@/actions/transactions";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import { LoadingSkeleton, ProjectionChart } from "@/components";
import { Card } from "@/elements";
import { formatProjectionMonthLabel } from "@/lib/projection_month";
import { i18n } from "@/model/i18n";

const projectionChartCache = {
  entries: new Map<string, ProjectionChartPayload>(),
};

interface ProjectionChartSectionProps {
  monthKey: string;
}

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
      total: month.net,
    })) || [];

  return (
    <Card
      as="section"
      padding={24}
      title={String(i18n.t("projection_page.chart_title"))}
      icon="projection"
    >
      {hasError && !data ? (
        <SectionError
          message={i18n.t("projection_page.chart_load_failed")}
          retryLabel={i18n.t("common.retry")}
          onRetry={retry}
        />
      ) : isLoading && !data ? (
        <ProjectionChartSkeleton />
      ) : (
        <ProjectionChart data={chartData} />
      )}
    </Card>
  );
}
