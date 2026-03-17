import {
  AccountArchiveForm,
  AppLink,
  Button,
  Container,
  Currency,
  EntryList,
  Hero,
  HeroMetric,
  HeroMetrics,
} from "@/components";
import { Card, Icon, Stack, Text } from "@/elements";
import { addMonths, format, startOfMonth } from "date-fns";
import { getAccountDetailPageData, unarchiveAccount } from "@/actions/accounts";

import { i18n } from "@/model/i18n";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type AccountRouteProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
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

function parseMonthKey(monthKey: string): Date {
  return new Date(`${monthKey}-01T00:00:00`);
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
  params,
  searchParams,
}: AccountRouteProps): Promise<React.ReactElement> {
  const { id } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number(query.page || "1") || 1);
  const selectedMonthStart = parseCurrentMonthOrNow(query.currentMonth);

  const data = await getAccountDetailPageData({
    accountId: id,
    page,
    limit: 10,
    selectedMonthStart,
  });

  if (!data) {
    notFound();
  }

  async function handleUnarchiveAction(): Promise<void> {
    "use server";

    await unarchiveAccount(id);
  }

  const selectedMonthDate = parseMonthKey(data.selectedMonth.key);
  const selectedMonthLabel = formatMonthLabel(selectedMonthDate);
  const previousMonthKey = formatMonthKey(addMonths(selectedMonthDate, -1));
  const nextMonthKey = formatMonthKey(addMonths(selectedMonthDate, 1));

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="accounts"
          title={data.account.name}
          pattern="account_detail"
          actions={
            <>
              <Button
                href={`/accounts/${data.account.id}?currentMonth=${previousMonthKey}`}
                variant="outline"
              >
                <Icon name="chevron-left" size={18} />
              </Button>
              <Button
                href={`/accounts/${data.account.id}?currentMonth=${nextMonthKey}`}
                variant="outline"
              >
                <Icon name="chevron-right" size={18} />
              </Button>
              {data.account.isArchived ? null : (
                <form action={`/accounts/${data.account.id}/edit`} method="get">
                  <Button type="submit">
                    <Icon name="edit" size={18} />
                  </Button>
                </form>
              )}
            </>
          }
        >
          <Stack gap={24}>
            <Stack gap={14}>
              <Text as="p" size="sm" color="inverse">
                {i18n.t("accounts_page.detail_hero_subtitle", {
                  month: selectedMonthLabel,
                })}
              </Text>
            </Stack>

            <HeroMetrics columns={2}>
              <HeroMetric>
                <Text size="sm" color="inverse">
                  {i18n.t("accounts_page.month_total_label", {
                    month: selectedMonthLabel,
                  })}
                </Text>
                <Currency
                  value={data.account.selectedMonthTotal}
                  size="h3"
                  weight="bold"
                />
              </HeroMetric>
              <HeroMetric tone="soft">
                <Text size="sm" color="inverse">
                  {i18n.t("accounts_page.historical_total")}
                </Text>
                <Currency
                  value={data.account.historicalTotal}
                  size="h3"
                  weight="bold"
                />
              </HeroMetric>
            </HeroMetrics>
          </Stack>
        </Hero>

        <Card padding={24}>
          <Stack gap={18}>
            {data.account.isArchived ? (
              <Stack
                direction="column"
                desktopDirection="row"
                align="flex-start"
                justify="space-between"
                gap={16}
              >
                <Stack gap={8}>
                  <Text size="sm" weight="semibold" color="warning">
                    {i18n.t("accounts_page.archived_badge")}
                  </Text>
                  <Text size="sm" color="secondary">
                    {i18n.t("accounts_page.archived_account_hint")}
                  </Text>
                </Stack>
                <form action={handleUnarchiveAction}>
                  <Button type="submit">
                    {i18n.t("accounts_page.unarchive")}
                  </Button>
                </form>
              </Stack>
            ) : data.account.selectedMonthTotal < 0 ? (
              <form action="/entries/new/transfer" method="get">
                <Stack gap={16}>
                  <input
                    type="hidden"
                    name="to_account"
                    value={data.account.id}
                  />
                  <input
                    type="hidden"
                    name="amount"
                    value={Math.abs(data.account.selectedMonthTotal).toFixed(2)}
                  />
                  <input
                    type="hidden"
                    name="description"
                    value={String(
                      i18n.t("accounts_page.settle_description", {
                        account: data.account.name,
                        month: selectedMonthLabel,
                      }),
                    )}
                  />
                  <Text size="sm" color="secondary">
                    {i18n.t("accounts_page.settle_hint")}
                  </Text>
                  <Button type="submit">
                    {i18n.t("accounts_page.settle")}
                  </Button>
                </Stack>
              </form>
            ) : (
              <Stack
                direction="column"
                desktopDirection="row"
                align="flex-start"
                justify="space-between"
                gap={16}
              >
                <Stack gap={8}>
                  <Text size="sm" weight="semibold">
                    {i18n.t("accounts_page.settle")}
                  </Text>
                  <Text size="sm" color="secondary">
                    {i18n.t("accounts_page.settle_unavailable")}
                  </Text>
                </Stack>
                <Button type="button" disabled>
                  {i18n.t("accounts_page.settle")}
                </Button>
              </Stack>
            )}
          </Stack>
        </Card>

        <Card
          padding={24}
          title={String(
            i18n.t("accounts_page.month_relevant_entries_label", {
              month: selectedMonthLabel,
            }),
          )}
          icon="entries"
        >
          <EntryList
            entries={data.selectedMonthRelevantEntries}
            showDelete={false}
            entryHrefBase="/entries"
            summaryRows={[
              {
                id: "selected-month-relevant-total",
                label: i18n.t("accounts_page.month_relevant_total_label", {
                  month: selectedMonthLabel,
                }) as string,
                value: (
                  <Currency
                    value={data.account.selectedMonthTotal}
                    size="sm"
                    weight="bold"
                  />
                ),
                tone: "emphasis",
              },
            ]}
          />
        </Card>

        <Card
          padding={24}
          title={String(i18n.t("accounts_page.all_entries"))}
          icon="activity"
        >
          <Stack gap={20}>
            <EntryList
              entries={data.allEntries}
              showDelete={false}
              entryHrefBase="/entries"
            />

            {data.pagination.hasMore ? (
              <form method="get">
                <input
                  type="hidden"
                  name="currentMonth"
                  value={data.selectedMonth.key}
                />
                <input
                  type="hidden"
                  name="page"
                  value={String(data.pagination.page + 1)}
                />
                <Button type="submit">
                  {i18n.t("accounts_page.load_more_entries")}
                </Button>
              </form>
            ) : null}
          </Stack>
        </Card>

        <Stack
          direction="column"
          desktopDirection="row"
          align="flex-start"
          justify="space-between"
          gap={16}
        >
          <AppLink href="/accounts">
            {i18n.t("accounts_page.back_to_accounts")}
          </AppLink>
          {!data.account.isArchived ? (
            <AccountArchiveForm accountId={data.account.id} />
          ) : null}
        </Stack>
      </Stack>
    </Container>
  );
}
