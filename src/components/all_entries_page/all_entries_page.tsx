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
import { Card, Grid, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export type AllEntriesPageProps = {
  accounts: Array<{ id: string; name: string }>;
  entries: EntryListItem[];
  filters: {
    accountId: string;
    description: string;
    startDate: string;
    endDate: string;
  };
  loading?: boolean;
  pagination: {
    page: number;
    total: number;
    totalPages: number;
  };
  onAccountChange: (accountId: string) => void;
  onDescriptionChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
};

export function AllEntriesPage({
  accounts,
  entries,
  filters,
  loading = false,
  pagination,
  onAccountChange,
  onDescriptionChange,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  onPageChange,
}: AllEntriesPageProps): React.ReactElement {
  const selectedAccountName =
    accounts.find((account) => account.id === filters.accountId)?.name || "";

  return (
    <Container>
      <Stack gap={32}>
        <Text size="h2" as="h2" weight="bold">
          {i18n.t("all_entries_page.title")}
        </Text>

        <Card
          padding={24}
          variant="secondary"
          className="all-entries-page__filters"
        >
          <Text size="h4" as="h3" weight="semibold">
            {i18n.t("all_entries_page.filters")}
          </Text>
          <Grid
            className="all-entries-page__filter-grid"
            columns="repeat(auto-fit, minmax(200px, 1fr))"
            gap={16}
          >
            <Autocomplete
              label={i18n.t("all_entries_page.account")}
              value={selectedAccountName}
              onChange={(name) => {
                const account = accounts.find((item) => item.name === name);
                onAccountChange(account?.id || "");
              }}
              options={accounts.map((account) => account.name)}
              placeholder={
                i18n.t("all_entries_page.account_placeholder") as string
              }
            />

            <Input
              label={i18n.t("all_entries_page.description")}
              value={filters.description}
              onChange={onDescriptionChange}
              placeholder={
                i18n.t("all_entries_page.description_placeholder") as string
              }
            />

            <Input
              label={i18n.t("all_entries_page.start_date")}
              type="date"
              value={filters.startDate}
              onChange={onStartDateChange}
            />

            <Input
              label={i18n.t("all_entries_page.end_date")}
              type="date"
              value={filters.endDate}
              onChange={onEndDateChange}
            />
          </Grid>

          <Button onClick={onClearFilters} variant="secondary" size="sm">
            {i18n.t("all_entries_page.clear_filters")}
          </Button>
        </Card>

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
                  onPageChange={onPageChange}
                />
              )}
            </>
          )}
        </div>
      </Stack>
    </Container>
  );
}
