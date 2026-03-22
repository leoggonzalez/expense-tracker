"use client";

import type { SpacesPagePayload } from "@/actions/spaces";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import {
  AppLink,
  Button,
  Container,
  Hero,
  HeroMetric,
  HeroMetrics,
  LoadingSkeleton,
  SpaceCard,
} from "@/components";
import { Card, Icon, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

const spacesPageCache = {
  entries: new Map<string, SpacesPagePayload>(),
};

type SpacesPageSectionProps = {
  currentMonthKey: string;
  currentMonthLabel: string;
  previousMonthKey: string;
  nextMonthKey: string;
};

function SpacesHeroMetricsSkeleton({
  currentMonthLabel,
  previousMonthKey,
  nextMonthKey,
}: Omit<SpacesPageSectionProps, "currentMonthKey">): React.ReactElement {
  return (
    <HeroMetrics columns={2}>
      <HeroMetric tone="soft">
        <Stack gap={16}>
          <Text size="sm" color="hero">
            {i18n.t("spaces_page.month_total_overview")}
          </Text>
          <Stack
            direction="row"
            align="center"
            justify="space-between"
            gap={12}
          >
            <Button
              href={`/spaces?currentMonth=${previousMonthKey}`}
              variant="outline"
              ariaLabel={String(i18n.t("pagination.previous"))}
            >
              <Icon name="chevron-left" size={18} />
            </Button>
            <Text size="lg" weight="semibold" color="hero">
              {currentMonthLabel}
            </Text>
            <Button
              href={`/spaces?currentMonth=${nextMonthKey}`}
              variant="outline"
              ariaLabel={String(i18n.t("pagination.next"))}
            >
              <Icon name="chevron-right" size={18} />
            </Button>
          </Stack>
        </Stack>
      </HeroMetric>
      <HeroMetric>
        <Text size="sm" color="hero">
          {i18n.t("spaces_page.active_spaces_label")}
        </Text>
        <LoadingSkeleton width="64px" height={38} radius={14} />
      </HeroMetric>
    </HeroMetrics>
  );
}

function SpacesPageListSkeleton(): React.ReactElement {
  return (
    <Stack gap={24}>
      <LoadingSkeleton width="100%" height={138} radius={28} />
      <LoadingSkeleton width="100%" height={138} radius={28} />
      <LoadingSkeleton width="140px" height={18} radius={10} />
    </Stack>
  );
}

export function SpacesPageSection({
  currentMonthKey,
  currentMonthLabel,
  previousMonthKey,
  nextMonthKey,
}: SpacesPageSectionProps): React.ReactElement {
  const endpoint = `/api/spaces/summary?currentMonth=${currentMonthKey}`;
  const { data, isLoading, hasError, retry } = useProtectedPageSection(
    endpoint,
    endpoint,
    spacesPageCache,
  );

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="spaces"
          title={String(i18n.t("spaces_page.title"))}
          pattern="spaces"
          actions={[
            {
              icon: "plus",
              title: String(i18n.t("spaces_page.new_space")),
              ariaLabel: String(i18n.t("spaces_page.create_space")),
              href: "/spaces/new",
              variant: "primary",
            },
          ]}
        >
          <Stack gap={24}>
            <Text as="p" size="sm" color="hero-muted">
              {i18n.t("spaces_page.hero_subtitle")}
            </Text>

            {data ? (
              <HeroMetrics columns={2}>
                <HeroMetric tone="soft">
                  <Stack gap={16}>
                    <Text size="sm" color="hero">
                      {i18n.t("spaces_page.month_total_overview")}
                    </Text>
                    <Stack
                      direction="row"
                      align="center"
                      justify="space-between"
                      gap={12}
                    >
                      <Button
                        href={`/spaces?currentMonth=${previousMonthKey}`}
                        variant="outline"
                        ariaLabel={String(i18n.t("pagination.previous"))}
                      >
                        <Icon name="chevron-left" size={18} />
                      </Button>
                      <Text size="lg" weight="semibold" color="hero">
                        {currentMonthLabel}
                      </Text>
                      <Button
                        href={`/spaces?currentMonth=${nextMonthKey}`}
                        variant="outline"
                        ariaLabel={String(i18n.t("pagination.next"))}
                      >
                        <Icon name="chevron-right" size={18} />
                      </Button>
                    </Stack>
                  </Stack>
                </HeroMetric>
                <HeroMetric>
                  <Text size="sm" color="hero">
                    {i18n.t("spaces_page.active_spaces_label")}
                  </Text>
                  <Text size="h3" weight="bold" color="hero">
                    {String(data.spaces.length)}
                  </Text>
                </HeroMetric>
              </HeroMetrics>
            ) : (
              <SpacesHeroMetricsSkeleton
                currentMonthLabel={currentMonthLabel}
                previousMonthKey={previousMonthKey}
                nextMonthKey={nextMonthKey}
              />
            )}
          </Stack>
        </Hero>

        {hasError && !data ? (
          <Card padding={24}>
            <Stack gap={12} align="flex-start">
              <Text color="secondary">
                {i18n.t("spaces_page.summary_load_failed")}
              </Text>
              <Button variant="secondary" size="sm" onClick={retry}>
                {i18n.t("common.retry")}
              </Button>
            </Stack>
          </Card>
        ) : isLoading && !data ? (
          <SpacesPageListSkeleton />
        ) : data && data.spaces.length === 0 ? (
          <Card padding={24} variant="dashed">
            <Text color="secondary">{i18n.t("spaces_page.empty_state")}</Text>
          </Card>
        ) : (
          <Stack gap={24}>
            {(data?.spaces || []).map((space) => (
              <SpaceCard
                key={space.id}
                id={space.id}
                name={space.name}
                currentMonthTotal={space.currentMonthTotal}
                monthLabel={currentMonthLabel}
              />
            ))}
          </Stack>
        )}

        <AppLink href="/spaces/archived">
          {i18n.t("spaces_page.archived_spaces")}
        </AppLink>
      </Stack>
    </Container>
  );
}
