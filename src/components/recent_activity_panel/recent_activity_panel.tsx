import { AppLink, TransactionList, TransactionListItem } from "@/components";
import { Card, Stack, Text } from "@/elements";

import React from "react";
import { i18n } from "@/model/i18n";

type RecentActivityPanelProps = {
  currentMonthRange: {
    startDate: string;
    endDate: string;
  };
  recentTransactions: TransactionListItem[];
};

export function RecentActivityPanel({
  currentMonthRange,
  recentTransactions,
}: RecentActivityPanelProps): React.ReactElement {
  const currentMonthQuery = `start_date=${currentMonthRange.startDate}&end_date=${currentMonthRange.endDate}`;

  return (
    <Card
      as="section"
      padding={24}
      title={String(i18n.t("dashboard.recent_transactions"))}
      icon="activity"
    >
      <Stack gap={20}>
        <Text size="sm" color="secondary">
          {i18n.t("dashboard.activity_subtitle")}
        </Text>
        <Text as="div" size="sm" weight="medium">
          <AppLink href={`/transactions?${currentMonthQuery}`}>
            {i18n.t("dashboard.recent_activity_link")}
          </AppLink>
        </Text>
        <TransactionList
          transactions={recentTransactions}
          showDelete={false}
          transactionHrefBase="/transactions"
        />
      </Stack>
    </Card>
  );
}
