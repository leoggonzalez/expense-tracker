import { getDashboardPayload } from "@/actions/transactions";
import {
  AppLink,
  Container,
  Hero,
  HeroMetric,
  HeroMetrics,
  TransactionList,
  type TransactionListItem,
} from "@/components";
import { Card, Grid, Stack, Text } from "@/elements";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

function formatPaymentDate(beginDate: string): string {
  return format(new Date(beginDate), "MMM d");
}

export default async function HomePage(): Promise<React.ReactElement> {
  const dashboardPayload = await getDashboardPayload();
  const currentMonthQuery = `start_date=${dashboardPayload.currentMonthRange.startDate}&end_date=${dashboardPayload.currentMonthRange.endDate}`;

  const upcomingPayments =
    dashboardPayload.upcomingPayments as TransactionListItem[];
  const recentTransactions =
    dashboardPayload.recentTransactions as TransactionListItem[];

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="dashboard"
          title={String(i18n.t("dashboard.hero_label"))}
          pattern="dashboard"
          actions={[
            {
              icon: "plus",
              title: String(i18n.t("dashboard.hero_add_action")),
              ariaLabel: String(i18n.t("dashboard.hero_add_action")),
              href: "/transactions/new/expense",
              variant: "primary",
            },
          ]}
        >
          <Stack gap={24}>
            <Stack gap={10}>
              <Text
                as="h1"
                size="h1"
                color="hero"
                weight="bold"
                tracking="tight"
              >
                {formatCurrency(dashboardPayload.totals.net)}
              </Text>
              <Text as="p" size="sm" color="hero-muted">
                {i18n.t("dashboard.hero_caption")}
              </Text>
            </Stack>

            <HeroMetrics columns={2}>
              <AppLink href={`/transactions?${currentMonthQuery}&type=income`}>
                <HeroMetric>
                  <>
                    <Text as="span" size="xs" color="hero" weight="medium">
                      {i18n.t("dashboard.income")}
                    </Text>
                    <Text as="span" size="lg" color="hero" weight="semibold">
                      {formatCurrency(dashboardPayload.totals.income)}
                    </Text>
                  </>
                </HeroMetric>
              </AppLink>

              <AppLink href={`/transactions?${currentMonthQuery}&type=expense`}>
                <HeroMetric tone="soft">
                  <>
                    <Text as="span" size="xs" color="hero" weight="medium">
                      {i18n.t("dashboard.expenses")}
                    </Text>
                    <Text as="span" size="lg" color="hero" weight="semibold">
                      {formatCurrency(
                        Math.abs(dashboardPayload.totals.expense),
                      )}
                    </Text>
                  </>
                </HeroMetric>
              </AppLink>
            </HeroMetrics>
          </Stack>
        </Hero>

        <Grid minColumnWidth={360} gap={24}>
          <Card
            as="section"
            padding={24}
            title={String(i18n.t("dashboard.upcoming_payments"))}
            icon="calendar"
            fullHeight
          >
            <Stack gap={20}>
              <Text as="div" size="sm" weight="medium">
                <AppLink
                  href={`/transactions?${currentMonthQuery}&type=expense`}
                >
                  {i18n.t("dashboard.upcoming_payments_link")}
                </AppLink>
              </Text>

              {upcomingPayments.length === 0 ? (
                <Card variant="secondary" radius={24} padding={20}>
                  <Text color="secondary">
                    {i18n.t("dashboard.upcoming_payments_empty")}
                  </Text>
                </Card>
              ) : (
                <Stack gap={14}>
                  {upcomingPayments.map((transaction) => (
                    <AppLink
                      key={transaction.id}
                      href={`/transactions/${transaction.id}`}
                      ariaLabel={transaction.description}
                    >
                      <Card
                        variant="secondary"
                        radius={24}
                        padding={{
                          paddingTop: 16,
                          paddingRight: 18,
                          paddingBottom: 16,
                          paddingLeft: 18,
                        }}
                      >
                        <Stack
                          direction="row"
                          align="center"
                          justify="space-between"
                          gap={16}
                          fullWidth
                        >
                          <Stack gap={4} align="flex-start">
                            <Text as="span" size="sm" weight="semibold">
                              {transaction.description}
                            </Text>
                            <Text as="span" size="xs" color="secondary">
                              {transaction.spaceName}
                            </Text>
                          </Stack>
                          <Stack gap={4} align="flex-end">
                            <Text as="span" size="sm" weight="semibold">
                              {formatCurrency(Math.abs(transaction.amount))}
                            </Text>
                            <Text as="span" size="xs" color="secondary">
                              {i18n.t("dashboard.payment_due", {
                                date: formatPaymentDate(transaction.beginDate),
                              })}
                            </Text>
                          </Stack>
                        </Stack>
                      </Card>
                    </AppLink>
                  ))}
                </Stack>
              )}
            </Stack>
          </Card>

          <Card
            as="section"
            padding={24}
            title={String(i18n.t("dashboard.recent_transactions"))}
            icon="activity"
            fullHeight
          >
            <Stack gap={20}>
              <Text size="sm" color="secondary">
                {i18n.t("dashboard.activity_subtitle")}
              </Text>
              <Text as="div" size="sm" weight="medium">
                <AppLink href={`/transactions?${currentMonthQuery}`}>
                  {i18n.t("dashboard.recent_activity_link")}
                </AppLink>
              </Text>
              <TransactionList
                transactions={recentTransactions}
                showDelete={false}
                transactionHrefBase="/transactions"
              />
            </Stack>
          </Card>
        </Grid>
      </Stack>
    </Container>
  );
}
