import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

// Parent tables precede their dependents. Migration history belongs to each DB.
const tables = [
  "UserAccount",
  "Space",
  "SpaceMember",
  "Transaction",
  "LoginCode",
  "Session",
];
const optionalTables = new Set(["SpaceMember"]);
const transactionOptions = {
  isolationLevel: "RepeatableRead",
  maxWait: 15_000,
  timeout: 120_000,
};

export function validateConnections(env) {
  const source = env.DIRECT_URL_PROD || env.DATABASE_URL_PROD;
  const destination = env.DIRECT_URL || env.DATABASE_URL;
  if (!source || !destination) {
    throw new Error(
      "Set DATABASE_URL and DATABASE_URL_PROD (or their DIRECT_URL equivalents).",
    );
  }
  const production = new URL(source);
  const local = new URL(destination);
  const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);
  for (const url of [production, local]) {
    if (!["postgres:", "postgresql:"].includes(url.protocol)) {
      throw new Error("Database URLs must use PostgreSQL.");
    }
    if (
      [...url.searchParams.keys()].some((key) =>
        ["host", "hostaddr", "port", "dbname", "service", "options"].includes(
          key.toLowerCase(),
        ),
      )
    ) {
      throw new Error(
        "Database URLs must not override their connection target in query parameters.",
      );
    }
    if ((url.searchParams.get("schema") || "public") !== "public") {
      throw new Error("Database copying supports the public schema only.");
    }
  }
  if (!loopback.has(local.hostname)) {
    throw new Error("Refusing to replace a database outside localhost.");
  }
  if (
    loopback.has(production.hostname) &&
    (production.port || "5432") === (local.port || "5432") &&
    decodeURIComponent(production.pathname) ===
      decodeURIComponent(local.pathname)
  ) {
    throw new Error("Source and destination must be different databases.");
  }
  return { source, destination };
}

function quote(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function snapshot(db, lock = false) {
  const columns = await db.$queryRawUnsafe(`
    SELECT table_name, column_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name <> '_prisma_migrations'
    ORDER BY table_name, ordinal_position
  `);
  const names = [...new Set(columns.map((column) => column.table_name))];
  if (
    tables.some((name) => !optionalTables.has(name) && !names.includes(name)) ||
    names.some((name) => !tables.includes(name))
  ) {
    throw new Error(
      "Unexpected application tables. Update the copy script before replacing data.",
    );
  }
  if (lock) {
    await db.$executeRawUnsafe(
      `LOCK TABLE ${names.map((table) => `public.${quote(table)}`).join(", ")} IN ACCESS EXCLUSIVE MODE`,
    );
  }
  const rows = {};
  for (const table of tables) {
    if (!names.includes(table)) {
      rows[table] = [];
      continue;
    }
    const records = await db.$queryRawUnsafe(
      `SELECT to_jsonb(t) AS data FROM public.${quote(table)} t ORDER BY id`,
    );
    rows[table] = records.map((record) => record.data);
  }
  return { columns, rows };
}

function fingerprint(rows) {
  return createHash("sha256")
    .update(
      JSON.stringify(rows, (_, value) =>
        value && typeof value === "object" && !Array.isArray(value)
          ? Object.fromEntries(
              Object.entries(value).sort(([a], [b]) => a.localeCompare(b)),
            )
          : value,
      ),
    )
    .digest("hex");
}

export async function copyDatabase(source, destination) {
  const production = new PrismaClient({ datasourceUrl: source });
  const local = new PrismaClient({ datasourceUrl: destination });
  try {
    const data = await production.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      return snapshot(tx);
    }, transactionOptions);

    await local.$transaction(async (tx) => {
      // Keep the backup and replacement consistent even if the app is running.
      const previous = await snapshot(tx, true);
      for (const column of data.columns) {
        if (
          !previous.columns.some(
            (localColumn) =>
              localColumn.table_name === column.table_name &&
              localColumn.column_name === column.column_name,
          )
        ) {
          throw new Error(
            "Local schema is missing production columns. Run local migrations first.",
          );
        }
      }
      const folder = mkdtempSync(
        join(tmpdir(), "expense_tracker_before_prod_copy_"),
      );
      const backup = join(folder, "local_backup.json");
      writeFileSync(backup, JSON.stringify(previous), { mode: 0o600 });
      console.log(`Local backup: ${backup}`);

      // DELETE keeps FK checks active and fails safely for unexpected dependents.
      for (const table of [...tables].reverse()) {
        if (!previous.columns.some((column) => column.table_name === table))
          continue;
        await tx.$executeRawUnsafe(`DELETE FROM public.${quote(table)}`);
      }
      for (const table of tables) {
        const fields = data.columns
          .filter((column) => column.table_name === table)
          .map((column) => quote(column.column_name))
          .join(", ");
        if (!fields) continue;
        if (data.rows[table].length) {
          // PostgreSQL handles its own types and timestamp precision. Omitting
          // newer local columns lets their local defaults/nullability apply.
          await tx.$executeRawUnsafe(
            `INSERT INTO public.${quote(table)} (${fields})
             SELECT ${fields} FROM jsonb_populate_recordset(NULL::public.${quote(table)}, $1::jsonb)`,
            JSON.stringify(data.rows[table]),
          );
        }
        const copied = await tx.$queryRawUnsafe(
          `SELECT to_jsonb(t) AS data FROM (SELECT ${fields} FROM public.${quote(table)} ORDER BY id) t`,
        );
        if (
          fingerprint(copied.map((record) => record.data)) !==
          fingerprint(data.rows[table])
        ) {
          throw new Error(
            `Verification failed for ${table}; rolling back local changes.`,
          );
        }
      }
    }, transactionOptions);

    console.log("Replaced all local application data with production data:");
    for (const table of tables)
      console.log(`  ${table}: ${data.rows[table].length}`);
  } finally {
    await Promise.all([production.$disconnect(), local.$disconnect()]);
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const envFile = resolve(dirname(fileURLToPath(import.meta.url)), "../.env");
    if (existsSync(envFile)) loadEnvFile(envFile);
    const { source, destination } = validateConnections(process.env);
    await copyDatabase(source, destination);
  } catch (error) {
    // Prisma errors can contain connection details; do not print full errors.
    console.error(
      "Database copy failed. Any local replacement was rolled back.",
    );
    console.error(
      error instanceof Error
        ? error.message.replace(/postgres(?:ql)?:\/\/[^\s]+/g, "[database URL]")
        : "Unknown error",
    );
    process.exitCode = 1;
  }
}
