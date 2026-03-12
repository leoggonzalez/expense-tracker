import {
  AppLink,
  Container,
  Currency,
  EntryList,
  ProjectionChart,
} from "@/components";
import { Card, Grid, Icon, Stack, Text } from "@/elements";
import { format, startOfMonth } from "date-fns";

import { getProjectionPagePayload } from "@/actions/entries";
import { i18n } from "@/model/i18n";

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

export default async function ProjectionPage({
  searchParams,
}: ProjectionPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const focusedMonth = getFocusedMonth(params.month);
  const payload = await getProjectionPagePayload(focusedMonth);

  const chartData = payload.chartMonths.map((month) => ({
    monthLabel: format(new Date(`${month.monthKey}-01T00:00:00`), "MMM yyyy"),
    income: month.income,
    expenses: Math.abs(month.expense),
  }));

  return (
    <Container>
      <Stack gap={24}>
        <Stack direction="row" align="center" justify="space-between" gap={16}>
          <Text size="h2" as="h2" weight="bold">
            {payload.focusedMonth.label}
          </Text>
          <Stack direction="row" align="center" gap={8}>
            <Card padding={8}>
              <AppLink
                href={`/projection?month=${payload.previousMonthKey}`}
                ariaLabel={i18n.t("projection_page.previous_month") as string}
              >
                <Icon name="chevron-left" />
              </AppLink>
            </Card>
            <Card padding={8}>
              <AppLink
                href={`/projection?month=${payload.nextMonthKey}`}
                ariaLabel={i18n.t("projection_page.next_month") as string}
              >
                <Icon name="chevron-right" />
              </AppLink>
            </Card>
          </Stack>
        </Stack>

        <Stack gap={12}>
          <Text size="h4" as="h3" weight="semibold">
            {i18n.t("projection_page.chart_title")}
          </Text>
          <Card padding={20}>
            <ProjectionChart data={chartData} />
          </Card>
        </Stack>

        <Stack gap={12}>
          <Text size="h4" as="h3" weight="semibold">
            {i18n.t("projection_page.month_totals")}
          </Text>
          <Grid minColumnWidth={220} gap={16}>
            <Card padding={8}>
              <Text size="sm" color="secondary">
                {i18n.t("projection_page.income")}
              </Text>
              <Currency
                value={payload.focusedMonthTotals.income}
                size="2xl"
                weight="bold"
              />
            </Card>
            <Card padding={8}>
              <Text size="sm" color="secondary">
                {i18n.t("projection_page.expenses")}
              </Text>
              <Currency
                value={payload.focusedMonthTotals.expense}
                size="2xl"
                weight="bold"
              />
            </Card>
            <Card padding={8}>
              <Text size="sm" color="secondary">
                {i18n.t("projection_page.total")}
              </Text>
              <Currency
                value={payload.focusedMonthTotals.net}
                size="2xl"
                weight="bold"
              />
            </Card>
          </Grid>
        </Stack>

        <Stack gap={24}>
          <Text size="h4" as="h3" weight="semibold">
            {i18n.t("projection_page.accounts_with_entries")}
          </Text>
          {payload.focusedMonthAccounts.length === 0 ? (
            <Card padding={20} variant="dashed">
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
                  <Stack key={account.accountId} gap={12}>
                    <Text size="md" weight="bold">
                      {account.accountName}
                    </Text>

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
                          label: i18n.t("projection_page.account_month_total"),
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
                );
              })}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
