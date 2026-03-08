import "./new_entry_page.scss";

import React from "react";

import { AppLink, Container } from "@/components";
import { Card, Grid, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

type NewEntryPageProps = {
  activeTab: "income" | "expense" | "multiple";
  children: React.ReactNode;
};

export function NewEntryPage({
  activeTab,
  children,
}: NewEntryPageProps): React.ReactElement {
  const titleKey =
    activeTab === "income"
      ? "new_entry_page.title_income"
      : activeTab === "expense"
        ? "new_entry_page.title_expense"
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
      key: "multiple",
      href: "/entries/new/multiple",
      label: i18n.t("new_entry_page.multiple_tab"),
    },
  ] as const;

  return (
    <Container>
      <div className="new-entry-page">
        <Stack gap={24}>
          <Text size="h2" as="h1" weight="bold">
            {i18n.t(titleKey)}
          </Text>
          <Grid columns="repeat(3, minmax(0, 1fr))" gap={8}>
            {tabs.map((tab) => (
              <div
                key={tab.key}
                className={[
                  "new-entry-page__tab",
                  `new-entry-page__tab--${tab.key}`,
                  activeTab === tab.key && "new-entry-page__tab--active",
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
          <div className="new-entry-page__panel">
            <Card padding={24}>{children}</Card>
          </div>
        </Stack>
      </div>
    </Container>
  );
}
