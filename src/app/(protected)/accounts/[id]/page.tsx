import { notFound } from "next/navigation";

import { getAccountDetailPageData, unarchiveAccount } from "@/actions/accounts";
import {
  AccountArchiveForm,
  AppLink,
  Button,
  Container,
  EntryList,
} from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

type AccountRouteProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
};

function formatCurrency(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${Math.abs(amount).toFixed(2)} €`;
}

export default async function Page({
  params,
  searchParams,
}: AccountRouteProps): Promise<React.ReactElement> {
  const { id } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number(query.page || "1") || 1);

  const data = await getAccountDetailPageData({
    accountId: id,
    page,
    limit: 20,
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
            <Stack direction="row" align="center" justify="space-between" gap={12}>
              <Text size="h4" as="h2" weight="semibold">
                {data.account.name}
              </Text>
              <Text
                size="h4"
                weight="bold"
                color={data.account.currentMonthTotal >= 0 ? "success" : "danger"}
              >
                {formatCurrency(data.account.currentMonthTotal)}
              </Text>
            </Stack>

            <Text size="sm" color="secondary">
              {i18n.t("accounts_page.current_month_total")}
            </Text>

            {data.account.isArchived ? (
              <Stack gap={10}>
                <Text size="sm" color="warning">
                  {i18n.t("accounts_page.archived_badge")}
                </Text>
                <form action={handleUnarchiveAction}>
                  <Button type="submit">{i18n.t("accounts_page.unarchive")}</Button>
                </form>
              </Stack>
            ) : (
              <Stack direction="row" wrap gap={10}>
                <form action={`/accounts/${data.account.id}/edit`} method="get">
                  <Button type="submit">{i18n.t("accounts_page.edit_account")}</Button>
                </form>
                <AccountArchiveForm accountId={data.account.id} />
              </Stack>
            )}
          </Stack>
        </Card>

        <Stack gap={16}>
          <Text size="h4" as="h2" weight="semibold">
            {i18n.t("account_detail_page.related_entries")}
          </Text>

          {data.entryMonthGroups.length === 0 ? (
            <Card padding={20} variant="dashed">
              <Text color="secondary">{i18n.t("entries_page.empty_state")}</Text>
            </Card>
          ) : (
            <Stack gap={20}>
              {data.entryMonthGroups.map((group) => (
                <Stack key={group.monthKey} gap={10}>
                  <Text size="md" weight="semibold">
                    {group.monthLabel}
                  </Text>
                  <EntryList
                    entries={group.entries}
                    showDelete={false}
                    entryHrefBase="/entries"
                  />
                </Stack>
              ))}
            </Stack>
          )}

          {data.pagination.hasMore ? (
            <form method="get">
              <input type="hidden" name="page" value={String(page + 1)} />
              <Button type="submit">{i18n.t("accounts_page.load_more_entries")}</Button>
            </form>
          ) : null}
        </Stack>

        <AppLink href="/accounts">{i18n.t("accounts_page.back_to_accounts")}</AppLink>
      </Stack>
    </Container>
  );
}
