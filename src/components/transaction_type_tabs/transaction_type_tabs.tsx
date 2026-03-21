import "./transaction_type_tabs.scss";

import React from "react";

import { AppLink } from "@/components/app_link/app_link";
import { Icon, Stack, Text } from "@/elements";

type TransactionPageType = "income" | "expense" | "transfer";

type TransactionTypeTabsProps = {
  activeType: TransactionPageType;
  tabs: Array<{
    key: TransactionPageType;
    href: string;
    label: React.ReactNode;
  }>;
};

export function TransactionTypeTabs({
  activeType,
  tabs,
}: TransactionTypeTabsProps): React.ReactElement {
  return (
    <div className="transaction-type-tabs">
      {tabs.map((tab) => (
        <div
          key={tab.key}
          className={[
            "transaction-type-tabs__tab",
            `transaction-type-tabs__tab--${tab.key}`,
            activeType === tab.key && "transaction-type-tabs__tab--active",
          ]
            .filter(Boolean)
            .join(" ")}
          >
            <AppLink href={tab.href}>
              <span className="transaction-type-tabs__content">
                <Stack direction="row" inline align="center" justify="center" gap={8}>
                  <span className="transaction-type-tabs__icon">
                    <Icon name={tab.key} size={16} />
                  </span>
                  <Text as="span" size="sm" weight="medium">
                    {tab.label}
                  </Text>
                </Stack>
              </span>
            </AppLink>
          </div>
      ))}
    </div>
  );
}
