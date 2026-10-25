import assert from "node:assert/strict";
import { test } from "node:test";

test("database copy rejects remote destinations, identical targets, and connection overrides", async () => {
  const { validateConnections } = await import("../copy_db_prod.mjs");
  const source = "postgresql://user:secret@production.example/app";
  const destination = "postgresql://user:secret@localhost/local";
  assert.deepEqual(
    validateConnections({
      DATABASE_URL_PROD: source,
      DATABASE_URL: destination,
    }),
    {
      source,
      destination,
    },
  );
  for (const env of [
    {},
    { DATABASE_URL_PROD: source, DATABASE_URL: source },
    {
      DATABASE_URL_PROD: destination,
      DATABASE_URL: destination.replace("localhost", "127.0.0.1"),
    },
    {
      DATABASE_URL_PROD: source,
      DATABASE_URL: `${destination}?host=production.example`,
    },
    { DATABASE_URL_PROD: source, DATABASE_URL: `${destination}?schema=other` },
    {
      DATABASE_URL_PROD: source,
      DATABASE_URL: destination,
      DIRECT_URL: source,
    },
  ]) {
    assert.throws(() => validateConnections(env));
  }
});

test(
  "database copy fully replaces data, preserves precision, and rolls back failed inserts",
  {
    skip: process.env.RUN_DATABASE_TESTS !== "1",
  },
  async () => {
    const { loadEnvFile } = await import("node:process");
    const { existsSync } = await import("node:fs");
    const { PrismaClient } = await import("@prisma/client");
    const { copyDatabase, validateConnections } =
      await import("../copy_db_prod.mjs");
    if (existsSync(".env")) loadEnvFile(".env");
    const base = process.env.DIRECT_URL || process.env.DATABASE_URL;
    // Only create/drop isolated test databases on an explicitly local server.
    validateConnections({
      DATABASE_URL: base,
      DATABASE_URL_PROD: "postgresql://unused.example/unused",
    });
    const suffix = `${process.pid}_${Date.now()}`;
    const names = [`copy_db_source_${suffix}`, `copy_db_destination_${suffix}`];
    const urls = names.map((name) => {
      const url = new URL(base);
      url.pathname = `/${name}`;
      return url.href;
    });
    const admin = new PrismaClient({ datasourceUrl: base });
    const source = new PrismaClient({ datasourceUrl: urls[0] });
    const destination = new PrismaClient({ datasourceUrl: urls[1] });
    const created = [];
    try {
      for (const name of names) {
        await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
        created.push(name);
      }
      for (const db of [source, destination]) {
        await db.$executeRawUnsafe(
          'CREATE TABLE "UserAccount" (id text PRIMARY KEY, email text UNIQUE, "createdAt" timestamp(6))',
        );
        await db.$executeRawUnsafe(
          'CREATE TABLE "Space" (id text PRIMARY KEY, "userAccountId" text REFERENCES "UserAccount"(id))',
        );
        await db.$executeRawUnsafe(
          'CREATE TABLE "Transaction" (id text PRIMARY KEY, "spaceId" text REFERENCES "Space"(id), amount double precision)',
        );
        for (const table of ["LoginCode", "Session"]) {
          await db.$executeRawUnsafe(
            `CREATE TABLE "${table}" (id text PRIMARY KEY, "userAccountId" text REFERENCES "UserAccount"(id))`,
          );
        }
        await db.$executeRawUnsafe(
          "CREATE TABLE _prisma_migrations (id text PRIMARY KEY)",
        );
      }
      await destination.$executeRawUnsafe(
        'CREATE TABLE "SpaceMember" (id text PRIMARY KEY, "spaceId" text REFERENCES "Space"(id), name text)',
      );
      await destination.$executeRawUnsafe(
        'ALTER TABLE "Space" ADD COLUMN "periodEndDay" integer',
      );
      await destination.$executeRawUnsafe(
        "INSERT INTO _prisma_migrations VALUES ('local_history')",
      );
      // A different local ID with the same email must be replaced cleanly.
      await destination.$executeRawUnsafe(
        `INSERT INTO "UserAccount" VALUES ('local_only', 'same@example.test', now())`,
      );
      await destination.$executeRawUnsafe(
        `INSERT INTO "Session" VALUES ('local_session', 'local_only')`,
      );
      await source.$executeRawUnsafe(
        `INSERT INTO "UserAccount" VALUES ('production_user', 'same@example.test', '2026-10-25 12:34:56.123456')`,
      );
      await source.$executeRawUnsafe(
        `INSERT INTO "Space" VALUES ('production_space', 'production_user')`,
      );
      await source.$executeRawUnsafe(
        `INSERT INTO "Transaction" VALUES ('production_transaction', 'production_space', 12.34)`,
      );
      for (const table of ["LoginCode", "Session"]) {
        await source.$executeRawUnsafe(
          `INSERT INTO "${table}" VALUES ('production_auth', 'production_user')`,
        );
      }
      await destination.$executeRawUnsafe(
        `INSERT INTO "Space" (id, "userAccountId") VALUES ('local_space', 'local_only')`,
      );
      await destination.$executeRawUnsafe(
        `INSERT INTO "SpaceMember" VALUES ('local_member', 'local_space', 'Local')`,
      );
      await copyDatabase(urls[0], urls[1]);
      assert.deepEqual(
        await destination.$queryRawUnsafe('SELECT * FROM "SpaceMember"'),
        [],
      );
      for (const table of [
        "UserAccount",
        "Transaction",
        "LoginCode",
        "Session",
      ]) {
        const query = `SELECT to_jsonb(t) AS data FROM "${table}" t ORDER BY id`;
        assert.deepEqual(
          await destination.$queryRawUnsafe(query),
          await source.$queryRawUnsafe(query),
        );
      }
      assert.deepEqual(
        await destination.$queryRawUnsafe('SELECT "periodEndDay" FROM "Space"'),
        [{ periodEndDay: null }],
      );
      assert.deepEqual(
        await destination.$queryRawUnsafe("SELECT id FROM _prisma_migrations"),
        [{ id: "local_history" }],
      );

      await source.$executeRawUnsafe(
        'CREATE TABLE "SpaceMember" (id text PRIMARY KEY, "spaceId" text REFERENCES "Space"(id), name text)',
      );
      await source.$executeRawUnsafe(
        `INSERT INTO "SpaceMember" VALUES ('production_member', 'production_space', 'Production')`,
      );
      await copyDatabase(urls[0], urls[1]);
      assert.deepEqual(
        await destination.$queryRawUnsafe('SELECT * FROM "SpaceMember"'),
        await source.$queryRawUnsafe('SELECT * FROM "SpaceMember"'),
      );

      // This local constraint forces an insert failure after deletion has started.
      await destination.$executeRawUnsafe(
        'ALTER TABLE "Transaction" ADD CONSTRAINT reject_copy CHECK (amount < 100)',
      );
      await source.$executeRawUnsafe('UPDATE "Transaction" SET amount = 200');
      await assert.rejects(copyDatabase(urls[0], urls[1]));
      assert.deepEqual(
        await destination.$queryRawUnsafe('SELECT amount FROM "Transaction"'),
        [{ amount: 12.34 }],
      );
      assert.deepEqual(
        await destination.$queryRawUnsafe('SELECT id FROM "Session"'),
        [{ id: "production_auth" }],
      );
      assert.deepEqual(
        await source.$queryRawUnsafe('SELECT amount FROM "Transaction"'),
        [{ amount: 200 }],
      );
    } finally {
      await Promise.all([source.$disconnect(), destination.$disconnect()]);
      for (const name of created.reverse()) {
        await admin.$executeRawUnsafe(`DROP DATABASE "${name}"`);
      }
      await admin.$disconnect();
    }
  },
);
