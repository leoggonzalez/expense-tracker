"use client";

import type { ProjectionHeaderPayload } from "@/actions/transactions";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import {
  Button,
  Hero,
  HeroMetric,
  HeroMetrics,
  LoadingSkeleton,
} from "@/components";
import { Stack, Text } from "@/elements";
import { formatCurrency } from "@/lib/utils";
import { i18n } from "@/model/i18n";

const projectionHeaderCache = {
  entries: new Map<string, ProjectionHeaderPayload>(),
};

type ProjectionHeaderProps = {
  focusedMonthLabel: string;
  monthKey: string;
  previousMonthKey: string;
  nextMonthKey: string;
};

export function ProjectionHeader({
  focusedMonthLabel,
  monthKey,
  previousMonthKey,
  nextMonthKey,
}: ProjectionHeaderProps): React.ReactElement {
  const endpoint = `/api/projection/header?month=${monthKey}`;
  const { data, hasError, retry } = useProtectedPageSection(
    endpoint,
    endpoint,
    projectionHeaderCache,
  );

  return (
    <Hero
      icon="projection"
      title={focusedMonthLabel}
      pattern="projection"
      actions={[
        {
          icon: "chevron-left",
          ariaLabel: String(i18n.t("pagination.previous")),
          href: `/projection?month=${previousMonthKey}`,
          variant: "outline",
        },
        {
          icon: "chevron-right",
          ariaLabel: String(i18n.t("pagination.next")),
          href: `/projection?month=${nextMonthKey}`,
          variant: "outline",
        },
      ]}
    >
      <Stack gap={24}>
        <Stack gap={10}>
          {data ? (
            <Text as="h1" size="h1" color="hero" weight="bold">
              {formatCurrency(data.focusedMonthTotals.net)}
            </Text>
          ) : (
            <LoadingSkeleton width="240px" height={58} radius={18} />
          )}

          <Text as="p" size="sm" color="hero-muted">
            {i18n.t("projection_page.subtitle")}
          </Text>
        </Stack>

        {hasError && !data ? (
          <Stack gap={12} align="flex-start">
            <Text size="sm" color="hero-muted">
              {i18n.t("projection_page.header_load_failed")}
            </Text>
            <Button variant="outline" size="sm" onClick={retry}>
              {i18n.t("common.retry")}
            </Button>
          </Stack>
        ) : (
          <HeroMetrics columns={2}>
            <HeroMetric>
              <>
                <Text as="span" size="xs" color="hero" weight="medium">
                  {i18n.t("projection_page.income")}
                </Text>
                {data ? (
                  <Text as="span" size="lg" color="hero" weight="semibold">
                    {formatCurrency(data.focusedMonthTotals.income)}
                  </Text>
                ) : (
                  <LoadingSkeleton width="140px" height={28} radius={12} />
                )}
              </>
            </HeroMetric>
            <HeroMetric tone="soft">
              <>
                <Text as="span" size="xs" color="hero" weight="medium">
                  {i18n.t("projection_page.expenses")}
                </Text>
                {data ? (
                  <Text as="span" size="lg" color="hero" weight="semibold">
                    {formatCurrency(Math.abs(data.focusedMonthTotals.expense))}
                  </Text>
                ) : (
                  <LoadingSkeleton width="140px" height={28} radius={12} />
                )}
              </>
            </HeroMetric>
          </HeroMetrics>
        )}
      </Stack>
    </Hero>
  );
}
