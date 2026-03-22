"use client";

import type { TransactionsPagePayload } from "@/actions/transactions";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import {
  Button,
  LoadingSkeleton,
  TransactionsFilters,
  TransactionsTable,
} from "@/components";
import { Card, Stack, Text } from "@/elements";
import type { NormalizedTransactionsFilters } from "@/lib/transactions_search";
import { buildTransactionsFiltersQuery } from "@/lib/transactions_search";
import { i18n } from "@/model/i18n";
import React from "react";

const transactionsResultsCache = {
  entries: new Map<string, TransactionsPagePayload>(),
};

type TransactionsResultsSectionProps = {
  filters: NormalizedTransactionsFilters;
};

function TransactionsResultsSkeleton(): React.ReactElement {
  return (
    <Stack gap={16}>
      <LoadingSkeleton width="100%" height={52} radius={20} />
      <LoadingSkeleton width="180px" height={18} radius={10} />
      <LoadingSkeleton width="100%" height={84} radius={20} />
      <LoadingSkeleton width="100%" height={84} radius={20} />
      <LoadingSkeleton width="100%" height={84} radius={20} />
    </Stack>
  );
}

export function TransactionsResultsSection({
  filters,
}: TransactionsResultsSectionProps): React.ReactElement {
  const queryString = buildTransactionsFiltersQuery(filters);
  const endpoint = queryString
    ? `/api/transactions/list?${queryString}`
    : "/api/transactions/list";
  const { data, isLoading, hasError, retry } = useProtectedPageSection(
    endpoint,
    endpoint,
    transactionsResultsCache,
  );
  const [visibleData, setVisibleData] = React.useState<TransactionsPagePayload | null>(
    null,
  );
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  React.useEffect(() => {
    setVisibleData(data);
  }, [data]);

  const handleLoadMore = async (): Promise<void> => {
    if (!visibleData || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const nextFilters = {
        ...filters,
        page: visibleData.pagination.page + 1,
      };
      const nextQueryString = buildTransactionsFiltersQuery(nextFilters);
      const response = await fetch(`/api/transactions/list?${nextQueryString}`, {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("transactions_load_more_failed");
      }

      const nextPayload = (await response.json()) as TransactionsPagePayload;
      setVisibleData((current) => {
        if (!current) {
          return nextPayload;
        }

        const seenIds = new Set(current.transactions.map((transaction) => transaction.id));
        const appendedTransactions = nextPayload.transactions.filter(
          (transaction) => !seenIds.has(transaction.id),
        );

        return {
          ...nextPayload,
          transactions: [...current.transactions, ...appendedTransactions],
        };
      });
    } finally {
      setIsLoadingMore(false);
    }
  };
  const currentData = visibleData || data;

  return (
    <Card
      as="section"
      padding={24}
      title={String(i18n.t("transactions_page.results_title"))}
      icon="activity"
    >
      {hasError && !data ? (
        <Stack gap={12} align="flex-start">
          <Text color="secondary">
            {i18n.t("transactions_page.results_load_failed")}
          </Text>
          <Button variant="secondary" size="sm" onClick={retry}>
            {i18n.t("common.retry")}
          </Button>
        </Stack>
      ) : isLoading && !data ? (
        <TransactionsResultsSkeleton />
      ) : (
        <Stack gap={20}>
          <TransactionsFilters
            spaces={currentData?.spaces || []}
            filters={filters}
          />

          <Text size="sm" color="secondary">
            {i18n.t("transactions_page.showing_results", {
              count: currentData?.transactions.length || 0,
              total: currentData?.pagination.total || 0,
            })}
          </Text>

          <TransactionsTable transactions={currentData?.transactions || []} />

          {currentData &&
          currentData.pagination.page < currentData.pagination.totalPages ? (
            <Button onClick={() => void handleLoadMore()} disabled={isLoadingMore}>
              {isLoadingMore
                ? i18n.t("common.loading")
                : i18n.t("transactions_page.load_more_transactions")}
            </Button>
          ) : null}
        </Stack>
      )}
    </Card>
  );
}
