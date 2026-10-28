import assert from "node:assert/strict";
import { test } from "node:test";
import { register } from "tsx/esm/api";
import "tsx/cjs";
register();
const {
  normalizeTransactionsFilters,
  normalizeTransactionsFiltersFromUrlSearchParams,
  buildTransactionsFiltersQuery,
  toTransactionFiltersInput,
} = await import("../../src/lib/transactions_search.ts");
const { getCategoryTransactionsHref } =
  await import("../../src/lib/category_allocation.ts");

test("chart links round-trip category, selected reporting month, and transaction type through pagination", () => {
  const href = getCategoryTransactionsHref("2026-11", "pets", "expense");
  const url = new URL(href, "http://localhost");
  assert.equal(url.pathname, "/transactions");
  const filters = normalizeTransactionsFiltersFromUrlSearchParams(
    url.searchParams,
  );
  assert.equal(filters.month, "2026-11");
  assert.equal(filters.category, "pets");
  assert.equal(filters.type, "expense");
  const pageTwo = new URLSearchParams(
    buildTransactionsFiltersQuery({
      ...filters,
      page: 2,
      space: "owned-space",
      searchTerms: ["cat", "food"],
    }),
  );
  assert.equal(pageTwo.get("month"), "2026-11");
  assert.equal(pageTwo.get("category"), "pets");
  assert.equal(pageTwo.get("page"), "2");
  assert.equal(pageTwo.get("space"), "owned-space");
  assert.deepEqual(pageTwo.getAll("search"), ["cat", "food"]);
  const input = toTransactionFiltersInput(filters);
  assert.equal(input.category, "pets");
  assert.equal(input.reportingMonth.getMonth(), 10);
  assert.equal(input.reportingMonth.getDate(), 1);
  assert.equal(
    input.startDate,
    undefined,
    "reporting month must not become an original begin-date filter",
  );
  assert.deepEqual(
    normalizeTransactionsFilters({
      month: "2026-11",
      category: "pets",
      type: "expense",
    }),
    filters,
  );
});

test("invalid category and month inputs cannot reach Prisma as invalid enum or date values", () => {
  for (const month of [
    "2026-13",
    "2026-00",
    "0000-01",
    "garbage",
    "2026-11-01",
  ]) {
    const filters = normalizeTransactionsFilters({
      category: "constructor",
      month,
    });
    assert.equal(filters.category, "");
    assert.equal(filters.month, "");
    const input = toTransactionFiltersInput(filters);
    assert.equal(input.category, undefined);
    assert.equal(input.reportingMonth, undefined);
  }
  assert.equal(
    normalizeTransactionsFilters({
      category: "uncategorized",
      month: "2026-02",
    }).category,
    "uncategorized",
  );
});
