import assert from "node:assert/strict";
import { test } from "node:test";
import { register } from "tsx/esm/api";
import "tsx/cjs";
register();
const { getMassEditBlockReason } =
  await import("../../src/lib/mass_transaction_edit.ts");
const item = {
  splitParticipantIds: "owner;member",
  beginDate: "2026-10-01",
  endDate: "2026-10-01",
  transferSpaceId: null,
};

test("bulk eligibility compares participant identities and complete schedules", () => {
  assert.equal(getMassEditBlockReason([]), null);
  assert.equal(
    getMassEditBlockReason([
      item,
      {
        ...item,
        splitParticipantIds: "member;owner;owner",
        beginDate: "2026-10-20",
        endDate: "2026-10-20",
      },
    ]),
    null,
  );
  assert.equal(
    getMassEditBlockReason([item, { ...item, splitParticipantIds: "owner" }]),
    "mass_edit.different_splits",
  );
  assert.equal(
    getMassEditBlockReason([item, { ...item, endDate: null }]),
    "mass_edit.different_schedules",
  );
  assert.equal(
    getMassEditBlockReason([
      { ...item, endDate: "2026-12-01" },
      { ...item, endDate: "2027-01-01" },
    ]),
    "mass_edit.different_schedules",
  );
  assert.equal(
    getMassEditBlockReason([{ ...item, transferSpaceId: "other" }]),
    "mass_edit.transfers_unsupported",
  );
});

test(
  "bulk updates enforce ownership, preserve schedules, and roll back the entire batch on stale input",
  { skip: process.env.RUN_DATABASE_TESTS !== "1" },
  async () => {
    assert.ok(
      ["localhost", "127.0.0.1"].includes(
        new URL(process.env.DATABASE_URL).hostname,
      ),
    );
    const { prisma } = await import("../../src/lib/prisma.ts");
    const { Transaction } = await import("../../src/lib/transaction.ts");
    const users = [];
    try {
      const owner = await prisma.userAccount.create({
        data: { email: `mass-edit-${Date.now()}@example.test` },
      });
      users.push(owner.id);
      const foreign = await prisma.userAccount.create({
        data: { email: `mass-edit-foreign-${Date.now()}@example.test` },
      });
      users.push(foreign.id);
      const space = await prisma.space.create({
        data: { userAccountId: owner.id, name: "Bulk test source" },
      });
      const target = await prisma.space.create({
        data: { userAccountId: owner.id, name: "Bulk test target" },
      });
      const foreignSpace = await prisma.space.create({
        data: { userAccountId: foreign.id, name: "Foreign" },
      });
      const rows = [];
      for (let index = 0; index < 2; index++)
        rows.push(
          await prisma.transaction.create({
            data: {
              spaceId: space.id,
              type: index ? "income" : "expense",
              description: `Original ${index}`,
              amount: 10,
              beginDate: new Date("2026-10-01"),
              endDate: new Date("2026-12-01"),
              splitParticipantIds: owner.id,
            },
          }),
        );
      const changes = rows.map((row) => ({
        id: row.id,
        description: "Changed",
        amount: 20,
        beginDate: "2026-11-01",
        updatedAt: row.updatedAt.toISOString(),
      }));
      await assert.rejects(
        Transaction.listForMassEdit(
          foreign.id,
          rows.map((row) => row.id),
        ),
        /invalid_selection/,
      );
      await assert.rejects(
        Transaction.massUpdateForUser(foreign.id, { transactions: changes }),
        /invalid_selection/,
      );
      await assert.rejects(
        Transaction.massUpdateForUser(owner.id, {
          transactions: changes,
          spaceId: foreignSpace.id,
        }),
        /space_not_found/,
      );
      await assert.rejects(
        Transaction.massUpdateForUser(owner.id, {
          transactions: [changes[0], { ...changes[1], updatedAt: "stale" }],
        }),
        /mass_edit.stale/,
      );
      const unchanged = await prisma.transaction.findMany({
        where: { id: { in: rows.map((row) => row.id) } },
      });
      assert.ok(
        unchanged.every((row) => row.description.startsWith("Original")),
      );
      await Transaction.massUpdateForUser(owner.id, {
        transactions: changes,
        type: "expense",
        spaceId: target.id,
      });
      const updated = await prisma.transaction.findMany({
        where: { id: { in: rows.map((row) => row.id) } },
      });
      assert.ok(
        updated.every(
          (row) =>
            row.spaceId === target.id &&
            row.type === "expense" &&
            row.amount === -20 &&
            row.description === "Changed" &&
            row.endDate.toISOString().slice(0, 10) === "2027-01-01" &&
            row.splitParticipantIds === owner.id,
        ),
      );
      const member = await prisma.spaceMember.create({
        data: { spaceId: target.id, name: "Member" },
      });
      await prisma.transaction.updateMany({
        where: { id: { in: rows.map((row) => row.id) } },
        data: { splitParticipantIds: `${owner.id};${member.id}` },
      });
      const shared = await Transaction.listForMassEdit(
        owner.id,
        rows.map((row) => row.id),
      );
      const sharedChanges = shared.map((row) => ({
        ...changes[0],
        id: row.id,
        updatedAt: row.updatedAt,
      }));
      await assert.rejects(
        Transaction.massUpdateForUser(owner.id, {
          transactions: sharedChanges,
          spaceId: space.id,
        }),
        /mass_edit.shared_space/,
      );
      await Transaction.massUpdateForUser(owner.id, {
        transactions: sharedChanges,
      });
      const final = await prisma.transaction.findMany({
        where: { id: { in: rows.map((row) => row.id) } },
      });
      assert.ok(
        final.every(
          (row) =>
            row.splitParticipantIds.split(";").sort().join(";") ===
            [owner.id, member.id].sort().join(";"),
        ),
      );
    } finally {
      if (users.length)
        await prisma.userAccount.deleteMany({ where: { id: { in: users } } });
      await prisma.$disconnect();
    }
  },
);
