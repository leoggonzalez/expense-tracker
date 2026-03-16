"use client";

import "./projection_page.scss";

import React from "react";

import type { ProjectionPagePayload } from "@/actions/entries";
import {
  AppLink,
  Currency,
  EntryList,
  ProjectionChart,
  useAppPreferences,
} from "@/components";
import { Card, Icon, Stack, Text } from "@/elements";
import { formatCurrency } from "@/lib/utils";
import { i18n } from "@/model/i18n";

type ProjectionPageProps = {
  payload: ProjectionPagePayload;
};

function formatMonthKey(
  monthKey: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const locale = i18n.locale || "en";
  const date = new Date(`${monthKey}-01T00:00:00`);

  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function ProjectionPage({
  payload,
}: ProjectionPageProps): React.ReactElement {
  useAppPreferences();

  const focusedMonthLabel = formatMonthKey(payload.focusedMonth.key, {
    month: "long",
    year: "numeric",
  });

  const chartData = payload.chartMonths.map((month) => ({
    monthLabel: formatMonthKey(month.monthKey, {
      month: "short",
      year: "numeric",
    }),
    income: month.income,
    expenses: Math.abs(month.expense),
  }));

  return (
    <div className="projection-page">
      <Stack gap={24}>
        <section className="projection-page__hero">
          <div className="projection-page__hero-pattern" aria-hidden="true" />
          <div className="projection-page__hero-copy">
            <Stack gap={10}>
              <Text
                as="span"
                size="sm"
                color="inverse"
                weight="medium"
                transform="uppercase"
              >
                {i18n.t("projection_page.title")}
              </Text>
              <Text as="h1" size="h1" color="inverse" weight="bold">
                {focusedMonthLabel}
              </Text>
              <Text as="p" size="sm" color="inverse">
                {i18n.t("projection_page.subtitle")}
              </Text>
            </Stack>
          </div>

          <div className="projection-page__hero-actions">
            <AppLink href={`/projection?month=${payload.previousMonthKey}`}>
              <span className="projection-page__nav-pill">
                <Icon name="chevron-left" size={16} />
                <span>{i18n.t("projection_page.previous_month")}</span>
              </span>
            </AppLink>
            <AppLink href={`/projection?month=${payload.nextMonthKey}`}>
              <span className="projection-page__nav-pill">
                <span>{i18n.t("projection_page.next_month")}</span>
                <Icon name="chevron-right" size={16} />
              </span>
            </AppLink>
          </div>

          <div className="projection-page__hero-summary">
            <div className="projection-page__hero-stat">
              <Text as="span" size="xs" color="inverse" weight="medium">
                {i18n.t("projection_page.income")}
              </Text>
              <Text as="span" size="lg" color="inverse" weight="semibold">
                {formatCurrency(payload.focusedMonthTotals.income)}
              </Text>
            </div>
            <div className="projection-page__hero-stat projection-page__hero-stat--soft">
              <Text as="span" size="xs" color="inverse" weight="medium">
                {i18n.t("projection_page.expenses")}
              </Text>
              <Text as="span" size="lg" color="inverse" weight="semibold">
                {formatCurrency(Math.abs(payload.focusedMonthTotals.expense))}
              </Text>
            </div>
            <div className="projection-page__hero-stat projection-page__hero-stat--soft">
              <Text as="span" size="xs" color="inverse" weight="medium">
                {i18n.t("projection_page.total")}
              </Text>
              <Currency
                value={payload.focusedMonthTotals.net}
                size="lg"
                weight="semibold"
                as="span"
              />
            </div>
          </div>
        </section>

        <div className="projection-page__insights">
          <Card
            as="section"
            padding={24}
            title={String(i18n.t("projection_page.chart_title"))}
            icon="projection"
          >
            <ProjectionChart data={chartData} />
          </Card>
        </div>

        <section className="projection-page__accounts">
          <Stack gap={16}>
            <Text size="h4" as="h3" weight="semibold">
              {i18n.t("projection_page.accounts_with_entries")}
            </Text>

            {payload.focusedMonthAccounts.length === 0 ? (
              <Card padding={24} variant="dashed">
                <Text color="secondary">
                  {i18n.t("projection_page.empty_month_entries")}
                </Text>
              </Card>
            ) : (
              <div className="projection-page__accounts-grid">
                {payload.focusedMonthAccounts.map((account) => {
                  const hiddenEntriesCount = Math.max(
                    0,
                    account.monthEntryCount - account.entries.length,
                  );

                  const accountMonthHref = `/accounts/${account.accountId}?currentMonth=${payload.focusedMonth.key}`;

                  return (
                    <Card
                      key={account.accountId}
                      as="section"
                      padding={24}
                      title={account.accountName}
                      icon="accounts"
                    >
                      <Stack gap={20}>
                        <div className="projection-page__account-meta">
                          <div className="projection-page__section-link">
                            <AppLink href={accountMonthHref}>
                              {i18n.t("projection_page.open_account")}
                            </AppLink>
                          </div>
                          <Currency
                            value={account.monthTotal}
                            size="xl"
                            weight="bold"
                            as="span"
                          />
                        </div>

                        <EntryList
                          entries={account.entries}
                          showDelete={false}
                          entryHrefBase="/entries"
                          summaryRows={[
                            ...(hiddenEntriesCount > 0
                              ? [
                                  {
                                    id: `more-${account.accountId}`,
                                    label: i18n.t(
                                      "projection_page.more_entries_this_month",
                                      {
                                        count: hiddenEntriesCount,
                                      },
                                    ) as string,
                                    href: accountMonthHref,
                                  },
                                ]
                              : []),
                            {
                              id: `total-${account.accountId}`,
                              label: i18n.t(
                                "projection_page.account_month_total",
                              ),
                              value: (
                                <Currency
                                  value={account.monthTotal}
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
                  );
                })}
              </div>
            )}
          </Stack>
        </section>
      </Stack>
    </div>
  );
}
