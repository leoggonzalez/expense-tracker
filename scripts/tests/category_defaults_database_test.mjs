import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { register } from "tsx/esm/api";
import "tsx/cjs";
register();

test(
  "database defaults, personal overrides, manual learning, and bulk resolution share one contract",
  { skip: process.env.RUN_DATABASE_TESTS !== "1" },
  async () => {
    assert.ok(
      ["localhost", "127.0.0.1", "[::1]"].includes(
        new URL(process.env.DATABASE_URL).hostname,
      ),
    );
    const { prisma } = await import("../../src/lib/prisma.ts");
    const { CategoryDefault } =
      await import("../../src/lib/category_default.ts");
    const { CategoryMatch } = await import("../../src/lib/category_match.ts");
    const { Transaction } = await import("../../src/lib/transaction.ts");
    const { resolveTransactionCategory } =
      await import("../../src/lib/category_matching.ts");
    const users = [];
    let defaultId;
    let spy;
    try {
      const owner = await prisma.userAccount.create({
        data: { email: `category-owner-${Date.now()}@example.test` },
      });
      users.push(owner.id);
      const foreign = await prisma.userAccount.create({
        data: { email: `category-foreign-${Date.now()}@example.test` },
      });
      users.push(foreign.id);
      const space = await prisma.space.create({
        data: { userAccountId: owner.id, name: "Category test" },
      });
      const description = `category-test-${Date.now()}`;
      const rule = await prisma.categoryDefault.create({
        data: {
          pattern: description,
          transactionType: "expense",
          matchMode: "exact",
          category: "shopping",
          priority: -100,
        },
      });
      defaultId = rule.id;
      const initial = await CategoryMatch.listForUser(owner.id);
      assert.equal(
        resolveTransactionCategory(
          description,
          "expense",
          initial.matches,
          initial.defaults,
        ).category,
        "shopping",
      );
      assert.equal(initial.matches.length, 0);
      const input = {
        spaceId: space.id,
        spaceName: space.name,
        description,
        type: "expense",
        amount: 10,
        beginDate: new Date("2026-10-01"),
        endDate: new Date("2026-10-01"),
      };
      const automatic = await Transaction.createForUser(owner.id, input);
      assert.equal(automatic.category, "shopping");
      assert.equal(automatic.categorySource, "rule");
      assert.equal(
        await prisma.categoryMatch.count({
          where: { userAccountId: owner.id },
        }),
        0,
      );
      await prisma.categoryDefault.update({
        where: { id: rule.id },
        data: { category: "travel" },
      });
      const changed = await CategoryMatch.listForUser(owner.id);
      assert.notEqual(changed.defaultsVersion, initial.defaultsVersion);
      assert.equal(
        (await Transaction.createForUser(owner.id, input)).category,
        "travel",
      );
      assert.equal(
        (await prisma.transaction.findUnique({ where: { id: automatic.id } }))
          .category,
        "shopping",
        "defaults never rewrite history",
      );
      const manual = await Transaction.updateForUser(owner.id, automatic.id, {
        category: "uncategorized",
        categorySelection: "manual",
      });
      assert.equal(manual.categorySource, "manual");
      assert.equal(manual.categoryMatchPatch.match.category, "uncategorized");
      const personal = await CategoryMatch.listForUser(owner.id);
      const foreignSnapshot = await CategoryMatch.listForUser(foreign.id);
      assert.equal(personal.matches.length, 1);
      assert.equal(foreignSnapshot.matches.length, 0);
      assert.equal(foreignSnapshot.defaultsVersion, personal.defaultsVersion);
      assert.equal(
        resolveTransactionCategory(
          description,
          "expense",
          personal.matches,
          personal.defaults,
        ).category,
        "uncategorized",
      );
      assert.equal(
        resolveTransactionCategory(
          description,
          "expense",
          foreignSnapshot.matches,
          foreignSnapshot.defaults,
        ).category,
        "travel",
      );
      assert.equal(
        (await Transaction.createForUser(owner.id, input)).categorySource,
        "learned",
      );
      const version = personal.rulesVersion;
      await Transaction.updateForUser(owner.id, automatic.id, { amount: 12 });
      assert.equal(
        (await CategoryMatch.listForUser(owner.id)).rulesVersion,
        version,
      );
      await prisma.categoryMatch.create({
        data: {
          userAccountId: owner.id,
          normalizedDescription: "special pet",
          transactionType: "expense",
          matchMode: "phrase",
          category: "pets",
        },
      });
      const phraseInput = { ...input, description: "special pet insurance" };
      assert.equal(
        (await Transaction.createForUser(owner.id, phraseInput)).category,
        "pets",
      );
      spy = mock.method(CategoryDefault, "listActive");
      const bulk = await Transaction.createManyForUser(owner.id, [
        input,
        phraseInput,
      ]);
      assert.deepEqual(
        bulk.map((row) => row.category),
        ["uncategorized", "pets"],
      );
      assert.equal(
        spy.mock.callCount(),
        1,
        "one defaults load per bulk request",
      );
      spy.mock.restore();
      spy = null;
      await prisma.categoryDefault.update({
        where: { id: rule.id },
        data: { enabled: false },
      });
      const disabled = await CategoryMatch.listForUser(foreign.id);
      assert.notEqual(disabled.defaultsVersion, initial.defaultsVersion);
      assert.equal(
        resolveTransactionCategory(
          description,
          "expense",
          [],
          disabled.defaults,
        ).category,
        "uncategorized",
      );
      const marker = new Error("rollback test");
      await assert.rejects(
        prisma.$transaction(async (tx) => {
          await CategoryMatch.learnExplicitChoice(tx, {
            userAccountId: foreign.id,
            description,
            transactionType: "expense",
            category: "pets",
          });
          throw marker;
        }),
        (error) => error === marker,
      );
      assert.equal(
        (await CategoryMatch.listForUser(foreign.id)).matches.length,
        0,
      );
      assert.equal(
        (await CategoryMatch.listForUser(foreign.id)).rulesVersion,
        0,
      );
    } finally {
      spy?.mock.restore();
      if (defaultId)
        await prisma.categoryDefault.delete({ where: { id: defaultId } });
      await prisma.userAccount.deleteMany({ where: { id: { in: users } } });
      await prisma.$disconnect();
    }
  },
);
