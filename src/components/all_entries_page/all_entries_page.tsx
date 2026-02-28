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
import { getEntriesWithFilters, getGroups } from "@/actions/entries";
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
    groupId: "",
    description: "",
    startDate: "",
    endDate: "",
  });
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchGroups() {
      const groupsData = await getGroups();
      setGroups(groupsData);
    }

    fetchGroups();
  }, []);

  useEffect(() => {
    async function fetchEntries() {
      setLoading(true);
      const result = await getEntriesWithFilters({
        groupId: filters.groupId,
        description: filters.description,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        page: pagination.page,
        limit: 20,
      });

      const mappedEntries: EntryListItem[] = result.entries.map((entry) => ({
        id: entry.id,
        type: entry.type,
        groupName: entry.group.name,
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
      groupId: "",
      description: "",
      startDate: "",
      endDate: "",
    });
    setPagination((currentPagination) => ({ ...currentPagination, page: 1 }));
  }

  const selectedGroupName =
    groups.find((group) => group.id === filters.groupId)?.name || "";

  return (
    <Container>
      <Stack gap={32}>
        <Text size="h2" as="h2" weight="bold">
          {String(i18n.t("all_entries_page.title"))}
        </Text>

        <div className="all-entries-page__filters">
          <Text size="h4" as="h3" weight="semibold">
            {String(i18n.t("all_entries_page.filters"))}
          </Text>
          <div className="all-entries-page__filter-grid">
            <Autocomplete
              label={String(i18n.t("all_entries_page.group"))}
              value={selectedGroupName}
              onChange={(name) => {
                const group = groups.find((item) => item.name === name);
                handleFilterChange("groupId", group?.id || "");
              }}
              options={groups.map((group) => group.name)}
              placeholder={String(i18n.t("all_entries_page.group_placeholder"))}
            />

            <Input
              label={String(i18n.t("all_entries_page.description"))}
              value={filters.description}
              onChange={(value) => handleFilterChange("description", value)}
              placeholder={String(
                i18n.t("all_entries_page.description_placeholder"),
              )}
            />

            <Input
              label={String(i18n.t("all_entries_page.start_date"))}
              type="date"
              value={filters.startDate}
              onChange={(value) => handleFilterChange("startDate", value)}
            />

            <Input
              label={String(i18n.t("all_entries_page.end_date"))}
              type="date"
              value={filters.endDate}
              onChange={(value) => handleFilterChange("endDate", value)}
            />
          </div>

          <Button onClick={handleClearFilters} variant="secondary" size="sm">
            {String(i18n.t("all_entries_page.clear_filters"))}
          </Button>
        </div>

        <div>
          <div className="all-entries-page__results-header">
            <Text size="md" color="secondary">
              {loading
                ? String(i18n.t("all_entries_page.loading"))
                : String(
                    i18n.t("all_entries_page.showing_results", {
                      count: entries.length,
                      total: pagination.total,
                    }),
                  )}
            </Text>
          </div>

          {loading ? (
            <div className="all-entries-page__loading">
              <Text color="secondary">
                {String(i18n.t("all_entries_page.loading_entries"))}
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
