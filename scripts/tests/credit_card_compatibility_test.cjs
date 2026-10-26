const assert = require("node:assert/strict");
const { test } = require("node:test");
require("tsx/cjs");
const { Transaction } = require("../../src/lib/transaction.ts");
const { prisma } = require("../../src/lib/prisma.ts");

// Exercise the settlement query boundary without requiring a running database.
test("existing cards retain their settlement month and interval query", async () => {
  const originalQuery = prisma.$queryRaw;
  const monthStart = new Date(2026, 9, 1);
  const monthEnd = new Date(2026, 9, 31, 23, 59, 59, 999);
  try {
    for (const timing of [null, "same_month", "previous_month"]) {
      let query;
      prisma.$queryRaw = async (strings, ...values) => {
        query = { sql: strings.join("?"), values };
        return [{ total: 125 }];
      };
      const payment = await Transaction.getUpcomingCreditCardSettlement(
        {
          id: "legacy",
          name: "Existing card",
          paymentDueDay: 25,
          paymentTiming: timing,
          periodEndDay: null,
        },
        monthStart,
        monthEnd,
        monthStart,
        monthEnd,
      );
      assert.equal(payment.amount, 125);
      assert.equal(payment.dueDate.getMonth(), 9);
      assert.equal(
        payment.projectedMonthStart.getMonth(),
        timing === "previous_month" ? 10 : 9,
      );
      assert.equal(
        payment.projectedMonthEnd.getMonth(),
        timing === "previous_month" ? 10 : 9,
      );
      assert.match(query.sql, /endDate/);
      assert.match(query.sql, /transferSpaceId.*IS NULL/);
      assert.doesNotMatch(query.sql, /getSpaceProjectionMonthStart/);
      assert.ok(
        query.values.some(
          (value) =>
            value instanceof Date &&
            value.getTime() === payment.projectedMonthStart.getTime(),
        ),
      );
    }
  } finally {
    prisma.$queryRaw = originalQuery;
  }
});

test("configured statements reported next month are debited in the current month", async () => {
  const originalQuery = prisma.$queryRaw;
  let sql;
  prisma.$queryRaw = async (strings) => {
    sql = strings.join("?");
    return [{ total: 200 }];
  };
  try {
    const payment = await Transaction.getUpcomingCreditCardSettlement(
      {
        id: "configured",
        name: "Configured card",
        paymentDueDay: 25,
        paymentTiming: "previous_month",
        periodEndDay: 23,
      },
      new Date(2026, 9, 1),
      new Date(2026, 9, 31),
      new Date(2026, 9, 1),
      new Date(2026, 9, 31),
    );
    assert.equal(payment.dueDate.getMonth(), 9);
    assert.equal(payment.dueDate.getDate(), 25);
    assert.equal(payment.projectedMonthStart.getMonth(), 10);
    assert.equal(payment.projectedMonthEnd.getMonth(), 10);
    assert.match(sql, /getSpaceProjectionMonthStart/);
    assert.match(sql, /t.type IN \('expense', 'income'\)/);
    assert.match(sql, /ELSE -t.amount END AS amount/);
    assert.match(sql, /SUM\(amount\)/);
  } finally {
    prisma.$queryRaw = originalQuery;
  }
});

function loadSpaceActions(existing) {
  const fs = require("node:fs");
  const vm = require("node:vm");
  const ts = require("typescript");
  let saved;
  const space = {
    toRecord: () => existing,
    updateDetails: async (data) => {
      saved = data;
    },
  };
  const mocks = {
    "@/lib/session": {
      requireCurrentUserAccount: async () => ({ id: "owner" }),
    },
    "@/lib/space": {
      Space: {
        findOwnedById: async (owner, id) => {
          assert.equal(owner, "owner");
          assert.equal(id, "card");
          return space;
        },
      },
    },
    "@/lib/app_revalidation": { revalidateSpaceMutationPages() {} },
    "@/lib/amount": {},
    "@/lib/prisma_errors": { isPrismaErrorWithCode: () => false },
  };
  const source = fs.readFileSync(
    require.resolve("../../src/actions/spaces.ts"),
    "utf8",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require: (name) => mocks[name] || require(name),
    console,
  });
  return { actions: exports, saved: () => saved };
}

test("editing an existing card preserves timing without requiring a closing day", async () => {
  const context = loadSpaceActions({
    type: "credit_card",
    paymentTiming: "previous_month",
    periodEndDay: null,
    main: null,
  });
  const result = await context.actions.updateSpace("card", {
    name: "Renamed",
    type: "credit_card",
    paymentDueDay: 25,
    periodEndDay: null,
  });
  assert.equal(result.success, true);
  assert.equal(context.saved().periodEndDay, null);
  assert.equal(context.saved().paymentTiming, "previous_month");
});

test("entering a closing day opts an existing card into statement periods", async () => {
  const context = loadSpaceActions({
    type: "credit_card",
    paymentTiming: "previous_month",
    periodEndDay: null,
    main: null,
  });
  const result = await context.actions.updateSpace("card", {
    name: "Card",
    type: "credit_card",
    paymentDueDay: 25,
    periodEndDay: 23,
  });
  assert.equal(result.success, true);
  assert.equal(context.saved().periodEndDay, 23);
  assert.equal(context.saved().paymentTiming, null);
});

test("configured cards cannot clear their closing day, and omitted values are preserved", async () => {
  const context = loadSpaceActions({
    type: "credit_card",
    paymentTiming: null,
    periodEndDay: 23,
    main: null,
  });
  const cleared = await context.actions.updateSpace("card", {
    name: "Card",
    type: "credit_card",
    paymentDueDay: 25,
    periodEndDay: null,
  });
  assert.equal(cleared.success, false);
  assert.equal(context.saved(), undefined);
  const omitted = await context.actions.updateSpace("card", {
    name: "Card",
    type: "credit_card",
    paymentDueDay: 25,
  });
  assert.equal(omitted.success, true);
  assert.equal(context.saved().periodEndDay, 23);
});

test("new cards still require a closing day", async () => {
  const context = loadSpaceActions(null);
  const result = await context.actions.createSpace({
    name: "New card",
    type: "credit_card",
    paymentDueDay: 25,
  });
  assert.equal(result.success, false);
  assert.equal(result.error, "spaces_page.credit_card_period_end_day_required");
});

const { CreditCardSpace } = require("../../src/lib/space.ts");
const cutoffExamples = [
  ["2026-10-22T00:00:00", 24, 31, "2026-11"],
  ["2026-10-23T23:59:59", 24, 31, "2026-11"],
  ["2026-10-24T00:00:00", 24, 31, "2026-12"],
  ["2026-10-24T12:00:00", 24, 31, "2026-12"],
  ["2026-11-23T12:00:00", 24, 31, "2026-12"],
  ["2026-11-24T00:00:00", 24, 31, "2027-01"],
  ["2026-12-24T00:00:00", 24, 5, "2027-02"],
  ["2026-02-27T12:00:00", 31, 31, "2026-03"],
  ["2026-02-28T00:00:00", 31, 31, "2026-04"],
  ["2028-02-28T12:00:00", 31, 31, "2028-03"],
  ["2028-02-29T00:00:00", 31, 31, "2028-04"],
  ["2026-10-22T00:00:00", null, 31, "2026-10"],
];

test("statement cutoff is inclusive and payment is in the month after closing", () => {
  const { format } = require("date-fns");
  for (const [date, cutoff, dueDay, expected] of cutoffExamples) {
    const card = new CreditCardSpace({
      userAccountId: "owner",
      name: "Card",
      type: "credit_card",
      periodEndDay: cutoff,
      paymentDueDay: dueDay,
    });
    assert.equal(
      format(card.getProjectionMonthStartForDate(new Date(date)), "yyyy-MM"),
      expected,
      date,
    );
  }
});

test(
  "database and application agree on cutoff boundaries",
  { skip: process.env.RUN_DATABASE_TESTS !== "1" },
  async () => {
    require("dotenv").config({ quiet: true });
    assert.equal(new URL(process.env.DATABASE_URL).hostname, "localhost");
    try {
      for (const [date, cutoff, dueDay, expected] of cutoffExamples) {
        const [row] =
          await prisma.$queryRaw`SELECT to_char("getSpaceProjectionMonthStart"('credit_card', ${dueDay}::integer, ${cutoff}::integer, ${date}::timestamp), 'YYYY-MM') AS month`;
        assert.equal(row.month, expected, date);
      }
    } finally {
      await prisma.$disconnect();
    }
  },
);

test(
  "relevant transactions and totals use payment months together",
  { skip: process.env.RUN_DATABASE_TESTS !== "1" },
  async () => {
    require("dotenv").config({ quiet: true });
    assert.equal(new URL(process.env.DATABASE_URL).hostname, "localhost");
    const { Space } = require("../../src/lib/space.ts");
    const { endOfMonth } = require("date-fns");
    const rollback = new Error("Rollback test fixtures");
    const originalQuery = prisma.$queryRaw;
    const originalFindMany = prisma.transaction.findMany;
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.userAccount.create({
          data: { email: `cutoff-${Date.now()}@example.com` },
        });
        const card = await tx.space.create({
          data: {
            userAccountId: user.id,
            name: "Cutoff regression",
            type: "credit_card",
            paymentDueDay: 31,
            periodEndDay: 24,
          },
        });
        const purchases = await Promise.all(
          [22, 23, 24, 25].map((day) =>
            tx.transaction.create({
              data: {
                spaceId: card.id,
                description: `October ${day}`,
                type: "expense",
                amount: -10,
                beginDate: new Date(Date.UTC(2026, 9, day)),
                endDate: new Date(Date.UTC(2026, 9, day)),
              },
            }),
          ),
        );
        prisma.$queryRaw = tx.$queryRaw.bind(tx);
        prisma.transaction.findMany = tx.transaction.findMany.bind(
          tx.transaction,
        );
        try {
          for (const [month, expected] of [
            [9, []],
            [10, purchases.slice(0, 2)],
            [11, purchases.slice(2)],
          ]) {
            const start = new Date(2026, month, 1);
            const end = endOfMonth(start);
            const relevant = await Space.listRelevantTransactionsForMonth(
              card.id,
              start,
              end,
            );
            assert.deepEqual(
              relevant.map((t) => t.id).sort(),
              expected.map((t) => t.id).sort(),
            );
            const detail = await Space.getDetailPageQueryResult(
              user.id,
              card.id,
              start,
              end,
              20,
            );
            assert.equal(
              detail.metrics.selectedMonthTotal,
              expected.length ? -10 * expected.length : 0,
            );
            const projection = await Transaction.getProjectionSpacesQueryData(
              user.id,
              start,
            );
            assert.deepEqual(
              projection.spaceTransactionsRows.map((t) => t.id).sort(),
              expected.map((t) => t.id).sort(),
            );
            const totals = await Transaction.getMonthTotalsForUser(
              user.id,
              start,
            );
            assert.equal(
              totals.expense,
              expected.length ? -10 * expected.length : 0,
            );
          }
        } finally {
          prisma.$queryRaw = originalQuery;
          prisma.transaction.findMany = originalFindMany;
        }
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    } finally {
      prisma.$queryRaw = originalQuery;
      prisma.transaction.findMany = originalFindMany;
      await prisma.$disconnect();
    }
  },
);
