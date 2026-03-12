"use client";

import "./entry_detail_page.scss";

import {
  AppLink,
  Button,
  Container,
  Currency,
  useNavigationProgress,
} from "@/components";
import React, { useState } from "react";
import { deleteEntry } from "@/actions/entries";
import { Card, Stack, Text } from "@/elements";
import { format } from "date-fns";
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
  const formattedBegin = format(new Date(beginDate), "MMM dd, yyyy");

  if (!endDate) {
    return formattedBegin;
  }

  const beginTime = new Date(beginDate).getTime();
  const endTime = new Date(endDate).getTime();

  if (beginTime === endTime) {
    return formattedBegin;
  }

  return `${formattedBegin} - ${format(new Date(endDate), "MMM dd, yyyy")}`;
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

export function EntryDetailPage({
  entry,
}: EntryDetailPageProps): React.ReactElement {
  const { push } = useNavigationProgress();
  const [deleting, setDeleting] = useState(false);
  const settleDescription = String(
    i18n.t("entry_detail_page.settle_description", {
      description: entry.description,
      month: format(new Date(entry.beginDate), "MMMM yyyy"),
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

  const handleDelete = async () => {
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
          <Stack
            direction="row"
            align="center"
            justify="space-between"
            gap={12}
          >
            <Text size="h2" as="h1" weight="bold">
              {entry.description}
            </Text>
            <AppLink href={`/entries/${entry.id}/edit`}>
              {i18n.t("entry_detail_page.edit_entry")}
            </AppLink>
          </Stack>

          <div className="entry-detail-page__card">
            <Card padding={24}>
              <Stack gap={16}>
                <Stack gap={8}>
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
                </Stack>
                <form action="/entries/new/transfer" method="get">
                  <input
                    type="hidden"
                    name="to_account"
                    value={entry.accountId}
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
          </div>

          <div className="entry-detail-page__danger">
            <Card padding={24}>
              <Stack gap={12}>
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
          </div>
          <AppLink href="/entries">
            {i18n.t("entry_detail_page.back_to_entries")}
          </AppLink>
        </Stack>
      </div>
    </Container>
  );
}
