import assert from "node:assert/strict";
import { test } from "node:test";
import { register } from "tsx/esm/api";
import "tsx/cjs";

register();
const { getSplitShareCents, parseSplitParticipants } =
  await import("../../src/lib/transaction_split.ts");

test("equal shares round in cents, retain expense signs, and tolerate legacy selections", () => {
  assert.equal(getSplitShareCents(100, 1), 10000);
  assert.equal(getSplitShareCents(100, 2), 5000);
  assert.equal(getSplitShareCents(100, 3), 3333);
  assert.equal(getSplitShareCents(-100, 3), -3333);
  assert.equal(getSplitShareCents(1.005, 1), 101);
  assert.equal(getSplitShareCents(10.075, 1), 1008);
  assert.equal(getSplitShareCents(0.01, 2), 1);
  assert.equal(getSplitShareCents(100, 0), 0);
  assert.deepEqual(parseSplitParticipants(null), []);
  assert.deepEqual(parseSplitParticipants("owner;member;member;"), [
    "owner",
    "member",
  ]);
});

test(
  "shared spaces preserve identities, enforce ownership, and aggregate complete monthly occurrences",
  {
    skip: process.env.RUN_DATABASE_TESTS !== "1",
  },
  async () => {
    const { existsSync } = await import("node:fs");
    const { loadEnvFile } = await import("node:process");
    const { spawnSync } = await import("node:child_process");
    const { PrismaClient } = await import("@prisma/client");
    const { validateConnections } = await import("../copy_db_prod.mjs");
    if (existsSync(".env")) loadEnvFile(".env");
    const base = process.env.DIRECT_URL || process.env.DATABASE_URL;
    validateConnections({
      DATABASE_URL: base,
      DATABASE_URL_PROD: "postgresql://unused.example/unused",
    });
    const name = `space_members_test_${process.pid}_${Date.now()}`;
    const url = new URL(base);
    url.pathname = `/${name}`;
    const admin = new PrismaClient({ datasourceUrl: base });
    let db;
    let created = false;
    const previousUrl = process.env.DATABASE_URL;
    try {
      await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
      created = true;
      const migrated = spawnSync(
        process.execPath,
        ["node_modules/prisma/build/index.js", "migrate", "deploy"],
        {
          encoding: "utf8",
          env: { ...process.env, DATABASE_URL: url.href, DIRECT_URL: url.href },
        },
      );
      assert.equal(migrated.status, 0, migrated.stderr);
      process.env.DATABASE_URL = url.href;
      const { prisma } = await import("../../src/lib/prisma.ts");
      db = prisma;
      const { Space } = await import("../../src/lib/space.ts");
      const { SpaceMember } = await import("../../src/lib/space_member.ts");
      const { Transaction } = await import("../../src/lib/transaction.ts");
      const owner = await db.userAccount.create({
        data: { email: "owner@example.test" },
      });
      const other = await db.userAccount.create({
        data: { email: "other@example.test" },
      });
      const space = await new Space({
        userAccountId: owner.id,
        name: "Shared",
      }).create([{ name: " Alex " }, { name: "Sam" }]);
      const another = await new Space({
        userAccountId: other.id,
        name: "Other owner",
      }).create([{ name: "Private" }]);
      const [alex, sam] = await db.spaceMember.findMany({
        where: { spaceId: space.persistedId },
        orderBy: { createdAt: "asc" },
      });
      const privateMember = await db.spaceMember.findFirstOrThrow({
        where: { spaceId: another.persistedId },
      });
      assert.equal(alex.name, "Alex");
      const details = {
        name: "Shared",
        main: null,
        type: null,
        paymentDueDay: null,
        paymentTiming: null,
        periodEndDay: null,
      };
      await space.updateDetails({
        ...details,
        members: [
          { id: alex.id, name: "Alex" },
          { id: sam.id, name: "Sam" },
        ],
      });
      assert.deepEqual(
        (await db.spaceMember.findUnique({ where: { id: alex.id } })).updatedAt,
        alex.updatedAt,
      );
      await assert.rejects(
        space.updateDetails({
          ...details,
          name: "Must roll back",
          members: [{ id: privateMember.id, name: "Stolen" }],
        }),
      );
      assert.equal(
        (await db.space.findUnique({ where: { id: space.persistedId } })).name,
        "Shared",
      );
      const input = {
        type: "expense",
        spaceId: space.persistedId,
        spaceName: "stale",
        description: "Shared expense",
        amount: 100,
        beginDate: new Date(2026, 9, 10),
        endDate: new Date(2026, 9, 10),
        participantIds: [owner.id, alex.id, sam.id],
      };
      const transaction = await Transaction.createForUser(owner.id, input);
      assert.deepEqual(
        new Set(parseSplitParticipants(transaction.splitParticipantIds)),
        new Set(input.participantIds),
      );
      await assert.rejects(
        Transaction.createForUser(owner.id, { ...input, participantIds: [] }),
        /invalid_split/,
      );
      await assert.rejects(
        Transaction.createForUser(owner.id, {
          ...input,
          participantIds: [privateMember.id],
        }),
        /invalid_split/,
      );
      await assert.rejects(
        Transaction.createForUser(other.id, input),
        /space_not_found/,
      );
      const before = await Transaction.getMonthTotalsForUser(
        owner.id,
        new Date(2026, 9, 1),
        new Date(2026, 10, 0, 23, 59, 59, 999),
      );
      const october = () =>
        SpaceMember.getMonthTotalsForSpaces(
          owner.id,
          [space.persistedId],
          new Date(2026, 9, 1),
          new Date(2026, 10, 0, 23, 59, 59, 999),
        );
      let totals = (await october())[space.persistedId];
      assert.deepEqual(
        totals.map((member) => member.amount),
        [-33.33, -33.33, -33.33],
      );
      await space.updateDetails({
        ...details,
        members: [{ id: sam.id, name: "Samuel" }, { name: "New member" }],
      });
      assert.equal(
        (await db.spaceMember.findUnique({ where: { id: sam.id } })).name,
        "Samuel",
      );
      assert.ok(
        (await db.spaceMember.findUnique({ where: { id: alex.id } })).removedAt,
      );
      await assert.rejects(
        Transaction.createForUser(owner.id, {
          ...input,
          participantIds: [alex.id],
        }),
        /invalid_split/,
      );
      await Transaction.updateForUser(owner.id, transaction.id, {
        description: "Keeps removed participant",
      });
      totals = (await october())[space.persistedId];
      assert.equal(
        totals.find((member) => member.id === alex.id).isRemoved,
        true,
      );
      assert.equal(
        totals.find((member) => member.id === alex.id).amount,
        -33.33,
      );
      assert.deepEqual(
        await Transaction.getMonthTotalsForUser(
          owner.id,
          new Date(2026, 9, 1),
          new Date(2026, 10, 0, 23, 59, 59, 999),
        ),
        before,
      );
      // More than the five preview rows, with one rounded share per occurrence.
      for (let i = 0; i < 6; i++)
        await Transaction.createForUser(owner.id, {
          ...input,
          amount: 10,
          participantIds: [sam.id],
        });
      totals = (await october())[space.persistedId];
      assert.equal(
        totals.find((member) => member.id === sam.id).amount,
        -93.33,
      );
      const projection = await Transaction.getProjectionSpacesQueryData(
        owner.id,
        new Date(2026, 9, 1),
      );
      assert.equal(projection.spaceTransactionsRows.length, 5);
      assert.equal(projection.spaceSummaryRows[0].monthTransactionCount, 7);
      // Moving spaces drops the old split; IDs from the original space are rejected.
      const second = await new Space({
        userAccountId: owner.id,
        name: "Second",
      }).create();
      await assert.rejects(
        Transaction.updateForUser(owner.id, transaction.id, {
          spaceId: second.persistedId,
          participantIds: [sam.id],
        }),
        /invalid_split/,
      );
      const moved = await Transaction.updateForUser(owner.id, transaction.id, {
        spaceId: second.persistedId,
      });
      assert.equal(moved.splitParticipantIds, owner.id);
      // Credit card occurrences follow the statement cutoff, including recurring charges.
      const card = await new Space({
        userAccountId: owner.id,
        name: "Card",
        type: "credit_card",
        paymentDueDay: 5,
        periodEndDay: 24,
      }).create([{ name: "Card member" }]);
      const cardMember = await db.spaceMember.findFirstOrThrow({
        where: { spaceId: card.persistedId },
      });
      await Transaction.createForUser(owner.id, {
        ...input,
        spaceId: card.persistedId,
        beginDate: new Date(2026, 8, 24),
        endDate: new Date(2026, 9, 24),
        participantIds: [cardMember.id],
      });
      const november = await SpaceMember.getMonthTotalsForSpaces(
        owner.id,
        [card.persistedId],
        new Date(2026, 10, 1),
        new Date(2026, 11, 0, 23, 59, 59, 999),
      );
      assert.equal(
        november[card.persistedId].find((member) => member.id === cardMember.id)
          .amount,
        -100,
      );
      assert.deepEqual(
        await SpaceMember.getMonthTotalsForSpaces(
          other.id,
          [card.persistedId],
          new Date(2026, 10, 1),
          new Date(2026, 11, 0),
        ),
        { [card.persistedId]: [] },
      );
      // Transfers are never added to member shares.
      await Transaction.createTransferForUser(owner.id, {
        fromSpaceId: space.persistedId,
        toSpaceId: second.persistedId,
        description: "Transfer",
        amount: 10,
        beginDate: new Date(2026, 9, 10),
      });
      assert.equal(
        (await october())[space.persistedId].find(
          (member) => member.id === sam.id,
        ).amount,
        -60,
      );
    } finally {
      process.env.DATABASE_URL = previousUrl;
      if (db) await db.$disconnect();
      if (created) await admin.$executeRawUnsafe(`DROP DATABASE "${name}"`);
      await admin.$disconnect();
    }
  },
);
