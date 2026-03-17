import {
  AppLink,
  Container,
  Currency,
  EntryList,
  Hero,
  HeroActionLink,
  HeroMetric,
  HeroMetrics,
  ProjectionChart,
} from "@/components";
import { Card, Icon, Stack, Text } from "@/elements";

import { formatCurrency } from "@/lib/utils";
import { getProjectionPagePayload } from "@/actions/entries";
import { i18n } from "@/model/i18n";
import { startOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

type ProjectionPageProps = {
  searchParams: Promise<{
    month?: string;
  }>;
};

function getFocusedMonth(month: string | undefined): Date {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return startOfMonth(new Date());
  }

  const parsed = new Date(`${month}-01T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return startOfMonth(new Date());
  }

  return startOfMonth(parsed);
}

function formatMonthKey(
  monthKey: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const locale = i18n.locale || "en";
  const date = new Date(`${monthKey}-01T00:00:00`);

  return new Intl.DateTimeFormat(locale, options).format(date);
}

export default async function ProjectionPage({
  searchParams,
}: ProjectionPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const focusedMonth = getFocusedMonth(params.month);
  const payload = await getProjectionPagePayload(focusedMonth);
  const focusedMonthLabel = formatMonthKey(payload.focusedMonth.key, {
    month: "long",
    year: "numeric",
  });
  const chartData = payload.chartMonths.map((month) => ({
    monthLabel: formatMonthKey(month.monthKey, {
      month: "short",
      year: "numeric",
    }),
    income: month.income,
    expenses: Math.abs(month.expense),
  }));

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="projection"
          title={focusedMonthLabel}
          pattern="projection"
          actions={
            <>
              <HeroActionLink
                href={`/projection?month=${payload.previousMonthKey}`}
              >
                <Icon name="chevron-left" size={18} />
              </HeroActionLink>
              <HeroActionLink
                href={`/projection?month=${payload.nextMonthKey}`}
              >
                <Icon name="chevron-right" size={18} />
              </HeroActionLink>
            </>
          }
        >
          <Stack gap={24}>
            <Stack gap={10}>
              <Text as="h1" size="h1" color="inverse" weight="bold">
                {formatCurrency(payload.focusedMonthTotals.net)}
              </Text>
              <Text as="p" size="sm" color="inverse">
                {i18n.t("projection_page.subtitle")}
              </Text>
            </Stack>

            <HeroMetrics columns={2}>
              <HeroMetric>
                <Text as="span" size="xs" color="inverse" weight="medium">
                  {i18n.t("projection_page.income")}
                </Text>
                <Text as="span" size="lg" color="inverse" weight="semibold">
                  {formatCurrency(payload.focusedMonthTotals.income)}
                </Text>
              </HeroMetric>
              <HeroMetric tone="soft">
                <Text as="span" size="xs" color="inverse" weight="medium">
                  {i18n.t("projection_page.expenses")}
                </Text>
                <Text as="span" size="lg" color="inverse" weight="semibold">
                  {formatCurrency(Math.abs(payload.focusedMonthTotals.expense))}
                </Text>
              </HeroMetric>
            </HeroMetrics>
          </Stack>
        </Hero>

        <Stack gap={24}>
          <Card
            as="section"
            padding={24}
            title={String(i18n.t("projection_page.chart_title"))}
            icon="projection"
          >
            <ProjectionChart data={chartData} />
          </Card>

          <Stack gap={16}>
            <Text size="h4" as="h3" weight="semibold">
              {i18n.t("projection_page.accounts_with_entries")}
            </Text>

            {payload.focusedMonthAccounts.length === 0 ? (
              <Card padding={24} variant="dashed">
                <Text color="secondary">
                  {i18n.t("projection_page.empty_month_entries")}
                </Text>
              </Card>
            ) : (
              <Stack gap={24}>
                {payload.focusedMonthAccounts.map((account) => {
                  const hiddenEntriesCount = Math.max(
                    0,
                    account.monthEntryCount - account.entries.length,
                  );
                  const accountMonthHref = `/accounts/${account.accountId}?currentMonth=${payload.focusedMonth.key}`;

                  return (
                    <Card
                      key={account.accountId}
                      as="section"
                      padding={24}
                      title={account.accountName}
                      icon="accounts"
                    >
                      <Stack gap={20}>
                        <Stack
                          direction="column"
                          desktopDirection="row"
                          justify="space-between"
                          align="flex-start"
                          gap={12}
                        >
                          <AppLink href={accountMonthHref}>
                            {i18n.t("projection_page.open_account")}
                          </AppLink>
                          <Currency
                            value={account.monthTotal}
                            size="xl"
                            weight="bold"
                            as="span"
                          />
                        </Stack>

                        <EntryList
                          entries={account.entries}
                          showDelete={false}
                          entryHrefBase="/entries"
                          summaryRows={[
                            ...(hiddenEntriesCount > 0
                              ? [
                                  {
                                    id: `more-${account.accountId}`,
                                    label: i18n.t(
                                      "projection_page.more_entries_this_month",
                                      {
                                        count: hiddenEntriesCount,
                                      },
                                    ) as string,
                                    href: accountMonthHref,
                                  },
                                ]
                              : []),
                            {
                              id: `total-${account.accountId}`,
                              label: i18n.t(
                                "projection_page.account_month_total",
                              ) as string,
                              value: (
                                <Currency
                                  value={account.monthTotal}
                                  size="sm"
                                  weight="bold"
                                />
                              ),
                              tone: "emphasis",
                            },
                          ]}
                        />
                      </Stack>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}
