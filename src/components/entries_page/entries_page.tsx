"use client";

import "./entries_page.scss";

import {
  AppLink,
  Container,
  EntriesFilters,
  EntriesTable,
  Pagination,
  useNavigationProgress,
} from "@/components";
import { Stack, Text } from "@/elements";
import { usePathname, useSearchParams } from "next/navigation";

import { EntriesTableItem } from "@/components/entries_table/entries_table";
import React from "react";
import { i18n } from "@/model/i18n";

export interface EntriesPageProps {
  entries: EntriesTableItem[];
  accounts: Array<{
    id: string;
    name: string;
  }>;
  filters: {
    account: string;
    type: string;
    startDate: string;
    endDate: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function EntriesPage({
  entries,
  accounts,
  filters,
  pagination,
}: EntriesPageProps): React.ReactElement {
  const pathname = usePathname();
  const { push } = useNavigationProgress();
  const searchParams = useSearchParams();

  const goToPage = (page: number) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (page <= 1) {
      nextParams.delete("page");
    } else {
      nextParams.set("page", String(page));
    }

    const queryString = nextParams.toString();
    push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  return (
    <Container maxWidth="wide">
      <div className="entries-page">
        <Stack gap={24}>
          <div className="entries-page__header">
            <Stack
              gap={16}
              direction="row"
              align="center"
              justify="space-between"
              wrap
            >
              <Text size="h2" as="h2" weight="bold">
                {i18n.t("entries_page.title")}
              </Text>
              <div className="entries-page__button-link">
                <AppLink href="/entries/new/expense">
                  <span className="entries-page__button">
                    {i18n.t("entries_page.add_entry")}
                  </span>
                </AppLink>
              </div>
            </Stack>
          </div>

          <EntriesFilters accounts={accounts} filters={filters} />

          <div className="entries-page__results">
            <Stack direction="row" align="center" justify="space-between">
              <Text size="sm" color="secondary">
                {i18n.t("entries_page.showing_results", {
                  count: entries.length,
                  total: pagination.total,
                })}
              </Text>
            </Stack>
          </div>

          <EntriesTable entries={entries} />

          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={goToPage}
            />
          )}
        </Stack>
      </div>
    </Container>
  );
}
