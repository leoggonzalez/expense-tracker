"use client";

import "./transactions_filters.scss";

import {
  ContextMenu,
  MonthSelector,
  Select,
  useNavigationProgress,
} from "@/components";
import { Icon, Stack, Text } from "@/elements";
import { usePathname, useSearchParams } from "next/navigation";

import React from "react";
import { format } from "date-fns";
import { i18n } from "@/model/i18n";
import { inferTransactionDateMode } from "@/lib/transaction_schedule";

type TransactionsFiltersProps = {
  spaces: Array<{
    id: string;
    name: string;
  }>;
  filters: {
    space: string;
    type: string;
    startDate: string;
    endDate: string;
    searchTerms: string[];
  };
};

type TransactionTypeFilter = "" | "income" | "expense" | "transfer";

type FilterPill = {
  id: string;
  label: string;
  onRemove: () => void;
};

function formatFilterDate(date: string): string {
  if (inferTransactionDateMode(date) === "month") {
    return format(new Date(`${date}-01T00:00:00`), "MMM yyyy");
  }

  return format(new Date(`${date}T00:00:00`), "MMM d, yyyy");
}

function getUniqueSearchTerms(searchTerms: string[]): string[] {
  const seen = new Set<string>();

  return searchTerms.filter((term) => {
    const normalizedTerm = term.trim();
    const key = normalizedTerm.toLowerCase();

    if (!normalizedTerm || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function TransactionsFilters({
  spaces,
  filters,
}: TransactionsFiltersProps): React.ReactElement {
  const pathname = usePathname();
  const { push } = useNavigationProgress();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = React.useState("");

  const updateQuery = ({
    space,
    type,
    startDate,
    endDate,
    searchTerms,
  }: {
    space?: string;
    type?: TransactionTypeFilter;
    startDate?: string;
    endDate?: string;
    searchTerms?: string[];
  }): void => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (space !== undefined) {
      if (space) {
        nextParams.set("space", space);
      } else {
        nextParams.delete("space");
      }
    }

    if (type !== undefined) {
      if (type) {
        nextParams.set("type", type);
      } else {
        nextParams.delete("type");
      }
    }

    if (startDate !== undefined) {
      if (startDate) {
        nextParams.set("start_date", startDate);
      } else {
        nextParams.delete("start_date");
      }
    }

    if (endDate !== undefined) {
      if (endDate) {
        nextParams.set("end_date", endDate);
      } else {
        nextParams.delete("end_date");
      }
    }

    if (searchTerms !== undefined) {
      nextParams.delete("search");

      getUniqueSearchTerms(searchTerms).forEach((term) => {
        nextParams.append("search", term.trim());
      });
    }

    nextParams.delete("page");

    const queryString = nextParams.toString();
    push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const clearFilters = () => {
    push(pathname);
  };

  const addSearchTerm = (): void => {
    const nextTerm = searchValue.trim();

    if (!nextTerm) {
      return;
    }

    if (
      filters.searchTerms.some(
        (existingTerm) => existingTerm.toLowerCase() === nextTerm.toLowerCase(),
      )
    ) {
      setSearchValue("");
      return;
    }

    updateQuery({ searchTerms: [...filters.searchTerms, nextTerm] });
    setSearchValue("");
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    addSearchTerm();
  };

  const removeSearchTerm = (term: string): void => {
    updateQuery({
      searchTerms: filters.searchTerms.filter(
        (existingTerm) => existingTerm !== term,
      ),
    });
  };

  const spaceLabel =
    spaces.find((spaceOption) => spaceOption.id === filters.space)?.name ||
    filters.space;
  const typeLabel =
    filters.type === "income"
      ? String(i18n.t("common.income"))
      : filters.type === "expense"
        ? String(i18n.t("common.expense"))
        : filters.type === "transfer"
          ? String(i18n.t("common.transfer"))
          : "";

  const pills: FilterPill[] = [
    ...filters.searchTerms.map((term) => ({
      id: `search-${term}`,
      label: String(i18n.t("transactions_page.search_pill", { term })),
      onRemove: () => removeSearchTerm(term),
    })),
    ...(filters.type
      ? [
          {
            id: "type",
            label: String(
              i18n.t("transactions_page.type_pill", { type: typeLabel }),
            ),
            onRemove: () => updateQuery({ type: "" }),
          },
        ]
      : []),
    ...(filters.space
      ? [
          {
            id: "space",
            label: String(
              i18n.t("transactions_page.space_pill", { space: spaceLabel }),
            ),
            onRemove: () => updateQuery({ space: "" }),
          },
        ]
      : []),
    ...(filters.startDate
      ? [
          {
            id: "start-date",
            label: String(
              i18n.t("transactions_page.start_date_pill", {
                date: formatFilterDate(filters.startDate),
              }),
            ),
            onRemove: () => updateQuery({ startDate: "" }),
          },
        ]
      : []),
    ...(filters.endDate
      ? [
          {
            id: "end-date",
            label: String(
              i18n.t("transactions_page.end_date_pill", {
                date: formatFilterDate(filters.endDate),
              }),
            ),
            onRemove: () => updateQuery({ endDate: "" }),
          },
        ]
      : []),
  ];

  const anyFilters = pills.length > 0;

  return (
    <div className="transactions-filters">
      <div className="transactions-filters__bar">
        <div className="transactions-filters__search">
          <input
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="transactions-filters__search-input"
            placeholder={String(i18n.t("transactions_page.search_placeholder"))}
            aria-label={String(i18n.t("transactions_page.search_placeholder"))}
          />
        </div>
        <ContextMenu
          ariaLabel={String(i18n.t("transactions_page.open_filters"))}
          icon="transactions"
        >
          <div className="transactions-filters__menu">
            <div className="transactions-filters__menu-section">
              <Text size="sm" weight="medium">
                {i18n.t("transactions_page.type")}
              </Text>
              <div className="transactions-filters__type-options">
                <Stack direction="row" wrap gap={8}>
                  {[
                    { value: "", label: i18n.t("transactions_page.type_all") },
                    { value: "income", label: i18n.t("common.income") },
                    { value: "expense", label: i18n.t("common.expense") },
                    { value: "transfer", label: i18n.t("common.transfer") },
                  ].map((option) => (
                    <button
                      key={option.value || "all"}
                      type="button"
                      className={[
                        "transactions-filters__type-option",
                        option.value === "income" &&
                          "transactions-filters__type-option--income",
                        option.value === "expense" &&
                          "transactions-filters__type-option--expense",
                        option.value === "transfer" &&
                          "transactions-filters__type-option--transfer",
                        filters.type === option.value &&
                          "transactions-filters__type-option--active",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() =>
                        updateQuery({
                          type: option.value as TransactionTypeFilter,
                        })
                      }
                    >
                      <Text as="span" size="sm" weight="medium">
                        {option.label}
                      </Text>
                    </button>
                  ))}
                </Stack>
              </div>
            </div>

            <div className="transactions-filters__menu-section">
              <Select
                label={i18n.t("transactions_page.space")}
                value={filters.space}
                onChange={(value) => updateQuery({ space: value })}
                options={[
                  {
                    value: "",
                    label: String(
                      i18n.t("transactions_page.space_placeholder"),
                    ),
                  },
                  ...spaces.map((space) => ({
                    value: space.id,
                    label: space.name,
                  })),
                ]}
                size="lg"
                surface="subtle"
              />
            </div>

            <div className="transactions-filters__menu-section">
              <Text size="sm" weight="medium">
                {i18n.t("transactions_page.date_range")}
              </Text>
              <div className="transactions-filters__date-grid">
                <MonthSelector
                  label={i18n.t("transactions_page.start_date")}
                  value={filters.startDate}
                  onChange={(value) => updateQuery({ startDate: value })}
                  editLabel={String(
                    i18n.t("transaction_form.edit_full_begin_date"),
                  )}
                  closeLabel={String(
                    i18n.t("transaction_form.use_month_year_begin_date"),
                  )}
                  monthLabel={i18n.t("transaction_form.month")}
                  yearLabel={i18n.t("transaction_form.year")}
                  surface="subtle"
                />
                <MonthSelector
                  label={i18n.t("transactions_page.end_date")}
                  value={filters.endDate}
                  onChange={(value) => updateQuery({ endDate: value })}
                  editLabel={String(
                    i18n.t("transaction_form.edit_full_end_date"),
                  )}
                  closeLabel={String(
                    i18n.t("transaction_form.use_month_year_begin_date"),
                  )}
                  monthLabel={i18n.t("transaction_form.month")}
                  yearLabel={i18n.t("transaction_form.year")}
                  surface="subtle"
                />
              </div>
            </div>
          </div>
        </ContextMenu>
      </div>

      {anyFilters ? (
        <div className="transactions-filters__pills">
          <Stack direction="row" wrap gap={8}>
            {pills.map((pill) => (
              <button
                key={pill.id}
                type="button"
                className="transactions-filters__pill"
                onClick={pill.onRemove}
              >
                <Stack direction="row" inline align="center" gap={4}>
                  <Text as="span" size="sm" weight="medium">
                    {pill.label}
                  </Text>
                  <Icon name="close" size={14} />
                </Stack>
              </button>
            ))}
            <button
              type="button"
              className="transactions-filters__pill transactions-filters__pill--clear"
              onClick={clearFilters}
            >
              <Text as="span" size="sm" weight="medium">
                {i18n.t("transactions_page.clear_filters")}
              </Text>
            </button>
          </Stack>
        </div>
      ) : null}
    </div>
  );
}
