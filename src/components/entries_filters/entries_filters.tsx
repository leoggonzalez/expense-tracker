"use client";

import "./entries_filters.scss";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button, Input, Select } from "@/components";
import { Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

type EntriesFiltersProps = {
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

  return (
    <div className="entries-filters">
      <Stack gap={12}>
        <Text size="h4" as="h3" weight="semibold">
          {i18n.t("entries_page.filters")}
        </Text>
        <div className="entries-filters__grid">
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

          <Select
            label={i18n.t("entries_page.type")}
            value={filters.type}
            onChange={(value) => updateQuery({ type: value })}
            placeholder={i18n.t("entries_page.type_placeholder") as string}
            options={[
              {
                value: "income",
                label: i18n.t("common.income"),
              },
              {
                value: "expense",
                label: i18n.t("common.expense"),
              },
            ]}
          />

          <Input
            type="date"
            label={i18n.t("entries_page.date_exact")}
            value={filters.date}
            onChange={(value) => updateQuery({ date: value })}
          />

          <Input
            type="date"
            label={i18n.t("entries_page.start_date")}
            value={filters.startDate}
            onChange={(value) => updateQuery({ start_date: value })}
          />

          <Input
            type="date"
            label={i18n.t("entries_page.end_date")}
            value={filters.endDate}
            onChange={(value) => updateQuery({ end_date: value })}
          />
        </div>
      </Stack>

      <div className="entries-filters__actions">
        <Button variant="secondary" size="sm" onClick={clearFilters}>
          {i18n.t("entries_page.clear_filters")}
        </Button>
      </div>
    </div>
  );
}
