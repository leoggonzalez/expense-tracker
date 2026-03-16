import "./account_detail_page.scss";

import React from "react";

import type { AccountDetailPageData } from "@/actions/accounts";
import {
  AccountArchiveForm,
  AppLink,
  Avatar,
  Button,
  Container,
  Currency,
  EntryList,
} from "@/components";
import { Card, Icon, Stack, Text } from "@/elements";
import { addMonths, format } from "date-fns";
import { i18n } from "@/model/i18n";

type AccountDetailPageProps = {
  data: AccountDetailPageData;
  onUnarchiveAction: () => Promise<void>;
};

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

export function AccountDetailPage({
  data,
  onUnarchiveAction,
}: AccountDetailPageProps): React.ReactElement {
  const selectedMonthDate = parseMonthKey(data.selectedMonth.key);
  const selectedMonthLabel = formatMonthLabel(selectedMonthDate);
  const previousMonthKey = formatMonthKey(addMonths(selectedMonthDate, -1));
  const nextMonthKey = formatMonthKey(addMonths(selectedMonthDate, 1));

  return (
    <Container>
      <div className="account-detail-page">
        <Stack gap={24}>
          <section className="account-detail-page__hero">
            <div className="account-detail-page__hero-pattern" aria-hidden="true" />
            <div className="account-detail-page__hero-copy">
              <Stack gap={14}>
                <Stack direction="row" align="center" gap={12}>
                  <Avatar name={data.account.name} />
                  <div>
                    <Text
                      as="span"
                      size="sm"
                      color="inverse"
                      weight="medium"
                      transform="uppercase"
                    >
                      {i18n.t("account_detail_page.title")}
                    </Text>
                    <Text as="h1" size="h2" color="inverse" weight="bold">
                      {data.account.name}
                    </Text>
                  </div>
                </Stack>
                <Text as="p" size="sm" color="inverse">
                  {i18n.t("accounts_page.detail_hero_subtitle", {
                    month: selectedMonthLabel,
                  })}
                </Text>
              </Stack>
            </div>

            <div className="account-detail-page__hero-actions">
              <AppLink
                href={`/accounts/${data.account.id}?currentMonth=${previousMonthKey}`}
              >
                <span className="account-detail-page__nav-pill">
                  <Icon name="chevron-left" size={16} />
                  <span>{i18n.t("projection_page.previous_month")}</span>
                </span>
              </AppLink>
              <AppLink
                href={`/accounts/${data.account.id}?currentMonth=${nextMonthKey}`}
              >
                <span className="account-detail-page__nav-pill">
                  <span>{i18n.t("projection_page.next_month")}</span>
                  <Icon name="chevron-right" size={16} />
                </span>
              </AppLink>
              {data.account.isArchived ? null : (
                <form action={`/accounts/${data.account.id}/edit`} method="get">
                  <Button type="submit">
                    {i18n.t("accounts_page.edit_account")}
                  </Button>
                </form>
              )}
            </div>

            <div className="account-detail-page__hero-summary">
              <div className="account-detail-page__hero-stat">
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
              </div>
              <div className="account-detail-page__hero-stat account-detail-page__hero-stat--soft">
                <Text size="sm" color="inverse">
                  {i18n.t("accounts_page.historical_total")}
                </Text>
                <Currency
                  value={data.account.historicalTotal}
                  size="h3"
                  weight="bold"
                />
              </div>
            </div>
          </section>

          <Card padding={24}>
            <Stack gap={18}>
              {data.account.isArchived ? (
                <div className="account-detail-page__status-row">
                  <Stack gap={8}>
                    <Text size="sm" weight="semibold" color="warning">
                      {i18n.t("accounts_page.archived_badge")}
                    </Text>
                    <Text size="sm" color="secondary">
                      {i18n.t("accounts_page.archived_account_hint")}
                    </Text>
                  </Stack>
                  <form action={onUnarchiveAction}>
                    <Button type="submit">
                      {i18n.t("accounts_page.unarchive")}
                    </Button>
                  </form>
                </div>
              ) : data.account.selectedMonthTotal < 0 ? (
                <form
                  action="/entries/new/transfer"
                  method="get"
                  className="account-detail-page__settle-form"
                >
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
                        month: selectedMonthLabel,
                      }),
                    )}
                  />
                  <Text size="sm" color="secondary">
                    {i18n.t("accounts_page.settle_hint")}
                  </Text>
                  <Button type="submit">{i18n.t("accounts_page.settle")}</Button>
                </form>
              ) : (
                <div className="account-detail-page__status-row">
                  <Stack gap={8}>
                    <Text size="sm" weight="semibold">
                      {i18n.t("accounts_page.settle")}
                    </Text>
                    <Text size="sm" color="secondary">
                      {i18n.t("accounts_page.settle_unavailable")}
                    </Text>
                  </Stack>
                  <Button type="button" disabled>
                    {i18n.t("accounts_page.settle")}
                  </Button>
                </div>
              )}
            </Stack>
          </Card>

          <Card
            padding={24}
            title={String(
              i18n.t("accounts_page.month_relevant_entries_label", {
                month: selectedMonthLabel,
              }),
            )}
            icon="entries"
          >
            <Stack gap={20}>
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
            </Stack>
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

          <div className="account-detail-page__footer">
            <AppLink href="/accounts">
              {i18n.t("accounts_page.back_to_accounts")}
            </AppLink>
            {!data.account.isArchived ? (
              <AccountArchiveForm accountId={data.account.id} />
            ) : null}
          </div>
        </Stack>
      </div>
    </Container>
  );
}
