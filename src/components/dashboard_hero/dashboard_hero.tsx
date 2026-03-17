import "./dashboard_hero.scss";

import { AppLink, Button, Hero } from "@/components";
import { Icon, Stack, Text } from "@/elements";

import { DashboardTotals } from "@/actions/entries";
import React from "react";
import { formatCurrency } from "@/lib/utils";
import { i18n } from "@/model/i18n";

type DashboardHeroProps = {
  totals: DashboardTotals;
  currentMonthRange: {
    startDate: string;
    endDate: string;
  };
};

export function DashboardHero({
  totals,
  currentMonthRange,
}: DashboardHeroProps): React.ReactElement {
  const currentMonthQuery = `start_date=${currentMonthRange.startDate}&end_date=${currentMonthRange.endDate}`;

  return (
    <Hero
      icon="dashboard"
      title={String(i18n.t("dashboard.hero_label"))}
      pattern="dashboard"
      actions={
          <Button href="/entries/new/expense" >
              <Icon name="plus" size={18} />
              <span>{i18n.t("dashboard.hero_add_action")}</span>
          </Button>
      }
    >
      <div className="dashboard-hero__body">
        <Stack gap={10}>
          <Text as="h1" size="h1" color="inverse" weight="bold">
            {formatCurrency(totals.net)}
          </Text>
          <Text as="p" size="sm" color="secondary">
            {i18n.t("dashboard.hero_caption")}
          </Text>
        </Stack>
        <div className="dashboard-hero__stats">
          <AppLink href={`/entries?${currentMonthQuery}&type=income`}>
            <span className="dashboard-hero__stat-card">
              <Text as="span" size="xs" color="inverse" weight="medium">
                {i18n.t("dashboard.income")}
              </Text>
              <Text as="span" size="lg" color="inverse" weight="semibold">
                {formatCurrency(totals.income)}
              </Text>
            </span>
          </AppLink>
          <AppLink href={`/entries?${currentMonthQuery}&type=expense`}>
            <span className="dashboard-hero__stat-card dashboard-hero__stat-card--soft">
              <Text as="span" size="xs" color="inverse" weight="medium">
                {i18n.t("dashboard.expenses")}
              </Text>
              <Text as="span" size="lg" color="inverse" weight="semibold">
                {formatCurrency(Math.abs(totals.expense))}
              </Text>
            </span>
          </AppLink>
        </div>
      </div>
    </Hero>
  );
}
