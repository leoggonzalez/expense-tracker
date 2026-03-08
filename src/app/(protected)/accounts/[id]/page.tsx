import { notFound } from "next/navigation";
import { startOfMonth } from "date-fns";

import { getAccountDetailPageData, unarchiveAccount } from "@/actions/accounts";
import { AccountArchiveForm, AppLink, Avatar, Button, Container, Currency, EntryList } from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

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

  return (
    <Container>
      <Stack gap={24}>
        <Text size="h2" as="h1" weight="bold">
          {i18n.t("account_detail_page.title")}
        </Text>

        <Card padding={20} variant="secondary">
          <Stack gap={14}>
            <Stack direction="row" align="flex-start" justify="space-between" gap={12}>
              <Stack gap={10}>
                <Stack direction="row" align="center" justify="space-between" gap={12}>
                  <Stack direction="row" align="center" gap={10}>
                    <Avatar name={data.account.name} />
                    <Text size="h4" as="h2" weight="semibold">
                      {data.account.name}
                    </Text>
                  </Stack>
                  {data.account.isArchived ? null : (
                    <form action={`/accounts/${data.account.id}/edit`} method="get">
                      <Button type="submit">{i18n.t("accounts_page.edit_account")}</Button>
                    </form>
                  )}
                </Stack>
                <Text size="sm" color="secondary">
                  {i18n.t("accounts_page.month_total_label", {
                    month: data.selectedMonth.label,
                  })}
                </Text>
                <Currency
                  value={data.account.selectedMonthTotal}
                  size="h4"
                  weight="bold"
                />
              </Stack>

              <Stack gap={6} align="flex-end">
                <Text size="sm" color="secondary">
                  {i18n.t("accounts_page.historical_total")}
                </Text>
                <Currency
                  value={data.account.historicalTotal}
                  size="h4"
                  weight="bold"
                />
              </Stack>
            </Stack>

            {data.account.isArchived ? (
              <Stack gap={10}>
                <Text size="sm" color="warning">
                  {i18n.t("accounts_page.archived_badge")}
                </Text>
                <form action={handleUnarchiveAction}>
                  <Button type="submit">{i18n.t("accounts_page.unarchive")}</Button>
                </form>
              </Stack>
            ) : data.account.selectedMonthTotal < 0 ? (
              <form action="/entries/new/transfer" method="get">
                <input type="hidden" name="to_account" value={data.account.id} />
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
                      month: data.selectedMonth.label,
                    }),
                  )}
                />
                <Button type="submit">{i18n.t("accounts_page.settle")}</Button>
              </form>
            ) : (
              <Stack gap={6}>
                <Button type="button" disabled>
                  {i18n.t("accounts_page.settle")}
                </Button>
                <Text size="xs" color="secondary">
                  {i18n.t("accounts_page.settle_unavailable")}
                </Text>
              </Stack>
            )}
          </Stack>
        </Card>

        <Stack gap={16}>
          <Text size="h4" as="h2" weight="semibold">
            {i18n.t("accounts_page.month_relevant_entries_label", {
              month: data.selectedMonth.label,
            })}
          </Text>

          <EntryList
            entries={data.selectedMonthRelevantEntries}
            showDelete={false}
            entryHrefBase="/entries"
            summaryRows={[
              {
                id: "selected-month-relevant-total",
                label: i18n.t("accounts_page.month_relevant_total_label", {
                  month: data.selectedMonth.label,
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
        </Stack>

        <Stack gap={16}>
          <Text size="h4" as="h2" weight="semibold">
            {i18n.t("accounts_page.all_entries")}
          </Text>

          <EntryList
            entries={data.allEntries}
            showDelete={false}
            entryHrefBase="/entries"
          />

          {data.pagination.hasMore ? (
            <form method="get">
              <input type="hidden" name="currentMonth" value={data.selectedMonth.key} />
              <input type="hidden" name="page" value={String(page + 1)} />
              <Button type="submit">{i18n.t("accounts_page.load_more_entries")}</Button>
            </form>
          ) : null}
        </Stack>

        {!data.account.isArchived ? (
          <Stack gap={10}>
            <Text size="sm" color="secondary">
              {i18n.t("accounts_page.archive")}
            </Text>
            <AccountArchiveForm accountId={data.account.id} />
          </Stack>
        ) : null}

        <AppLink href="/accounts">{i18n.t("accounts_page.back_to_accounts")}</AppLink>
      </Stack>
    </Container>
  );
}
