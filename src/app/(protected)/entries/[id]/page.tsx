import {
  AppLink,
  Container,
  Currency,
  DetailList,
  DetailRow,
  Hero,
  HeroMetric,
  HeroMetrics,
} from "@/components";
import { Card, Stack, Text } from "@/elements";
import { DeleteEntryDialog } from "@/components/delete_entry_dialog/delete_entry_dialog";

import { getEntryById } from "@/actions/entries";
import { i18n } from "@/model/i18n";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type EntryPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    confirmDelete?: string;
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
  searchParams,
}: EntryPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const query = await searchParams;
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
  const settleSearchParams = new URLSearchParams({
    to_account: normalizedEntry.accountId,
    description: settleDescription,
    amount: settleAmount,
  });
  const entryDetailHref = `/entries/${normalizedEntry.id}`;
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
          actions={[
            {
              icon: "edit",
              ariaLabel: String(i18n.t("entry_detail_page.edit_entry")),
              href: `/entries/${normalizedEntry.id}/edit`,
              variant: "outline",
            },
            {
              icon: "transfer",
              ariaLabel: String(i18n.t("entry_detail_page.settle_entry")),
              href: `/entries/new/transfer?${settleSearchParams.toString()}`,
              variant: "outline",
            },
            {
              icon: "trash",
              ariaLabel: String(i18n.t("entry_detail_page.delete")),
              href: `${entryDetailHref}?confirmDelete=1`,
              variant: "outline-danger",
            },
          ]}
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
        <DeleteEntryDialog
          entryId={normalizedEntry.id}
          isOpen={query.confirmDelete === "1"}
          closeHref={entryDetailHref}
        />

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
          </Stack>
        </Card>
        <AppLink href="/entries">
          {i18n.t("entry_detail_page.back_to_entries")}
        </AppLink>
      </Stack>
    </Container>
  );
}
