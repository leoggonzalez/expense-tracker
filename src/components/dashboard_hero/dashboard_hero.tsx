import "./dashboard_hero.scss";

import { AppLink, Hero } from "@/components";
import { Box, Grid, Stack, Text } from "@/elements";

import { DashboardTotals } from "@/actions/transactions";
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
      actions={[
        {
          icon: "plus",
          title: String(i18n.t("dashboard.hero_add_action")),
          ariaLabel: String(i18n.t("dashboard.hero_add_action")),
          href: "/transactions/new/expense",
          variant: "primary",
        },
      ]}
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
        <Grid minColumnWidth={220} gap={12}>
          <AppLink href={`/transactions?${currentMonthQuery}&type=income`}>
            <span className="dashboard-hero__stat-card">
              <Box
                padding={{
                  paddingTop: 18,
                  paddingRight: 20,
                  paddingBottom: 18,
                  paddingLeft: 20,
                }}
              >
                <Stack gap={6}>
                  <Text as="span" size="xs" color="inverse" weight="medium">
                    {i18n.t("dashboard.income")}
                  </Text>
                  <Text as="span" size="lg" color="inverse" weight="semibold">
                    {formatCurrency(totals.income)}
                  </Text>
                </Stack>
              </Box>
            </span>
          </AppLink>
          <AppLink href={`/transactions?${currentMonthQuery}&type=expense`}>
            <span className="dashboard-hero__stat-card dashboard-hero__stat-card--soft">
              <Box
                padding={{
                  paddingTop: 18,
                  paddingRight: 20,
                  paddingBottom: 18,
                  paddingLeft: 20,
                }}
              >
                <Stack gap={6}>
                  <Text as="span" size="xs" color="inverse" weight="medium">
                    {i18n.t("dashboard.expenses")}
                  </Text>
                  <Text as="span" size="lg" color="inverse" weight="semibold">
                    {formatCurrency(Math.abs(totals.expense))}
                  </Text>
                </Stack>
              </Box>
            </span>
          </AppLink>
        </Grid>
      </div>
    </Hero>
  );
}
