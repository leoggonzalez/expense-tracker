"use client";

import "./entries_page.scss";

import React from "react";

import {
  AppLink,
  EntriesFilters,
  EntriesPagination,
  EntriesTable,
  useAppPreferences,
} from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

type EntriesPageProps = {
  accounts: Array<{
    id: string;
    name: string;
  }>;
  entriesData: {
    entries: Array<{
      id: string;
      type: "income" | "expense";
      transferAccountId: string | null;
      transferAccountName: string | null;
      accountName: string;
      description: string;
      amount: number;
      beginDate: string;
      endDate: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  filters: {
    account: string;
    type: string;
    startDate: string;
    endDate: string;
  };
};

export function EntriesPage({
  accounts,
  entriesData,
  filters,
}: EntriesPageProps): React.ReactElement {
  useAppPreferences();

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="entries-page">
      <Stack gap={24}>
        <section className="entries-page__hero">
          <div className="entries-page__hero-pattern" aria-hidden="true" />
          <div className="entries-page__hero-copy">
            <Stack gap={10}>
              <Text
                as="span"
                size="sm"
                color="inverse"
                weight="medium"
                transform="uppercase"
              >
                {i18n.t("entries_page.title")}
              </Text>
              <Text as="h1" size="h1" color="inverse" weight="bold">
                {i18n.t("entries_page.title")}
              </Text>
              <Text as="p" size="sm" color="inverse">
                {i18n.t("entries_page.subtitle")}
              </Text>
            </Stack>
          </div>

          <div className="entries-page__hero-actions">
            <AppLink href="/entries/new/expense">
              <span className="entries-page__hero-action entries-page__hero-action--primary">
                {i18n.t("entries_page.add_entry")}
              </span>
            </AppLink>
            <AppLink href="/entries/new/multiple">
              <span className="entries-page__hero-action">
                {i18n.t("entries_page.add_multiple_entries")}
              </span>
            </AppLink>
          </div>

          <div className="entries-page__hero-stats">
            <div className="entries-page__hero-stat">
              <Text as="span" size="xs" color="inverse" weight="medium">
                {i18n.t("entries_page.summary_shown")}
              </Text>
              <Text as="span" size="lg" color="inverse" weight="semibold">
                {entriesData.entries.length}
              </Text>
            </div>
            <div className="entries-page__hero-stat entries-page__hero-stat--soft">
              <Text as="span" size="xs" color="inverse" weight="medium">
                {i18n.t("entries_page.summary_total")}
              </Text>
              <Text as="span" size="lg" color="inverse" weight="semibold">
                {entriesData.pagination.total}
              </Text>
            </div>
            <div className="entries-page__hero-stat entries-page__hero-stat--soft">
              <Text as="span" size="xs" color="inverse" weight="medium">
                {i18n.t("entries_page.summary_filters")}
              </Text>
              <Text as="span" size="lg" color="inverse" weight="semibold">
                {activeFilterCount}
              </Text>
            </div>
          </div>
        </section>

        <Card
          as="section"
          padding={24}
          title={String(i18n.t("entries_page.filters"))}
          icon="entries"
        >
          <EntriesFilters accounts={accounts} filters={filters} />
        </Card>

        <Card
          as="section"
          padding={24}
          title={String(i18n.t("entries_page.results_title"))}
          icon="activity"
        >
          <Stack gap={20}>
            <div className="entries-page__results-copy">
              <Text size="sm" color="secondary">
                {i18n.t("entries_page.showing_results", {
                  count: entriesData.entries.length,
                  total: entriesData.pagination.total,
                })}
              </Text>
            </div>

            <EntriesTable entries={entriesData.entries} />

            {entriesData.pagination.totalPages > 1 ? (
              <div className="entries-page__pagination">
                <EntriesPagination
                  currentPage={entriesData.pagination.page}
                  totalPages={entriesData.pagination.totalPages}
                />
              </div>
            ) : null}
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
