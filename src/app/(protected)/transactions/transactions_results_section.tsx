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
            spaces={data?.spaces || []}
            filters={filters}
          />

          <Text size="sm" color="secondary">
            {i18n.t("transactions_page.showing_results", {
              count: data?.transactions.length || 0,
              total: data?.pagination.total || 0,
            })}
          </Text>

          <TransactionsTable transactions={data?.transactions || []} />

          {data && data.pagination.page < data.pagination.totalPages ? (
            <form method="get">
              {filters.space ? (
                <input type="hidden" name="space" value={filters.space} />
              ) : null}
              {filters.type ? (
                <input type="hidden" name="type" value={filters.type} />
              ) : null}
              {filters.startDate ? (
                <input
                  type="hidden"
                  name="start_date"
                  value={filters.startDate}
                />
              ) : null}
              {filters.endDate ? (
                <input type="hidden" name="end_date" value={filters.endDate} />
              ) : null}
              {filters.searchTerms.map((searchTerm) => (
                <input
                  key={searchTerm}
                  type="hidden"
                  name="search"
                  value={searchTerm}
                />
              ))}
              <input
                type="hidden"
                name="page"
                value={String(data.pagination.page + 1)}
              />
              <Button type="submit">
                {i18n.t("transactions_page.load_more_transactions")}
              </Button>
            </form>
          ) : null}
        </Stack>
      )}
    </Card>
  );
}
