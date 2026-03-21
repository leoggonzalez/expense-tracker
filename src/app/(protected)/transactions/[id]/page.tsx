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
import { DeleteTransactionDialog } from "@/components/delete_transaction_dialog/delete_transaction_dialog";

import { getTransactionById } from "@/actions/transactions";
import { i18n } from "@/model/i18n";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type TransactionPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    confirmDelete?: string;
  }>;
};

function formatTransactionDate(beginDate: string, endDate: string | null): string {
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

function getTransactionTypeLabel(type: string): string {
  if (type === "income") {
    return String(i18n.t("common.income"));
  }

  if (type === "expense") {
    return String(i18n.t("common.expense"));
  }

  return String(i18n.t("common.transfer"));
}

function getTransactionIcon(type: string): "income" | "expense" | "transfer" {
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
}: TransactionPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const query = await searchParams;
  const transaction = await getTransactionById(id);

  if (!transaction) {
    notFound();
  }

  const normalizedTransaction = {
    id: transaction.id,
    type: transaction.type,
    spaceId: transaction.spaceId,
    spaceName: transaction.space.name,
    transferSpaceId: transaction.transferSpaceId,
    transferSpaceName: transaction.transferSpace?.name || null,
    description: transaction.description,
    amount: transaction.amount,
    beginDate: transaction.beginDate.toISOString(),
    endDate: transaction.endDate?.toISOString() || null,
  };
  const settleDescription = String(
    i18n.t("transaction_detail_page.settle_description", {
      description: normalizedTransaction.description,
      month: formatSettleMonth(normalizedTransaction.beginDate),
    }),
  );
  const settleAmount = Math.abs(normalizedTransaction.amount).toFixed(2);
  const settleSearchParams = new URLSearchParams({
    to_space: normalizedTransaction.spaceId,
    description: settleDescription,
    amount: settleAmount,
  });
  const transactionDetailHref = `/transactions/${normalizedTransaction.id}`;
  const transferDirectionLabel =
    normalizedTransaction.transferSpaceId && normalizedTransaction.transferSpaceName
      ? normalizedTransaction.amount < 0
        ? i18n.t("transaction_list.to_space", {
            space: normalizedTransaction.transferSpaceName,
          })
        : i18n.t("transaction_list.from_space", {
            space: normalizedTransaction.transferSpaceName,
          })
      : null;

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon={getTransactionIcon(normalizedTransaction.type)}
          title={normalizedTransaction.description}
          pattern="transaction_detail"
          actions={[
            {
              icon: "edit",
              ariaLabel: String(i18n.t("transaction_detail_page.edit_transaction")),
              href: `/transactions/${normalizedTransaction.id}/edit`,
              variant: "outline",
            },
            {
              icon: "transfer",
              ariaLabel: String(i18n.t("transaction_detail_page.settle_transaction")),
              href: `/transactions/new/transfer?${settleSearchParams.toString()}`,
              variant: "outline",
            },
            {
              icon: "trash",
              ariaLabel: String(i18n.t("transaction_detail_page.delete")),
              href: `${transactionDetailHref}?confirmDelete=1`,
              variant: "outline-danger",
            },
          ]}
        >
          <Stack gap={24}>
            <Text as="p" size="sm" color="hero-muted">
              {formatTransactionDate(
                normalizedTransaction.beginDate,
                normalizedTransaction.endDate,
              )}
            </Text>

            <HeroMetrics columns={2}>
              <HeroMetric>
                <Text size="sm" color="hero">
                  {i18n.t("transaction_detail_page.amount")}
                </Text>
                <Currency
                  value={normalizedTransaction.amount}
                  size="h3"
                  weight="bold"
                  color="inverse"
                />
              </HeroMetric>
              <HeroMetric tone="soft">
                <Text size="sm" color="hero">
                  {i18n.t("transaction_detail_page.type")}
                </Text>
                <Text size="lg" weight="semibold" color="hero">
                  {getTransactionTypeLabel(normalizedTransaction.type)}
                </Text>
              </HeroMetric>
            </HeroMetrics>
          </Stack>
        </Hero>
        <DeleteTransactionDialog
          transactionId={normalizedTransaction.id}
          isOpen={query.confirmDelete === "1"}
          closeHref={transactionDetailHref}
        />

        <Card
          padding={24}
          title={String(i18n.t("transaction_detail_page.title"))}
          icon="transactions"
        >
          <Stack gap={20}>
            <DetailList>
              <DetailRow
                label={
                  <Text size="sm" color="secondary">
                    {i18n.t("transaction_detail_page.type")}
                  </Text>
                }
                value={
                  <Text size="sm" weight="semibold">
                    {getTransactionTypeLabel(normalizedTransaction.type)}
                  </Text>
                }
              />
              <DetailRow
                label={
                  <Text size="sm" color="secondary">
                    {i18n.t("transaction_detail_page.space")}
                  </Text>
                }
                value={
                  <Text size="sm" weight="semibold">
                    {normalizedTransaction.spaceName}
                  </Text>
                }
              />
              <DetailRow
                label={
                  <Text size="sm" color="secondary">
                    {i18n.t("transaction_detail_page.amount")}
                  </Text>
                }
                value={
                  <Currency
                    value={normalizedTransaction.amount}
                    size="sm"
                    weight="bold"
                  />
                }
              />
              <DetailRow
                label={
                  <Text size="sm" color="secondary">
                    {i18n.t("transaction_detail_page.date_range")}
                  </Text>
                }
                value={
                  <Text size="sm" weight="semibold">
                    {formatTransactionDate(
                      normalizedTransaction.beginDate,
                      normalizedTransaction.endDate,
                    )}
                  </Text>
                }
              />
              {transferDirectionLabel ? (
                <DetailRow
                  label={
                    <Text size="sm" color="secondary">
                      {i18n.t("transaction_detail_page.transfer")}
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
        <AppLink href="/transactions">
          {i18n.t("transaction_detail_page.back_to_transactions")}
        </AppLink>
      </Stack>
    </Container>
  );
}
