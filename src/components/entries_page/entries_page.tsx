"use client";

import "./entries_page.scss";

import { Container, EntriesFilters, EntriesTable, Pagination } from "@/components";
import { Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { EntriesTableItem } from "@/components/entries_table/entries_table";

export interface EntriesPageProps {
  entries: EntriesTableItem[];
  accounts: Array<{
    id: string;
    name: string;
  }>;
  filters: {
    account: string;
    type: string;
    date: string;
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
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = (page: number) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (page <= 1) {
      nextParams.delete("page");
    } else {
      nextParams.set("page", String(page));
    }

    const queryString = nextParams.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  return (
    <Container maxWidth="wide">
      <div className="entries-page">
        <Stack gap={24}>
          <div className="entries-page__header">
            <Text size="h2" as="h2" weight="bold">
              {i18n.t("entries_page.title")}
            </Text>
            <Link
              href="/entries/new/income"
              className="entries-page__button-link"
            >
              <span className="entries-page__button">
                {i18n.t("entries_page.add_entry")}
              </span>
            </Link>
          </div>

          <EntriesFilters accounts={accounts} filters={filters} />

          <div className="entries-page__results">
            <Text size="sm" color="secondary">
              {i18n.t("entries_page.showing_results", {
                count: entries.length,
                total: pagination.total,
              })}
            </Text>
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
