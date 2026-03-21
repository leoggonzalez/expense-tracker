"use client";

import React from "react";
import type { TransactionDetailPayload } from "@/actions/transactions";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import {
  AppLink,
  Button,
  Container,
  Currency,
  DetailList,
  DetailRow,
  Hero,
  HeroMetric,
  HeroMetrics,
  LoadingSkeleton,
} from "@/components";
import { DeleteTransactionDialog } from "@/components/delete_transaction_dialog/delete_transaction_dialog";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

const transactionDetailCache = {
  entries: new Map<string, TransactionDetailPayload>(),
};

type TransactionDetailSectionProps = {
  id: string;
  isDeleteDialogOpen: boolean;
};

function formatTransactionDate(
  beginDate: string,
  endDate: string | null,
): string {
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

function TransactionDetailSkeleton(): React.ReactElement {
  return (
    <Container>
      <Stack gap={24}>
        <Hero icon="transactions" title="" pattern="transaction_detail">
          <Stack gap={24}>
            <LoadingSkeleton width="220px" height={24} radius={12} />
            <HeroMetrics columns={2}>
              <HeroMetric>
                <>
                  <Text size="sm" color="hero">
                    {i18n.t("transaction_detail_page.amount")}
                  </Text>
                  <LoadingSkeleton width="140px" height={36} radius={14} />
                </>
              </HeroMetric>
              <HeroMetric tone="soft">
                <>
                  <Text size="sm" color="hero">
                    {i18n.t("transaction_detail_page.type")}
                  </Text>
                  <LoadingSkeleton width="120px" height={28} radius={12} />
                </>
              </HeroMetric>
            </HeroMetrics>
          </Stack>
        </Hero>

        <Card padding={24}>
          <Stack gap={16}>
            <LoadingSkeleton width="100%" height={20} radius={10} />
            <LoadingSkeleton width="100%" height={20} radius={10} />
            <LoadingSkeleton width="100%" height={20} radius={10} />
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}

export function TransactionDetailSection({
  id,
  isDeleteDialogOpen,
}: TransactionDetailSectionProps): React.ReactElement {
  const endpoint = `/api/transactions/detail/${id}`;
  const { data, isLoading, hasError, isNotFound, retry } =
    useProtectedPageSection(endpoint, endpoint, transactionDetailCache);

  if (hasError && !data) {
    return (
      <Container>
        <Card padding={24}>
          <Stack gap={12} align="flex-start">
            <Text color="secondary">
              {i18n.t("transaction_detail_page.load_failed")}
            </Text>
            <Button variant="secondary" size="sm" onClick={retry}>
              {i18n.t("common.retry")}
            </Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  if (isNotFound) {
    return (
      <Container>
        <Stack gap={24}>
          <Card padding={24}>
            <Text color="secondary">
              {i18n.t("transaction_detail_page.not_found")}
            </Text>
          </Card>
          <AppLink href="/transactions">
            {i18n.t("transaction_detail_page.back_to_transactions")}
          </AppLink>
        </Stack>
      </Container>
    );
  }

  if (isLoading && !data) {
    return <TransactionDetailSkeleton />;
  }

  if (!data) {
    return <></>;
  }

  const settleDescription = String(
    i18n.t("transaction_detail_page.settle_description", {
      description: data.description,
      month: formatSettleMonth(data.beginDate),
    }),
  );
  const settleAmount = Math.abs(data.amount).toFixed(2);
  const settleSearchParams = new URLSearchParams({
    to_space: data.spaceId,
    description: settleDescription,
    amount: settleAmount,
  });
  const transactionDetailHref = `/transactions/${data.id}`;
  const transferDirectionLabel =
    data.transferSpaceId && data.transferSpaceName
      ? data.amount < 0
        ? i18n.t("transaction_list.to_space", {
            space: data.transferSpaceName,
          })
        : i18n.t("transaction_list.from_space", {
            space: data.transferSpaceName,
          })
      : null;

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon={getTransactionIcon(data.type)}
          title={data.description}
          pattern="transaction_detail"
          actions={[
            {
              icon: "edit",
              ariaLabel: String(
                i18n.t("transaction_detail_page.edit_transaction"),
              ),
              href: `/transactions/${data.id}/edit`,
              variant: "outline",
            },
            {
              icon: "transfer",
              ariaLabel: String(
                i18n.t("transaction_detail_page.settle_transaction"),
              ),
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
              {formatTransactionDate(data.beginDate, data.endDate)}
            </Text>

            <HeroMetrics columns={2}>
              <HeroMetric>
                <Text size="sm" color="hero">
                  {i18n.t("transaction_detail_page.amount")}
                </Text>
                <Currency
                  value={data.amount}
                  size="h3"
                  weight="bold"
                  color="hero"
                />
              </HeroMetric>
              <HeroMetric tone="soft">
                <Text size="sm" color="hero">
                  {i18n.t("transaction_detail_page.type")}
                </Text>
                <Text size="lg" weight="semibold" color="hero">
                  {getTransactionTypeLabel(data.type)}
                </Text>
              </HeroMetric>
            </HeroMetrics>
          </Stack>
        </Hero>

        <DeleteTransactionDialog
          transactionId={data.id}
          isOpen={isDeleteDialogOpen}
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
                    {getTransactionTypeLabel(data.type)}
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
                    {data.spaceName}
                  </Text>
                }
              />
              <DetailRow
                label={
                  <Text size="sm" color="secondary">
                    {i18n.t("transaction_detail_page.amount")}
                  </Text>
                }
                value={<Currency value={data.amount} size="sm" weight="bold" />}
              />
              <DetailRow
                label={
                  <Text size="sm" color="secondary">
                    {i18n.t("transaction_detail_page.date_range")}
                  </Text>
                }
                value={
                  <Text size="sm" weight="semibold">
                    {formatTransactionDate(data.beginDate, data.endDate)}
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
