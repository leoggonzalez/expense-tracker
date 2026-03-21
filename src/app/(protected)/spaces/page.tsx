import {
  SpaceCard,
  AppLink,
  Button,
  Container,
  Hero,
  HeroMetric,
  HeroMetrics,
} from "@/components";
import { Card, Icon, Stack, Text } from "@/elements";
import { addMonths, format } from "date-fns";

import { getSpacesCurrentMonthSummary } from "@/actions/spaces";
import { i18n } from "@/model/i18n";
import { startOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

type SpacesRouteProps = {
  searchParams: Promise<{
    currentMonth?: string;
  }>;
};

function parseCurrentMonthOrNow(currentMonth: string | undefined): Date {
  if (!currentMonth || !/^\d{4}-\d{2}$/.test(currentMonth)) {
    return startOfMonth(new Date());
  }

  const parsed = new Date(`${currentMonth}-01T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return startOfMonth(new Date());
  }

  return startOfMonth(parsed);
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat(i18n.locale || "en", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatMonthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

export default async function Page({
  searchParams,
}: SpacesRouteProps): Promise<React.ReactElement> {
  const query = await searchParams;
  const selectedMonthStart = parseCurrentMonthOrNow(query.currentMonth);
  const spaces = await getSpacesCurrentMonthSummary(selectedMonthStart);
  const selectedMonthLabel = formatMonthLabel(selectedMonthStart);
  const previousMonthKey = formatMonthKey(addMonths(selectedMonthStart, -1));
  const nextMonthKey = formatMonthKey(addMonths(selectedMonthStart, 1));

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
                      {selectedMonthLabel}
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
                  {String(spaces.length)}
                </Text>
              </HeroMetric>
            </HeroMetrics>
          </Stack>
        </Hero>

        {spaces.length === 0 ? (
          <Card padding={24} variant="dashed">
            <Text color="secondary">{i18n.t("spaces_page.empty_state")}</Text>
          </Card>
        ) : (
          <Stack gap={24}>
            {spaces.map((space) => (
              <SpaceCard
                key={space.id}
                id={space.id}
                name={space.name}
                currentMonthTotal={space.currentMonthTotal}
                monthLabel={selectedMonthLabel}
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
