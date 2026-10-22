"use client";

import { SectionError } from "@/components/section_error/section_error";

import type { NewTransactionRecentPayload } from "@/actions/transactions";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import {
  Container,
  LoadingSkeleton,
  NewTransactionRecentTransactions,
} from "@/components";
import { Card, Stack } from "@/elements";
import { subscribeToNewTransactionRecentRefresh } from "@/lib/new_transaction_recent_refresh";
import { i18n } from "@/model/i18n";
import React from "react";

const newTransactionRecentCache = {
  entries: new Map<string, NewTransactionRecentPayload>(),
};

function NewTransactionRecentSkeleton(): React.ReactElement {
  return (
    <Container>
      <Card
        as="section"
        padding={24}
        title={String(i18n.t("new_transaction_page.recent_transactions"))}
        icon="activity"
      >
        <Stack gap={16}>
          <LoadingSkeleton width="100%" height={18} radius={10} />
          <LoadingSkeleton width="100%" height={84} radius={20} />
          <LoadingSkeleton width="100%" height={84} radius={20} />
        </Stack>
      </Card>
    </Container>
  );
}

export function NewTransactionRecentSection(): React.ReactElement {
  const endpoint = "/api/transactions/new/recent";
  const { data, isLoading, hasError, retry } = useProtectedPageSection(
    endpoint,
    endpoint,
    newTransactionRecentCache,
  );

  React.useEffect(() => {
    return subscribeToNewTransactionRecentRefresh(() => {
      retry();
    });
  }, [retry]);

  if (hasError && !data) {
    return (
      <Container>
        <Card
          as="section"
          padding={24}
          title={String(i18n.t("new_transaction_page.recent_transactions"))}
          icon="activity"
        >
          <SectionError
            message={i18n.t("new_transaction_page.recent_load_failed")}
            retryLabel={i18n.t("common.retry")}
            onRetry={retry}
          />
        </Card>
      </Container>
    );
  }

  if (isLoading && !data) {
    return <NewTransactionRecentSkeleton />;
  }

  return (
    <NewTransactionRecentTransactions
      transactions={data?.recentTransactions || []}
    />
  );
}
