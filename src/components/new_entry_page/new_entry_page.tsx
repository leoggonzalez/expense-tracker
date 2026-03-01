import "./new_entry_page.scss";

import Link from "next/link";
import React from "react";

import { Container } from "@/components";
import { Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

type NewEntryPageProps = {
  activeTab: "income" | "expense" | "multiple";
  children: React.ReactNode;
};

export function NewEntryPage({
  activeTab,
  children,
}: NewEntryPageProps): React.ReactElement {
  const tabs = [
    { key: "income", href: "/entries/new/income", label: i18n.t("new_entry_page.income_tab") },
    { key: "expense", href: "/entries/new/expense", label: i18n.t("new_entry_page.expense_tab") },
    { key: "multiple", href: "/entries/new/multiple", label: i18n.t("new_entry_page.multiple_tab") },
  ] as const;

  return (
    <Container>
      <div className="new-entry-page">
        <Stack gap={24}>
          <Text size="h2" as="h1" weight="bold">
            {i18n.t("new_entry_page.title")}
          </Text>
          <div className="new-entry-page__tabs">
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                href={tab.href}
                className={`new-entry-page__tab ${
                  activeTab === tab.key ? "new-entry-page__tab--active" : ""
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
          <div className="new-entry-page__panel">{children}</div>
        </Stack>
      </div>
    </Container>
  );
}
