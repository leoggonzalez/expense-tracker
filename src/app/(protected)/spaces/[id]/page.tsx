import {
  AppLink,
  Button,
  Container,
  Currency,
  TransactionList,
  Hero,
  type HeroAction,
  HeroMetric,
  HeroMetrics,
} from "@/components";
import { SpaceArchiveDialog } from "@/components/space_archive_dialog/space_archive_dialog";
import { Card, Icon, Stack, Text } from "@/elements";
import { addMonths, format, startOfMonth } from "date-fns";
import { getSpaceDetailPageData } from "@/actions/spaces";

import { i18n } from "@/model/i18n";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type SpaceRouteProps = {
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
}: SpaceRouteProps): Promise<React.ReactElement> {
  const { id } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number(query.page || "1") || 1);
  const selectedMonthStart = parseCurrentMonthOrNow(query.currentMonth);

  const data = await getSpaceDetailPageData({
    spaceId: id,
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
      ? `/spaces/${data.space.id}?${detailSearchParams.toString()}`
      : `/spaces/${data.space.id}`;
  const confirmArchiveHref =
    detailSearchParams.size > 0
      ? `/spaces/${data.space.id}?${detailSearchParams.toString()}&confirmArchive=1`
      : `/spaces/${data.space.id}?confirmArchive=1`;
  const confirmUnarchiveHref =
    detailSearchParams.size > 0
      ? `/spaces/${data.space.id}?${detailSearchParams.toString()}&confirmUnarchive=1`
      : `/spaces/${data.space.id}?confirmUnarchive=1`;
  const settleHref = `/transactions/new/transfer?${new URLSearchParams({
    to_space: data.space.id,
    amount: Math.abs(data.space.selectedMonthTotal).toFixed(2),
    description: String(
      i18n.t("spaces_page.settle_description", {
        space: data.space.name,
        month: selectedMonthLabel,
      }),
    ),
  }).toString()}`;
  const heroActions: HeroAction[] = data.space.isArchived
    ? [
        {
          icon: "check",
          ariaLabel: String(i18n.t("spaces_page.unarchive")),
          href: confirmUnarchiveHref,
          variant: "outline",
        },
      ]
    : [
        {
          icon: "edit",
          ariaLabel: String(i18n.t("spaces_page.edit_space")),
          href: `/spaces/${data.space.id}/edit`,
          variant: "outline",
        },
        {
          icon: "transfer" as const,
          ariaLabel: String(i18n.t("spaces_page.settle")),
          href: settleHref,
          variant: "outline",
          disabled: data.space.selectedMonthTotal >= 0,
        },
        {
          icon: "alert",
          ariaLabel: String(i18n.t("spaces_page.archive")),
          href: confirmArchiveHref,
          variant: "outline-danger",
        },
      ];

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="spaces"
          title={data.space.name}
          pattern="space_detail"
          actions={heroActions}
        >
          <Stack gap={24}>
            <Stack gap={14}>
              <Text as="p" size="sm" color="inverse">
                {i18n.t("spaces_page.detail_hero_subtitle", {
                  month: selectedMonthLabel,
                })}
              </Text>
            </Stack>

            <HeroMetrics columns={2}>
              <HeroMetric>
                <Stack gap={16}>
                  <Text size="sm" color="inverse">
                    {i18n.t("spaces_page.month_total_label", {
                      month: selectedMonthLabel,
                    })}
                  </Text>
                  <Currency
                    value={data.space.selectedMonthTotal}
                    size="h3"
                    weight="bold"
                    color="inverse"
                  />
                  <Stack
                    direction="row"
                    align="center"
                    justify="space-between"
                    gap={12}
                  >
                    <Button
                      href={`/spaces/${data.space.id}?currentMonth=${previousMonthKey}`}
                      variant="outline"
                      ariaLabel={String(i18n.t("pagination.previous"))}
                    >
                      <Icon name="chevron-left" size={18} />
                    </Button>
                    <Text size="sm" color="inverse" weight="medium">
                      {selectedMonthLabel}
                    </Text>
                    <Button
                      href={`/spaces/${data.space.id}?currentMonth=${nextMonthKey}`}
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
                  {i18n.t("spaces_page.historical_total")}
                </Text>
                <Currency
                  value={data.space.historicalTotal}
                  size="h3"
                  weight="bold"
                  color="inverse"
                />
              </HeroMetric>
            </HeroMetrics>
          </Stack>
        </Hero>
        <SpaceArchiveDialog
          spaceId={data.space.id}
          spaceName={data.space.name}
          isOpen={
            query.confirmArchive === "1" || query.confirmUnarchive === "1"
          }
          mode={query.confirmUnarchive === "1" ? "unarchive" : "archive"}
          closeHref={detailHref}
        />

        {data.space.isArchived ? (
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
                    {i18n.t("spaces_page.archived_badge")}
                  </Text>
                  <Text size="sm" color="secondary">
                    {i18n.t("spaces_page.archived_space_hint")}
                  </Text>
                </Stack>
              </Stack>
            </Stack>
          </Card>
        ) : null}

        <Card
          padding={24}
          title={String(
            i18n.t("spaces_page.month_relevant_transactions_label", {
              month: selectedMonthLabel,
            }),
          )}
          icon="transactions"
        >
          <TransactionList
            transactions={data.selectedMonthRelevantTransactions}
            showDelete={false}
            transactionHrefBase="/transactions"
            summaryRows={[
              {
                id: "selected-month-relevant-total",
                label: i18n.t("spaces_page.month_relevant_total_label", {
                  month: selectedMonthLabel,
                }) as string,
                value: (
                  <Currency
                    value={data.space.selectedMonthTotal}
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
          title={String(i18n.t("spaces_page.all_transactions"))}
          icon="activity"
        >
          <Stack gap={20}>
            <TransactionList
              transactions={data.allTransactions}
              showDelete={false}
              transactionHrefBase="/transactions"
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
                  {i18n.t("spaces_page.load_more_transactions")}
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
          <AppLink href="/spaces">
            {i18n.t("spaces_page.back_to_spaces")}
          </AppLink>
        </Stack>
      </Stack>
    </Container>
  );
}
