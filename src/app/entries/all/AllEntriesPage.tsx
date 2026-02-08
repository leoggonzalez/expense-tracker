"use client";

import React, { useState, useEffect } from "react";
import { Stack, Text } from "@/elements";
import { Container, Input, Button, Autocomplete } from "@/components";
import { Pagination } from "@/components/Pagination/Pagination";
import { getEntriesWithFilters, getGroups } from "@/actions/entries";
import { EntryList } from "../EntryList";
import "./AllEntriesPage.scss";

export function AllEntriesPage() {
  const [entries, setEntries] = useState<any[]>([]);
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
    fetchEntries();
  }, [pagination.page, filters]);

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

    const mappedEntries = result.entries.map((entry) => ({
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

  function handleFilterChange(key: string, value: string) {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, page: 1 });
  }

  function handleClearFilters() {
    setFilters({
      groupId: "",
      description: "",
      startDate: "",
      endDate: "",
    });
    setPagination({ ...pagination, page: 1 });
  }

  const selectedGroupName =
    groups.find((g) => g.id === filters.groupId)?.name || "";

  return (
    <Container>
      <Stack gap={32}>
        <Text size="h2" as="h2" weight="bold">
          All Entries
        </Text>

        <div className="all-entries-page__filters">
          <Text size="h4" as="h3" weight="semibold">
            Filters
          </Text>
          <div className="all-entries-page__filter-grid">
            <Autocomplete
              label="Group"
              value={selectedGroupName}
              onChange={(name) => {
                const group = groups.find((g) => g.name === name);
                handleFilterChange("groupId", group?.id || "");
              }}
              options={groups.map((g) => g.name)}
              placeholder="All groups"
            />

            <Input
              label="Description"
              value={filters.description}
              onChange={(value) => handleFilterChange("description", value)}
              placeholder="Search description..."
            />

            <Input
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(value) => handleFilterChange("startDate", value)}
            />

            <Input
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={(value) => handleFilterChange("endDate", value)}
            />
          </div>

          <Button onClick={handleClearFilters} variant="secondary" size="sm">
            Clear Filters
          </Button>
        </div>

        <div>
          <div className="all-entries-page__results-header">
            <Text size="md" color="secondary">
              {loading
                ? "Loading..."
                : `Showing ${entries.length} of ${pagination.total} entries`}
            </Text>
          </div>

          {loading ? (
            <div className="all-entries-page__loading">
              <Text color="secondary">Loading entries...</Text>
            </div>
          ) : (
            <>
              <EntryList entries={entries} />

              {pagination.totalPages > 1 && (
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) =>
                    setPagination({ ...pagination, page })
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
