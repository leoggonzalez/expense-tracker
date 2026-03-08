"use client";

import "./new_entry_page.scss";

import { AppLink, Container } from "@/components";
import { Card, Grid, Stack, Text } from "@/elements";
import { useAppPreferences } from "@/components/app_preferences_provider/app_preferences_provider";

import React from "react";
import { i18n } from "@/model/i18n";

type NewEntryPageProps = {
  pageType: "income" | "expense" | "transfer" | "multiple";
  children: React.ReactNode;
  showTabs?: boolean;
};

export function NewEntryPage({
  pageType,
  children,
  showTabs = true,
}: NewEntryPageProps): React.ReactElement {
  useAppPreferences();

  const titleKey =
    pageType === "income"
      ? "new_entry_page.title_income"
      : pageType === "expense"
        ? "new_entry_page.title_expense"
        : pageType === "transfer"
          ? "new_entry_page.title_transfer"
          : "new_entry_page.title_multiple";

  const tabs = [
    {
      key: "income",
      href: "/entries/new/income",
      label: i18n.t("new_entry_page.income_tab"),
    },
    {
      key: "expense",
      href: "/entries/new/expense",
      label: i18n.t("new_entry_page.expense_tab"),
    },
    {
      key: "transfer",
      href: "/entries/new/transfer",
      label: i18n.t("new_entry_page.transfer_tab"),
    },
  ] as const;

  return (
    <Container>
      <div className="new-entry-page">
        <Stack gap={24}>
          <Text size="h2" as="h1" weight="bold">
            {i18n.t(titleKey)}
          </Text>
          {showTabs ? (
            <Grid columns="repeat(3, minmax(0, 1fr))" gap={8}>
              {tabs.map((tab) => (
                <div
                  key={tab.key}
                  className={[
                    "new-entry-page__tab",
                    `new-entry-page__tab--${tab.key}`,
                    pageType === tab.key && "new-entry-page__tab--active",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <AppLink href={tab.href}>
                    <span className="new-entry-page__tab-content">
                      {tab.label}
                    </span>
                  </AppLink>
                </div>
              ))}
            </Grid>
          ) : null}
          <div className="new-entry-page__panel">
            <Card padding={24}>{children}</Card>
          </div>
        </Stack>
      </div>
    </Container>
  );
}
