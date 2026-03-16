import "./accounts_page.scss";

import React from "react";

import type { AccountCurrentMonthSummary } from "@/actions/accounts";
import { AccountCard } from "@/components/account_card/account_card";
import { AppLink, Button, Hero } from "@/components";
import { Card, Icon, Stack, Text } from "@/elements";
import { addMonths, format } from "date-fns";
import { i18n } from "@/model/i18n";

type AccountsPageProps = {
  accounts: AccountCurrentMonthSummary[];
  selectedMonthStart: Date;
};

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat(i18n.locale || "en", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatMonthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

export function AccountsPage({
  accounts,
  selectedMonthStart,
}: AccountsPageProps): React.ReactElement {
  const selectedMonthLabel = formatMonthLabel(selectedMonthStart);
  const previousMonthKey = formatMonthKey(addMonths(selectedMonthStart, -1));
  const nextMonthKey = formatMonthKey(addMonths(selectedMonthStart, 1));

  return (
    <div className="accounts-page">
      <Stack gap={24}>
        <Hero
          icon="accounts"
          title={String(i18n.t("accounts_page.title"))}
          pattern="accounts"
          actions={
            <>
              <AppLink href={`/accounts?currentMonth=${previousMonthKey}`}>
                <span className="accounts-page__nav-pill">
                  <Icon name="chevron-left" size={16} />
                  <span>{i18n.t("projection_page.previous_month")}</span>
                </span>
              </AppLink>
              <AppLink href={`/accounts?currentMonth=${nextMonthKey}`}>
                <span className="accounts-page__nav-pill">
                  <span>{i18n.t("projection_page.next_month")}</span>
                  <Icon name="chevron-right" size={16} />
                </span>
              </AppLink>
              <form action="/accounts/new" method="get">
                <Button type="submit" startIcon={<Icon name="plus" />}>
                  {i18n.t("accounts_page.create_account")}
                </Button>
              </form>
            </>
          }
        >
          <div className="accounts-page__hero-body">
            <Stack gap={10}>
              <Text as="h1" size="h1" color="inverse" weight="bold">
                {selectedMonthLabel}
              </Text>
              <Text as="p" size="sm" color="inverse">
                {i18n.t("accounts_page.hero_subtitle")}
              </Text>
            </Stack>

            <div className="accounts-page__hero-summary">
              <div className="accounts-page__hero-stat">
                <Text size="sm" color="inverse">
                  {i18n.t("accounts_page.active_accounts_label")}
                </Text>
                <Text size="h3" weight="bold" color="inverse">
                  {String(accounts.length)}
                </Text>
              </div>
              <div className="accounts-page__hero-stat accounts-page__hero-stat--soft">
                <Text size="sm" color="inverse">
                  {i18n.t("accounts_page.month_total_overview")}
                </Text>
                <Text size="lg" weight="semibold" color="inverse">
                  {selectedMonthLabel}
                </Text>
              </div>
            </div>
          </div>
        </Hero>

        {accounts.length === 0 ? (
          <Card padding={24} variant="dashed">
            <Text color="secondary">{i18n.t("accounts_page.empty_state")}</Text>
          </Card>
        ) : (
          <div className="accounts-page__grid">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                id={account.id}
                name={account.name}
                currentMonthTotal={account.currentMonthTotal}
                monthLabel={selectedMonthLabel}
              />
            ))}
          </div>
        )}

        <div className="accounts-page__footer-link">
          <AppLink href="/accounts/archived">
            {i18n.t("accounts_page.archived_accounts")}
          </AppLink>
        </div>
      </Stack>
    </div>
  );
}
