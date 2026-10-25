const assert = require("node:assert/strict");
const { test } = require("node:test");
require("tsx/cjs");
const {
  getSpaceIdFromPath,
  getTransactionCreationBase,
  isTransactionDraftPath,
} = require("../../src/lib/transaction_creation.ts");
const { Space } = require("../../src/lib/space.ts");
const { Transaction } = require("../../src/lib/transaction.ts");
const { prisma } = require("../../src/lib/prisma.ts");
const { SpaceMember } = require("../../src/lib/space_member.ts");

test("creation navigation follows the current space without treating overview routes as spaces", () => {
  for (const path of [
    "/spaces/card",
    "/spaces/card/edit",
    "/spaces/card/new/income",
  ]) {
    assert.equal(getSpaceIdFromPath(path), "card");
    assert.equal(
      getTransactionCreationBase(getSpaceIdFromPath(path)),
      "/spaces/card/new",
    );
  }
  for (const path of [
    "/spaces",
    "/spaces/new",
    "/spaces/archived",
    "/transactions/new/expense",
  ]) {
    assert.equal(getSpaceIdFromPath(path), undefined);
    assert.equal(
      getTransactionCreationBase(getSpaceIdFromPath(path)),
      "/transactions/new",
    );
  }
  assert.equal(isTransactionDraftPath("/spaces/card/new/expense"), true);
  assert.equal(isTransactionDraftPath("/transactions/new/income"), true);
  assert.equal(isTransactionDraftPath("/spaces/card/new/transfer"), false);
});

test("scoped drafts are isolated from global and other spaces", () => {
  const drafts = require("../../src/lib/new_transaction_draft.ts");
  const values = new Map();
  global.window = {
    sessionStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  };
  try {
    drafts.saveNewTransactionDraft({ description: "global" });
    drafts.saveNewTransactionDraft({ description: "first" }, "first");
    drafts.saveNewTransactionDraft({ description: "second" }, "second");
    drafts.clearNewTransactionDraft("first");
    assert.equal(drafts.loadNewTransactionDraft("first"), null);
    assert.equal(
      drafts.loadNewTransactionDraft("second").description,
      "second",
    );
    assert.equal(drafts.loadNewTransactionDraft().description, "global");
  } finally {
    delete global.window;
  }
});

test("recent activity is restricted to both the requested space and authenticated owner", async () => {
  const original = prisma.transaction.findMany;
  let query;
  prisma.transaction.findMany = async (args) => {
    query = args;
    return [];
  };
  try {
    await Transaction.listRecentByUser("owner", 5, "space");
    assert.deepEqual(query.where, {
      spaceId: "space",
      space: { userAccountId: "owner" },
    });
    assert.equal(query.take, 5);
    await Transaction.listRecentByUser("owner", 5);
    assert.deepEqual(query.where, { space: { userAccountId: "owner" } });
  } finally {
    prisma.transaction.findMany = original;
  }
});

test("scoped creation resolves the owned ID and rejects missing or archived spaces", async () => {
  const originals = {
    find: Space.findOwnedById,
    create: Space.findOrCreateActive,
    sync: Space.syncCurrentMonthTransactionCount,
    insert: prisma.transaction.create,
    transaction: prisma.$transaction,
    participants: SpaceMember.serializeParticipants,
  };
  prisma.$transaction = async (callback) => callback(prisma);
  SpaceMember.serializeParticipants = async (_tx, owner, id) => {
    assert.equal(owner, "owner");
    assert.equal(id, "fixed");
    return "owner";
  };
  let existing = {
    persistedId: "fixed",
    toRecord: () => ({ isArchived: false }),
  };
  let inserted;
  Space.findOwnedById = async (owner, id) => {
    assert.equal(owner, "owner");
    assert.equal(id, "fixed");
    return existing;
  };
  Space.findOrCreateActive = async () => {
    throw Error("Must not resolve scoped transactions by name");
  };
  Space.syncCurrentMonthTransactionCount = async () => {};
  prisma.transaction.create = async (args) => {
    inserted = args.data;
    return args.data;
  };
  const payload = {
    spaceId: "fixed",
    spaceName: "stale name",
    type: "expense",
    amount: -5,
    description: "Scoped",
    beginDate: new Date(2026, 9, 22),
  };
  try {
    await Transaction.createForUser("owner", payload);
    assert.equal(inserted.spaceId, "fixed");
    existing = null;
    await assert.rejects(
      () => Transaction.createForUser("owner", payload),
      /space_not_found/,
    );
    existing = { toRecord: () => ({ isArchived: true }) };
    await assert.rejects(
      () => Transaction.createForUser("owner", payload),
      /space_not_found/,
    );
  } finally {
    Space.findOwnedById = originals.find;
    Space.findOrCreateActive = originals.create;
    Space.syncCurrentMonthTransactionCount = originals.sync;
    prisma.transaction.create = originals.insert;
    prisma.$transaction = originals.transaction;
    SpaceMember.serializeParticipants = originals.participants;
  }
});
