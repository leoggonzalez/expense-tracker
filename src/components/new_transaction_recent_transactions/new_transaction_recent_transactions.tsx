import "./new_transaction_recent_transactions.scss";

import { AppLink, Container, TransactionList, TransactionListItem } from "@/components";
import { Card, Stack, Text } from "@/elements";

import React from "react";
import { i18n } from "@/model/i18n";

type NewTransactionRecentTransactionsProps = {
  transactions: TransactionListItem[];
};

export function NewTransactionRecentTransactions({
  transactions,
}: NewTransactionRecentTransactionsProps): React.ReactElement {
  return (
    <Container>
      <div className="new-transaction-recent-transactions">
        <Card
          as="section"
          padding={24}
          title={String(i18n.t("new_transaction_page.recent_transactions"))}
          icon="activity"
        >
          <Stack gap={20}>
            <Stack gap={12}>
              <Text size="sm" color="secondary">
                {i18n.t("new_transaction_page.recent_transactions_subtitle")}
              </Text>
              <div className="new-transaction-recent-transactions__all-link">
                <AppLink href="/transactions">
                  <Text as="span" size="sm" weight="medium" color="info">
                    {i18n.t("new_transaction_page.open_all_transactions")}
                  </Text>
                </AppLink>
              </div>
            </Stack>

            <div className="new-transaction-recent-transactions__list-shell">
              <TransactionList
                transactions={transactions}
                showDelete={false}
                transactionHrefBase="/transactions"
              />
            </div>
          </Stack>
        </Card>
      </div>
    </Container>
  );
}
