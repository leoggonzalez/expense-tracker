import {
  Button,
  Container,
  Currency,
  TransactionList,
  Hero,
  HeroMetric,
  HeroMetrics,
  ProjectionChart,
} from "@/components";
import { Card, Icon, Stack, Text } from "@/elements";

import { formatCurrency } from "@/lib/utils";
import { getProjectionPagePayload } from "@/actions/transactions";
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
          actions={[
            {
              icon: "chevron-left",
              ariaLabel: String(i18n.t("pagination.previous")),
              href: `/projection?month=${payload.previousMonthKey}`,
              variant: "outline",
            },
            {
              icon: "chevron-right",
              ariaLabel: String(i18n.t("pagination.next")),
              href: `/projection?month=${payload.nextMonthKey}`,
              variant: "outline",
            },
          ]}
        >
          <Stack gap={24}>
            <Stack gap={10}>
              <Text as="h1" size="h1" color="hero" weight="bold">
                {formatCurrency(payload.focusedMonthTotals.net)}
              </Text>
              <Text as="p" size="sm" color="hero-muted">
                {i18n.t("projection_page.subtitle")}
              </Text>
            </Stack>

            <HeroMetrics columns={2}>
              <HeroMetric>
                <Text as="span" size="xs" color="hero" weight="medium">
                  {i18n.t("projection_page.income")}
                </Text>
                <Text as="span" size="lg" color="hero" weight="semibold">
                  {formatCurrency(payload.focusedMonthTotals.income)}
                </Text>
              </HeroMetric>
              <HeroMetric tone="soft">
                <Text as="span" size="xs" color="hero" weight="medium">
                  {i18n.t("projection_page.expenses")}
                </Text>
                <Text as="span" size="lg" color="hero" weight="semibold">
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
              {i18n.t("projection_page.spaces_with_transactions")}
            </Text>

            {payload.focusedMonthSpaces.length === 0 ? (
              <Card padding={24} variant="dashed">
                <Text color="secondary">
                  {i18n.t("projection_page.empty_month_transactions")}
                </Text>
              </Card>
            ) : (
              <Stack gap={24}>
                {payload.focusedMonthSpaces.map((space) => {
                  const hiddenTransactionsCount = Math.max(
                    0,
                    space.monthTransactionCount - space.transactions.length,
                  );
                  const spaceMonthHref = `/spaces/${space.spaceId}?currentMonth=${payload.focusedMonth.key}`;

                  return (
                    <Card
                      key={space.spaceId}
                      as="section"
                      padding={24}
                      title={space.spaceName}
                      icon="spaces"
                      actions={
                        <Button
                          href={spaceMonthHref}
                          variant="secondary"
                          size="sm"
                          startIcon={<Icon name="external-link" size={16} />}
                          ariaLabel={String(
                            i18n.t("projection_page.open_space"),
                          )}
                        >
                          {null}
                        </Button>
                      }
                    >
                      <TransactionList
                        transactions={space.transactions}
                        showDelete={false}
                        transactionHrefBase="/transactions"
                        summaryRows={[
                          ...(hiddenTransactionsCount > 0
                            ? [
                                {
                                  id: `more-${space.spaceId}`,
                                  label: i18n.t(
                                    "projection_page.more_transactions_this_month",
                                    {
                                      count: hiddenTransactionsCount,
                                    },
                                  ) as string,
                                  href: spaceMonthHref,
                                },
                              ]
                            : []),
                          {
                            id: `total-${space.spaceId}`,
                            label: i18n.t(
                              "projection_page.space_month_total",
                            ) as string,
                            value: (
                              <Currency
                                value={space.monthTotal}
                                size="sm"
                                weight="bold"
                              />
                            ),
                            tone: "emphasis",
                          },
                        ]}
                      />
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
