import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { register } from "tsx/esm/api";
import "tsx/cjs";
register();

const { transactionCategoryCatalog } =
  await import("../../src/lib/category_catalog.ts");
const { iconAssets } = await import("../../src/elements/icon/icon_assets.ts");

test("each category has its own registered icon and matching chart token", async () => {
  const icons = [];
  for (const [key, metadata] of Object.entries(transactionCategoryCatalog)) {
    assert.ok(iconAssets[metadata.icon], key);
    assert.equal(metadata.chartToken, `--color-category-${key}`);
    icons.push(metadata.icon);
    const svg = await readFile(
      new URL(
        `../../src/elements/icon/icons/${metadata.icon}.svg`,
        import.meta.url,
      ),
      "utf8",
    );
    assert.match(svg, /viewBox=/);
  }
  assert.equal(new Set(icons).size, icons.length);
  assert.ok(iconAssets.mixed);
  assert.ok(iconAssets.allocations);
});

test("expense and income cards split mixed categories, omit zero sides, and use independent ordering", async () => {
  const { getCategoryAllocationsForType } =
    await import("../../src/lib/category_allocation.ts");
  const categories = Object.freeze([
    Object.freeze({ category: "shopping", income: 80, expense: 20 }),
    Object.freeze({ category: "income", income: 50, expense: 0 }),
    Object.freeze({ category: "food_groceries", income: 0, expense: 40 }),
  ]);
  assert.deepEqual(getCategoryAllocationsForType(categories, "expense"), [
    { category: "food_groceries", amount: 40, type: "expense" },
    { category: "shopping", amount: 20, type: "expense" },
  ]);
  assert.deepEqual(getCategoryAllocationsForType(categories, "income"), [
    { category: "shopping", amount: 80, type: "income" },
    { category: "income", amount: 50, type: "income" },
  ]);
  assert.deepEqual(getCategoryAllocationsForType([], "expense"), []);
});

test(
  "monthly allocations expand complete schedules, honor card boundaries, isolate accounts, and count split occurrences once",
  { skip: process.env.RUN_DATABASE_TESTS !== "1" },
  async () => {
    assert.ok(
      ["localhost", "127.0.0.1", "[::1]"].includes(
        new URL(process.env.DATABASE_URL).hostname,
      ),
    );
    const { prisma } = await import("../../src/lib/prisma.ts");
    const { Transaction } = await import("../../src/lib/transaction.ts");
    const users = [];
    try {
      const owner = await prisma.userAccount.create({
        data: { email: `allocations-${Date.now()}@example.test` },
      });
      users.push(owner.id);
      const foreign = await prisma.userAccount.create({
        data: { email: `allocations-foreign-${Date.now()}@example.test` },
      });
      users.push(foreign.id);
      const cash = await prisma.space.create({
        data: { userAccountId: owner.id, name: "Cash" },
      });
      const card = await prisma.space.create({
        data: {
          userAccountId: owner.id,
          name: "Card",
          type: "credit_card",
          paymentDueDay: 25,
          periodEndDay: 24,
        },
      });
      const legacy = await prisma.space.create({
        data: {
          userAccountId: owner.id,
          name: "Legacy",
          type: "credit_card",
          paymentDueDay: 25,
          paymentTiming: "previous_month",
          isArchived: true,
        },
      });
      const foreignSpace = await prisma.space.create({
        data: { userAccountId: foreign.id, name: "Foreign" },
      });
      const member = await prisma.spaceMember.create({
        data: { spaceId: cash.id, name: "Shared participant" },
      });
      const date = (value) => new Date(value + "T00:00:00.000Z");
      const insert = (category, amount, begin, extra = {}) =>
        prisma.transaction.create({
          data: {
            spaceId: cash.id,
            category,
            categorySource: "manual",
            type: "expense",
            amount,
            beginDate: date(begin),
            endDate: date(begin),
            description: "Allocation fixture",
            ...extra,
          },
        });
      await insert("food_groceries", -40, "2026-11-01", {
        splitParticipantIds: `${owner.id};${member.id}`,
      });
      await insert("food_groceries", 10, "2026-11-02", { type: "income" });
      await insert("income", 1000, "2026-11-01", { type: "income" });
      await insert("pets", -12, "2026-08-31", { endDate: null });
      await insert("health_personal_care", -7, "2026-10-31", {
        endDate: date("2026-12-31"),
      });
      for (let day = 1; day <= 6; day++)
        await insert("shopping", -5, `2026-11-0${day}`);
      await insert("bars_restaurants", -99, "2026-10-01");
      await insert("donations", -99, "2026-12-01");
      await insert("uncategorized", -3, "2026-11-01");
      await insert("shopping", -500, "2026-11-01", {
        transferSpaceId: card.id,
      });
      await insert("income", 500, "2026-11-01", {
        spaceId: card.id,
        transferSpaceId: cash.id,
        type: "income",
      });
      await insert("shopping", -11, "2026-09-23", { spaceId: card.id });
      await insert("travel", -20, "2026-09-24", { spaceId: card.id });
      await insert("travel", -30, "2026-10-23", { spaceId: card.id });
      await insert("travel", -40, "2026-10-24", { spaceId: card.id });
      await insert("insurance", -9, "2026-11-05", { spaceId: legacy.id });
      await insert("shopping", -500, "2026-11-01", {
        spaceId: foreignSpace.id,
      });
      const summary = await Transaction.getMonthCategoryAllocationsForUser(
        owner.id,
        date("2026-11-15"),
      );
      const byCategory = Object.fromEntries(
        summary.categories.map((item) => [item.category, item]),
      );
      assert.deepEqual(byCategory.food_groceries, {
        category: "food_groceries",
        amount: 50,
        income: 10,
        expense: 40,
        transactionCount: 2,
        type: "mixed",
      });
      assert.equal(byCategory.pets.amount, 12);
      assert.equal(byCategory.health_personal_care.amount, 7);
      assert.equal(byCategory.travel.amount, 50);
      assert.equal(byCategory.shopping.amount, 30);
      assert.equal(byCategory.shopping.transactionCount, 6);
      assert.equal(byCategory.insurance.amount, 9);
      assert.equal(byCategory.uncategorized.amount, 3);
      assert.equal(byCategory.income.type, "income");
      assert.equal(byCategory.shopping.type, "expense");
      assert.equal(byCategory.bars_restaurants, undefined);
      assert.equal(byCategory.donations, undefined);
      assert.equal(summary.total, 1161);
      assert.equal(summary.income, 1010);
      assert.equal(summary.expense, 151);
      assert.equal(summary.transactionCount, 15);
      const totals = await Transaction.getMonthTotalsForUser(
        owner.id,
        date("2026-11-01"),
      );
      assert.equal(totals.income, summary.income);
      assert.equal(Math.abs(totals.expense), summary.expense);
      assert.deepEqual(
        await Transaction.getMonthCategoryAllocationsForUser(
          owner.id,
          date("2025-01-01"),
        ),
        {
          categories: [],
          total: 0,
          income: 0,
          expense: 0,
          transactionCount: 0,
        },
      );
    } finally {
      await prisma.userAccount.deleteMany({ where: { id: { in: users } } });
      await prisma.$disconnect();
    }
  },
);
