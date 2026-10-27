import assert from "node:assert/strict";
import Module from "node:module";
import { test } from "node:test";
import { register } from "tsx/esm/api";
import "tsx/cjs";
register();

test("dashboard allocations require authentication and return private owner-scoped data", async () => {
  let user = null;
  let calls = 0;
  const payload = {
    categories: [],
    total: 0,
    income: 0,
    expense: 0,
    transactionCount: 0,
  };
  const original = Module._load;
  Module._load = function (specifier, ...args) {
    if (specifier === "@/lib/session")
      return { getCurrentUserAccount: async () => user };
    if (specifier === "@/lib/transaction")
      return {
        Transaction: {
          getMonthCategoryAllocationsForUser: async (id, monthStart) => {
            assert.equal(monthStart.getDate(), 1);
            assert.equal(id, "owner");
            calls++;
            return payload;
          },
        },
      };
    return original.call(this, specifier, ...args);
  };
  let GET;
  try {
    ({ GET } =
      await import("../../src/app/api/dashboard/allocations/route.ts"));
  } finally {
    Module._load = original;
  }
  const unauthorized = await GET();
  assert.equal(unauthorized.status, 401);
  assert.match(unauthorized.headers.get("Cache-Control"), /private, no-store/);
  assert.equal(calls, 0);
  user = { id: "owner" };
  const response = await GET();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Cache-Control"), /private, no-store/);
  const responsePayload = await response.json();
  const { monthKey, ...summary } = responsePayload;
  assert.match(monthKey, /^\d{4}-\d{2}$/);
  assert.deepEqual(summary, payload);
  assert.equal(calls, 1);
});

test("projection allocations follow the requested month and always use the authenticated owner", async () => {
  let user = null;
  const months = [];
  const original = Module._load;
  Module._load = function (specifier, ...args) {
    if (specifier === "@/lib/session")
      return { getCurrentUserAccount: async () => user };
    if (specifier === "@/lib/transaction")
      return {
        Transaction: {
          getMonthCategoryAllocationsForUser: async (ownerId, month) => {
            assert.equal(ownerId, "owner");
            assert.equal(month.getDate(), 1);
            months.push(
              `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
            );
            const expense = (month.getMonth() + 1) * 100;
            return {
              categories: [],
              total: expense,
              income: 0,
              expense,
              transactionCount: 0,
            };
          },
        },
      };
    return original.call(this, specifier, ...args);
  };
  let GET;
  try {
    ({ GET } =
      await import("../../src/app/api/projection/allocations/route.ts"));
  } finally {
    Module._load = original;
  }
  const request = (month) =>
    new Request(
      `http://localhost/api/projection/allocations?month=${month}&userAccountId=foreign`,
    );
  const unauthorized = await GET(request("2026-11"));
  assert.equal(unauthorized.status, 401);
  assert.match(unauthorized.headers.get("Cache-Control"), /private, no-store/);
  assert.equal(months.length, 0);
  user = { id: "owner" };
  const november = await GET(request("2026-11"));
  assert.equal(november.status, 200);
  assert.match(november.headers.get("Cache-Control"), /private, no-store/);
  assert.equal((await november.json()).expense, 1100);
  const december = await GET(request("2026-12"));
  const payload = await december.json();
  assert.equal(payload.monthKey, "2026-12");
  assert.equal(payload.expense, 1200);
  assert.deepEqual(months, ["2026-11", "2026-12"]);
});
