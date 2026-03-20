"use client";

import "./entries_filters.scss";

import { ContextMenu, useNavigationProgress } from "@/components";
import { Icon, Text } from "@/elements";
import { usePathname, useSearchParams } from "next/navigation";

import React from "react";
import { format } from "date-fns";
import { i18n } from "@/model/i18n";

type EntriesFiltersProps = {
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

type EntryTypeFilter = "" | "income" | "expense" | "transfer";

type FilterPill = {
  id: string;
  label: string;
  onRemove: () => void;
};

function formatFilterDate(date: string): string {
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

export function EntriesFilters({
  spaces,
  filters,
}: EntriesFiltersProps): React.ReactElement {
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
    type?: EntryTypeFilter;
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
    spaces.find((spaceOption) => spaceOption.id === filters.space)
      ?.name || filters.space;
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
      label: String(i18n.t("entries_page.search_pill", { term })),
      onRemove: () => removeSearchTerm(term),
    })),
    ...(filters.type
      ? [
          {
            id: "type",
            label: String(
              i18n.t("entries_page.type_pill", { type: typeLabel }),
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
              i18n.t("entries_page.space_pill", { space: spaceLabel }),
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
              i18n.t("entries_page.start_date_pill", {
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
              i18n.t("entries_page.end_date_pill", {
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
    <div className="entries-filters">
      <div className="entries-filters__bar">
        <div className="entries-filters__search">
          <input
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="entries-filters__search-input"
            placeholder={String(i18n.t("entries_page.search_placeholder"))}
            aria-label={String(i18n.t("entries_page.search_placeholder"))}
          />
        </div>
        <ContextMenu
          ariaLabel={String(i18n.t("entries_page.open_filters"))}
          icon="entries"
        >
          <div className="entries-filters__menu">
            <div className="entries-filters__menu-section">
              <Text size="sm" weight="medium">
                {i18n.t("entries_page.type")}
              </Text>
              <div className="entries-filters__type-options">
                {[
                  { value: "", label: i18n.t("entries_page.type_all") },
                  { value: "income", label: i18n.t("common.income") },
                  { value: "expense", label: i18n.t("common.expense") },
                  { value: "transfer", label: i18n.t("common.transfer") },
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
                      option.value === "transfer" &&
                        "entries-filters__type-option--transfer",
                      filters.type === option.value &&
                        "entries-filters__type-option--active",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      updateQuery({ type: option.value as EntryTypeFilter })
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="entries-filters__menu-section">
              <label className="entries-filters__field-label" htmlFor="space">
                {i18n.t("entries_page.space")}
              </label>
              <select
                id="space"
                className="entries-filters__select"
                value={filters.space}
                onChange={(event) =>
                  updateQuery({ space: event.target.value })
                }
              >
                <option value="">
                  {String(i18n.t("entries_page.space_placeholder"))}
                </option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="entries-filters__menu-section">
              <Text size="sm" weight="medium">
                {i18n.t("entries_page.date_range")}
              </Text>
              <div className="entries-filters__date-grid">
                <label className="entries-filters__field">
                  <span className="entries-filters__field-label">
                    {i18n.t("entries_page.start_date")}
                  </span>
                  <input
                    type="date"
                    className="entries-filters__date-input"
                    value={filters.startDate}
                    onChange={(event) =>
                      updateQuery({ startDate: event.target.value })
                    }
                  />
                </label>
                <label className="entries-filters__field">
                  <span className="entries-filters__field-label">
                    {i18n.t("entries_page.end_date")}
                  </span>
                  <input
                    type="date"
                    className="entries-filters__date-input"
                    value={filters.endDate}
                    onChange={(event) =>
                      updateQuery({ endDate: event.target.value })
                    }
                  />
                </label>
              </div>
            </div>
          </div>
        </ContextMenu>
      </div>

      {anyFilters ? (
        <div className="entries-filters__pills">
          {pills.map((pill) => (
            <button
              key={pill.id}
              type="button"
              className="entries-filters__pill"
              onClick={pill.onRemove}
            >
              <span>{pill.label}</span>
              <Icon name="close" size={14} />
            </button>
          ))}
          <button
            type="button"
            className="entries-filters__pill entries-filters__pill--clear"
            onClick={clearFilters}
          >
            {i18n.t("entries_page.clear_filters")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
