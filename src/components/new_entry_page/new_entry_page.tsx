"use client";

import "./new_entry_page.scss";

import { AppLink, Hero } from "@/components";
import { useAppPreferences } from "@/components/app_preferences_provider/app_preferences_provider";
import { Card, Grid, Icon, Stack, Text } from "@/elements";
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
  const subtitleKey =
    pageType === "income"
      ? "new_entry_page.subtitle_income"
      : pageType === "expense"
        ? "new_entry_page.subtitle_expense"
        : pageType === "transfer"
          ? "new_entry_page.subtitle_transfer"
          : "new_entry_page.subtitle_multiple";
  const pageIcon =
    pageType === "income"
      ? "income"
      : pageType === "expense"
        ? "expense"
        : pageType === "transfer"
          ? "transfer"
          : "entries";

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
    <div className="new-entry-page">
      <Stack gap={24}>
        <Hero
          icon={pageIcon}
          title={String(i18n.t(titleKey))}
          pattern="new_entry"
        >
          <div className="new-entry-page__hero-body">
            <div className="new-entry-page__eyebrow">
              <Text size="sm" as="p" weight="semibold" color="inverse">
                {i18n.t("navigation.entries")}
              </Text>
            </div>
            <Text size="sm" as="p" color="inverse">
              {i18n.t(subtitleKey)}
            </Text>

            <div className="new-entry-page__hero-summary">
              <Grid columns="repeat(2, minmax(0, 1fr))" gap={12}>
                <div className="new-entry-page__hero-metric">
                  <Stack gap={4}>
                    <Text size="xs" weight="semibold" color="inverse">
                      {i18n.t("common.income")}
                    </Text>
                    <Text size="lg" weight="semibold" color="inverse">
                      {i18n.t("new_entry_page.income_tab")}
                    </Text>
                  </Stack>
                </div>
                <div className="new-entry-page__hero-metric">
                  <Stack gap={4}>
                    <Text size="xs" weight="semibold" color="inverse">
                      {i18n.t("common.expense")}
                    </Text>
                    <Text size="lg" weight="semibold" color="inverse">
                      {pageType === "transfer"
                        ? i18n.t("new_entry_page.transfer_tab")
                        : i18n.t("entry_form.schedule_label")}
                    </Text>
                  </Stack>
                </div>
              </Grid>
            </div>
          </div>
        </Hero>

        {showTabs ? (
          <div className="new-entry-page__tabs">
            <Grid columns="repeat(3, minmax(0, 1fr))" gap={10}>
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
                      <span className="new-entry-page__tab-icon">
                        <Icon
                          name={
                            tab.key === "income"
                              ? "income"
                              : tab.key === "expense"
                                ? "expense"
                                : "transfer"
                          }
                          size={16}
                        />
                      </span>
                      {tab.label}
                    </span>
                  </AppLink>
                </div>
              ))}
            </Grid>
          </div>
        ) : null}

        <div className="new-entry-page__panel">
          <Card padding={24}>{children}</Card>
        </div>
      </Stack>
    </div>
  );
}
