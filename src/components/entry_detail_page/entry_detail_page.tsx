"use client";

import "./entry_detail_page.scss";

import {
  AppLink,
  Button,
  Container,
  Currency,
  useAppPreferences,
  useNavigationProgress,
} from "@/components";
import React, { useState } from "react";
import { deleteEntry } from "@/actions/entries";
import { Card, Icon, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

type EntryDetailPageProps = {
  entry: {
    id: string;
    type: string;
    accountId: string;
    accountName: string;
    transferAccountId: string | null;
    transferAccountName: string | null;
    description: string;
    amount: number;
    beginDate: string;
    endDate: string | null;
  };
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

export function EntryDetailPage({
  entry,
}: EntryDetailPageProps): React.ReactElement {
  useAppPreferences();

  const { push } = useNavigationProgress();
  const [deleting, setDeleting] = useState(false);
  const settleDescription = String(
    i18n.t("entry_detail_page.settle_description", {
      description: entry.description,
      month: formatSettleMonth(entry.beginDate),
    }),
  );
  const settleAmount = Math.abs(entry.amount).toFixed(2);
  const transferDirectionLabel =
    entry.transferAccountId && entry.transferAccountName
      ? entry.amount < 0
        ? i18n.t("entry_list.to_account", {
            account: entry.transferAccountName,
          })
        : i18n.t("entry_list.from_account", {
            account: entry.transferAccountName,
          })
      : null;

  const handleDelete = async (): Promise<void> => {
    if (!confirm(i18n.t("entry_detail_page.delete_confirm") as string)) {
      return;
    }

    setDeleting(true);
    const result = await deleteEntry(entry.id);

    if (!result.success) {
      setDeleting(false);
      return;
    }

    push("/entries");
  };

  return (
    <Container>
      <div className="entry-detail-page">
        <Stack gap={24}>
          <section className="entry-detail-page__hero">
            <div className="entry-detail-page__hero-pattern" aria-hidden="true" />

            <div className="entry-detail-page__hero-copy">
              <Stack gap={10}>
                <span className="entry-detail-page__hero-icon">
                  <Icon name={getEntryIcon(entry.type)} size={20} />
                </span>
                <Text
                  as="span"
                  size="sm"
                  color="inverse"
                  weight="medium"
                  transform="uppercase"
                >
                  {i18n.t("entry_detail_page.title")}
                </Text>
                <Text as="h1" size="h1" color="inverse" weight="bold">
                  {entry.description}
                </Text>
                <Text as="p" size="sm" color="inverse">
                  {formatEntryDate(entry.beginDate, entry.endDate)}
                </Text>
              </Stack>
            </div>

            <div className="entry-detail-page__hero-actions">
              <AppLink href={`/entries/${entry.id}/edit`}>
                <span className="entry-detail-page__nav-pill">
                  <Icon name="edit" size={16} />
                  <span>{i18n.t("entry_detail_page.edit_entry")}</span>
                </span>
              </AppLink>
            </div>

            <div className="entry-detail-page__hero-summary">
              <div className="entry-detail-page__hero-stat">
                <Text size="sm" color="inverse">
                  {i18n.t("entry_detail_page.type")}
                </Text>
                <Text size="lg" weight="semibold" color="inverse">
                  {getEntryTypeLabel(entry.type)}
                </Text>
              </div>
              <div className="entry-detail-page__hero-stat entry-detail-page__hero-stat--soft">
                <Text size="sm" color="inverse">
                  {i18n.t("entry_detail_page.amount")}
                </Text>
                <Currency value={entry.amount} size="h3" weight="bold" />
              </div>
            </div>
          </section>

          <Card padding={24} title={String(i18n.t("entry_detail_page.title"))} icon="entries">
            <Stack gap={20}>
              <div className="entry-detail-page__details">
                <div className="entry-detail-page__row">
                  <Text size="sm" color="secondary">
                    {i18n.t("entry_detail_page.type")}
                  </Text>
                  <Text size="sm" weight="semibold">
                    {getEntryTypeLabel(entry.type)}
                  </Text>
                </div>
                <div className="entry-detail-page__row">
                  <Text size="sm" color="secondary">
                    {i18n.t("entry_detail_page.account")}
                  </Text>
                  <Text size="sm" weight="semibold">
                    {entry.accountName}
                  </Text>
                </div>
                <div className="entry-detail-page__row">
                  <Text size="sm" color="secondary">
                    {i18n.t("entry_detail_page.amount")}
                  </Text>
                  <Currency value={entry.amount} size="sm" weight="bold" />
                </div>
                <div className="entry-detail-page__row">
                  <Text size="sm" color="secondary">
                    {i18n.t("entry_detail_page.date_range")}
                  </Text>
                  <Text size="sm" weight="semibold">
                    {formatEntryDate(entry.beginDate, entry.endDate)}
                  </Text>
                </div>
                {transferDirectionLabel ? (
                  <div className="entry-detail-page__row">
                    <Text size="sm" color="secondary">
                      {i18n.t("entry_detail_page.transfer")}
                    </Text>
                    <Text size="sm" weight="semibold">
                      {transferDirectionLabel}
                    </Text>
                  </div>
                ) : null}
              </div>

              <form action="/entries/new/transfer" method="get">
                <input type="hidden" name="to_account" value={entry.accountId} />
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

          <Card padding={24}>
            <Stack gap={16}>
              <Text size="sm" color="secondary">
                {i18n.t("entry_detail_page.delete_confirm")}
              </Text>
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={deleting}
                fullWidth
              >
                {deleting
                  ? i18n.t("entry_detail_page.deleting")
                  : i18n.t("entry_detail_page.delete")}
              </Button>
            </Stack>
          </Card>

          <div className="entry-detail-page__back-link">
            <AppLink href="/entries">
              {i18n.t("entry_detail_page.back_to_entries")}
            </AppLink>
          </div>
        </Stack>
      </div>
    </Container>
  );
}
