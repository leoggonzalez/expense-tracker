import {
  AppLink,
  Button,
  Container,
  Currency,
  DeleteEntryButton,
  DetailList,
  DetailRow,
  Hero,
  HeroMetric,
  HeroMetrics,
} from "@/components";
import { Card, Icon, Stack, Text } from "@/elements";

import { getEntryById } from "@/actions/entries";
import { i18n } from "@/model/i18n";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type EntryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatEntryDate(beginDate: string, endDate: string | null): string {
  const locale = i18n.locale || "en";
  const begin = new Date(beginDate);
  const formatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const formattedBegin = formatter.format(begin);

  if (!endDate) {
    return formattedBegin;
  }

  const end = new Date(endDate);

  if (begin.getTime() === end.getTime()) {
    return formattedBegin;
  }

  return `${formattedBegin} - ${formatter.format(end)}`;
}

function formatSettleMonth(beginDate: string): string {
  return new Intl.DateTimeFormat(i18n.locale || "en", {
    month: "long",
    year: "numeric",
  }).format(new Date(beginDate));
}

function getEntryTypeLabel(type: string): string {
  if (type === "income") {
    return String(i18n.t("common.income"));
  }

  if (type === "expense") {
    return String(i18n.t("common.expense"));
  }

  return String(i18n.t("common.transfer"));
}

function getEntryIcon(type: string): "income" | "expense" | "transfer" {
  if (type === "income") {
    return "income";
  }

  if (type === "expense") {
    return "expense";
  }

  return "transfer";
}

export default async function Page({
  params,
}: EntryPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const entry = await getEntryById(id);

  if (!entry) {
    notFound();
  }

  const normalizedEntry = {
    id: entry.id,
    type: entry.type,
    accountId: entry.accountId,
    accountName: entry.account.name,
    transferAccountId: entry.transferAccountId,
    transferAccountName: entry.transferAccount?.name || null,
    description: entry.description,
    amount: entry.amount,
    beginDate: entry.beginDate.toISOString(),
    endDate: entry.endDate?.toISOString() || null,
  };
  const settleDescription = String(
    i18n.t("entry_detail_page.settle_description", {
      description: normalizedEntry.description,
      month: formatSettleMonth(normalizedEntry.beginDate),
    }),
  );
  const settleAmount = Math.abs(normalizedEntry.amount).toFixed(2);
  const transferDirectionLabel =
    normalizedEntry.transferAccountId && normalizedEntry.transferAccountName
      ? normalizedEntry.amount < 0
        ? i18n.t("entry_list.to_account", {
            account: normalizedEntry.transferAccountName,
          })
        : i18n.t("entry_list.from_account", {
            account: normalizedEntry.transferAccountName,
          })
      : null;

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon={getEntryIcon(normalizedEntry.type)}
          title={normalizedEntry.description}
          pattern="entry_detail"
          actions={
            <Stack direction="row" align="center" gap={12}>
            <Button
              href={`/entries/${normalizedEntry.id}/edit`}
              variant="outline"
            >
              <Icon name="edit" />
            </Button>
              <DeleteEntryButton entryId={normalizedEntry.id} />
            </Stack>
          }
        >
          <Stack gap={24}>
              <Text as="p" size="sm" color="inverse">
                {formatEntryDate(
                  normalizedEntry.beginDate,
                  normalizedEntry.endDate,
                )}
              </Text>

            <HeroMetrics columns={2}>
              <HeroMetric>
                <Text size="sm" color="inverse">
                  {i18n.t("entry_detail_page.amount")}
                </Text>
                <Currency
                  value={normalizedEntry.amount}
                  size="h3"
                  weight="bold"
                />
              </HeroMetric>
              <HeroMetric tone="soft">
                <Text size="sm" color="inverse">
                  {i18n.t("entry_detail_page.type")}
                </Text>
                <Text size="lg" weight="semibold" color="inverse">
                  {getEntryTypeLabel(normalizedEntry.type)}
                </Text>
              </HeroMetric>
            </HeroMetrics>
          </Stack>
        </Hero>

        <Card
          padding={24}
          title={String(i18n.t("entry_detail_page.title"))}
          icon="entries"
        >
          <Stack gap={20}>
            <DetailList>
              <DetailRow
                label={
                  <Text size="sm" color="secondary">
                    {i18n.t("entry_detail_page.type")}
                  </Text>
                }
                value={
                  <Text size="sm" weight="semibold">
                    {getEntryTypeLabel(normalizedEntry.type)}
                  </Text>
                }
              />
              <DetailRow
                label={
                  <Text size="sm" color="secondary">
                    {i18n.t("entry_detail_page.account")}
                  </Text>
                }
                value={
                  <Text size="sm" weight="semibold">
                    {normalizedEntry.accountName}
                  </Text>
                }
              />
              <DetailRow
                label={
                  <Text size="sm" color="secondary">
                    {i18n.t("entry_detail_page.amount")}
                  </Text>
                }
                value={
                  <Currency
                    value={normalizedEntry.amount}
                    size="sm"
                    weight="bold"
                  />
                }
              />
              <DetailRow
                label={
                  <Text size="sm" color="secondary">
                    {i18n.t("entry_detail_page.date_range")}
                  </Text>
                }
                value={
                  <Text size="sm" weight="semibold">
                    {formatEntryDate(
                      normalizedEntry.beginDate,
                      normalizedEntry.endDate,
                    )}
                  </Text>
                }
              />
              {transferDirectionLabel ? (
                <DetailRow
                  label={
                    <Text size="sm" color="secondary">
                      {i18n.t("entry_detail_page.transfer")}
                    </Text>
                  }
                  value={
                    <Text size="sm" weight="semibold">
                      {transferDirectionLabel}
                    </Text>
                  }
                />
              ) : null}
            </DetailList>

            <form action="/entries/new/transfer" method="get">
              <input
                type="hidden"
                name="to_account"
                value={normalizedEntry.accountId}
              />
              <input
                type="hidden"
                name="description"
                value={settleDescription}
              />
              <input type="hidden" name="amount" value={settleAmount} />
              <Button type="submit" variant="transfer" fullWidth>
                {i18n.t("entry_detail_page.settle_entry")}
              </Button>
            </form>
          </Stack>
        </Card>
        <AppLink href="/entries">
          {i18n.t("entry_detail_page.back_to_entries")}
        </AppLink>
      </Stack>
    </Container>
  );
}
