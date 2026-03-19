import {
  AppLink,
  Button,
  Container,
  Currency,
  EntryList,
  Hero,
  HeroMetric,
  HeroMetrics,
} from "@/components";
import { AccountArchiveDialog } from "@/components/account_archive_dialog/account_archive_dialog";
import { Card, Icon, Stack, Text } from "@/elements";
import { addMonths, format, startOfMonth } from "date-fns";
import { getAccountDetailPageData } from "@/actions/accounts";

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
    confirmArchive?: string;
    confirmUnarchive?: string;
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

  const selectedMonthDate = parseMonthKey(data.selectedMonth.key);
  const selectedMonthLabel = formatMonthLabel(selectedMonthDate);
  const previousMonthKey = formatMonthKey(addMonths(selectedMonthDate, -1));
  const nextMonthKey = formatMonthKey(addMonths(selectedMonthDate, 1));
  const detailSearchParams = new URLSearchParams();

  if (query.currentMonth) {
    detailSearchParams.set("currentMonth", query.currentMonth);
  }

  if (page > 1) {
    detailSearchParams.set("page", String(page));
  }

  const detailHref =
    detailSearchParams.size > 0
      ? `/accounts/${data.account.id}?${detailSearchParams.toString()}`
      : `/accounts/${data.account.id}`;
  const confirmArchiveHref =
    detailSearchParams.size > 0
      ? `/accounts/${data.account.id}?${detailSearchParams.toString()}&confirmArchive=1`
      : `/accounts/${data.account.id}?confirmArchive=1`;
  const confirmUnarchiveHref =
    detailSearchParams.size > 0
      ? `/accounts/${data.account.id}?${detailSearchParams.toString()}&confirmUnarchive=1`
      : `/accounts/${data.account.id}?confirmUnarchive=1`;
  const settleHref = `/entries/new/transfer?${new URLSearchParams({
    to_account: data.account.id,
    amount: Math.abs(data.account.selectedMonthTotal).toFixed(2),
    description: String(
      i18n.t("accounts_page.settle_description", {
        account: data.account.name,
        month: selectedMonthLabel,
      }),
    ),
  }).toString()}`;
  const heroActions = data.account.isArchived
    ? [
        {
          icon: "check",
          ariaLabel: String(i18n.t("accounts_page.unarchive")),
          href: confirmUnarchiveHref,
          variant: "outline",
        },
      ]
    : [
        {
          icon: "edit",
          ariaLabel: String(i18n.t("accounts_page.edit_account")),
          href: `/accounts/${data.account.id}/edit`,
          variant: "outline",
        },
        {
          icon: "transfer" as const,
          ariaLabel: String(i18n.t("accounts_page.settle")),
          href: settleHref,
          variant: "outline",
          disabled: data.account.selectedMonthTotal >= 0,
        },
        {
          icon: "alert",
          ariaLabel: String(i18n.t("accounts_page.archive")),
          href: confirmArchiveHref,
          variant: "outline-danger",
        },
      ];

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="accounts"
          title={data.account.name}
          pattern="account_detail"
          actions={heroActions}
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
                <Stack gap={16}>
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
                  <Stack
                    direction="row"
                    align="center"
                    justify="space-between"
                    gap={12}
                  >
                    <Button
                      href={`/accounts/${data.account.id}?currentMonth=${previousMonthKey}`}
                      variant="outline"
                      ariaLabel={String(i18n.t("pagination.previous"))}
                    >
                      <Icon name="chevron-left" size={18} />
                    </Button>
                    <Text size="sm" color="inverse" weight="medium">
                      {selectedMonthLabel}
                    </Text>
                    <Button
                      href={`/accounts/${data.account.id}?currentMonth=${nextMonthKey}`}
                      variant="outline"
                      ariaLabel={String(i18n.t("pagination.next"))}
                    >
                      <Icon name="chevron-right" size={18} />
                    </Button>
                  </Stack>
                </Stack>
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
        <AccountArchiveDialog
          accountId={data.account.id}
          accountName={data.account.name}
          isOpen={
            query.confirmArchive === "1" || query.confirmUnarchive === "1"
          }
          mode={query.confirmUnarchive === "1" ? "unarchive" : "archive"}
          closeHref={detailHref}
        />

        {data.account.isArchived ? (
          <Card padding={24}>
            <Stack gap={18}>
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
              </Stack>
            </Stack>
          </Card>
        ) : null}

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
        </Stack>
      </Stack>
    </Container>
  );
}
