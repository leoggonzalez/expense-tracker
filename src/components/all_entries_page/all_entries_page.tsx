"use client";

import "./all_entries_page.scss";

import {
  Autocomplete,
  Button,
  Container,
  Input,
  Pagination,
} from "@/components";
import { EntryList, EntryListItem } from "@/components/entry_list/entry_list";
import { Stack, Text } from "@/elements";
import { getEntriesWithFilters, getAccounts } from "@/actions/entries";
import { i18n } from "@/model/i18n";
import React, { useEffect, useState } from "react";

export function AllEntriesPage(): React.ReactElement {
  const [entries, setEntries] = useState<EntryListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    accountId: "",
    description: "",
    startDate: "",
    endDate: "",
  });
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAccounts() {
      const accountsData = await getAccounts();
      setAccounts(accountsData);
    }

    void fetchAccounts();
  }, []);

  useEffect(() => {
    async function fetchEntries() {
      setLoading(true);
      const result = await getEntriesWithFilters({
        accountId: filters.accountId,
        description: filters.description,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        page: pagination.page,
        limit: 20,
      });

      const mappedEntries: EntryListItem[] = result.entries.map((entry) => ({
        id: entry.id,
        type: entry.type,
        accountName: entry.account.name,
        description: entry.description,
        amount: entry.amount,
        beginDate: entry.beginDate.toISOString(),
        endDate: entry.endDate?.toISOString() || null,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      }));

      setEntries(mappedEntries);
      setPagination(result.pagination);
      setLoading(false);
    }

    fetchEntries();
  }, [filters, pagination.page]);

  function handleFilterChange(key: string, value: string) {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
    setPagination((currentPagination) => ({ ...currentPagination, page: 1 }));
  }

  function handleClearFilters() {
    setFilters({
      accountId: "",
      description: "",
      startDate: "",
      endDate: "",
    });
    setPagination((currentPagination) => ({ ...currentPagination, page: 1 }));
  }

  const selectedAccountName =
    accounts.find((account) => account.id === filters.accountId)?.name || "";

  return (
    <Container>
      <Stack gap={32}>
        <Text size="h2" as="h2" weight="bold">
          {i18n.t("all_entries_page.title")}
        </Text>

        <div className="all-entries-page__filters">
          <Text size="h4" as="h3" weight="semibold">
            {i18n.t("all_entries_page.filters")}
          </Text>
          <div className="all-entries-page__filter-grid">
            <Autocomplete
              label={i18n.t("all_entries_page.account")}
              value={selectedAccountName}
              onChange={(name) => {
                const account = accounts.find((item) => item.name === name);
                handleFilterChange("accountId", account?.id || "");
              }}
              options={accounts.map((account) => account.name)}
              placeholder={
                i18n.t("all_entries_page.account_placeholder") as string
              }
            />

            <Input
              label={i18n.t("all_entries_page.description")}
              value={filters.description}
              onChange={(value) => handleFilterChange("description", value)}
              placeholder={
                i18n.t("all_entries_page.description_placeholder") as string
              }
            />

            <Input
              label={i18n.t("all_entries_page.start_date")}
              type="date"
              value={filters.startDate}
              onChange={(value) => handleFilterChange("startDate", value)}
            />

            <Input
              label={i18n.t("all_entries_page.end_date")}
              type="date"
              value={filters.endDate}
              onChange={(value) => handleFilterChange("endDate", value)}
            />
          </div>

          <Button onClick={handleClearFilters} variant="secondary" size="sm">
            {i18n.t("all_entries_page.clear_filters")}
          </Button>
        </div>

        <div>
          <div className="all-entries-page__results-header">
            <Text size="md" color="secondary">
              {loading
                ? i18n.t("all_entries_page.loading")
                : i18n.t("all_entries_page.showing_results", {
                    count: entries.length,
                    total: pagination.total,
                  })}
            </Text>
          </div>

          {loading ? (
            <div className="all-entries-page__loading">
              <Text color="secondary">
                {i18n.t("all_entries_page.loading_entries")}
              </Text>
            </div>
          ) : (
            <>
              <EntryList entries={entries} />

              {pagination.totalPages > 1 && (
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) =>
                    setPagination((currentPagination) => ({
                      ...currentPagination,
                      page,
                    }))
                  }
                />
              )}
            </>
          )}
        </div>
      </Stack>
    </Container>
  );
}
