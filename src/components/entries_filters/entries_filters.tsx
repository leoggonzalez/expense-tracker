"use client";

import "./entries_filters.scss";

import { Button, DateRangeInput, Select } from "@/components";
import { Card, Grid, Stack, Text } from "@/elements";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import React from "react";
import { i18n } from "@/model/i18n";

type EntriesFiltersProps = {
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
};

export function EntriesFilters({
  accounts,
  filters,
}: EntriesFiltersProps): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateQuery = (updates: Record<string, string>) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    });

    nextParams.delete("page");

    const queryString = nextParams.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const anyFilters = Object.values(filters).some((value) => value);

  return (
    <Card padding={24} variant="secondary" className="entries-filters">
      <Stack gap={16}>
        <Grid gap={16} className="entries-filters__grid">
          <Select
            label={i18n.t("entries_page.account")}
            value={filters.account}
            onChange={(value) => updateQuery({ account: value })}
            placeholder={i18n.t("entries_page.account_placeholder") as string}
            options={accounts.map((account) => ({
              value: account.id,
              label: account.name,
            }))}
          />

          <Stack gap={4}>
            <Text size="sm" weight="medium">
              {i18n.t("entries_page.type")}
            </Text>
            <Stack direction="row" wrap gap={8}>
              {[
                { value: "", label: i18n.t("entries_page.type_all") },
                { value: "income", label: i18n.t("common.income") },
                { value: "expense", label: i18n.t("common.expense") },
              ].map((option) => (
                <button
                  key={option.value || "all"}
                  type="button"
                  className={[
                    "entries-filters__type-option",
                    option.value === "income" &&
                      "entries-filters__type-option--income",
                    option.value === "expense" &&
                      "entries-filters__type-option--expense",
                    filters.type === option.value &&
                      "entries-filters__type-option--active",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => updateQuery({ type: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </Stack>
          </Stack>

          <DateRangeInput
            label={i18n.t("entries_page.date_range")}
            startDate={filters.startDate}
            endDate={filters.endDate}
            onStartDateChange={(value) => updateQuery({ start_date: value })}
            onEndDateChange={(value) => updateQuery({ end_date: value })}
          />
        </Grid>
        {anyFilters && (
          <Stack direction="row" className="entries-filters__actions">
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              {i18n.t("entries_page.clear_filters")}
            </Button>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
