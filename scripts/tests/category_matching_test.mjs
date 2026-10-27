import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { register } from "tsx/esm/api";
import "tsx/cjs";
import { TransactionCategory } from "@prisma/client";

register();
const { resolveTransactionCategory, normalizeTransactionDescription } =
  await import("../../src/lib/category_matching.ts");
const { transactionCategoryCatalog } =
  await import("../../src/lib/category_catalog.ts");
const defaults = [
  {
    id: "pet",
    pattern: "cat insurance",
    transactionType: "expense",
    matchMode: "phrase",
    category: "pets",
    priority: 0,
  },
  {
    id: "insurance",
    pattern: "insurance",
    transactionType: "expense",
    matchMode: "phrase",
    category: "insurance",
    priority: 10,
  },
  {
    id: "shop",
    pattern: "example shop",
    transactionType: "expense",
    matchMode: "exact",
    category: "shopping",
    priority: 20,
  },
  {
    id: "income",
    pattern: "",
    transactionType: "income",
    matchMode: "all",
    category: "income",
    priority: 100,
  },
];
const resolve = (
  description,
  type = "expense",
  personal = [],
  rules = defaults,
) => resolveTransactionCategory(description, type, personal, rules);

test("matching is data-driven, normalized, boundary-safe, and ordered by priority", () => {
  assert.deepEqual(resolve("  CAT   insurance premium  "), {
    category: "pets",
    source: "rule",
  });
  assert.equal(resolve("car insurance").category, "insurance");
  assert.equal(resolve("Example shop").category, "shopping");
  assert.equal(resolve("Example shop unrelated").category, "uncategorized");
  assert.equal(resolve("reinsurance").category, "uncategorized");
  assert.equal(resolve("constructor").category, "uncategorized");
  assert.equal(
    resolve("Example shop", "expense", [], []).category,
    "uncategorized",
  );
  assert.equal(resolve("salary", "income").category, "income");
  assert.equal(resolve("salary", "income", [], []).category, "uncategorized");
  assert.equal(normalizeTransactionDescription("  ＣＡＴ  food "), "cat food");
  const reversed = [...defaults].reverse();
  assert.deepEqual(
    resolve("cat insurance", "expense", [], reversed),
    resolve("cat insurance"),
  );
  assert.equal(
    resolve(
      "cat insurance",
      "expense",
      [],
      defaults.map((r) => ({
        ...r,
        priority: r.id === "insurance" ? -1 : r.priority,
      })),
    ).category,
    "insurance",
  );
});

test("personal exact corrections override personal phrases and all shared defaults", () => {
  const personal = [
    {
      normalizedDescription: "santiago",
      transactionType: "expense",
      matchMode: "phrase",
      category: "pets",
    },
  ];
  assert.equal(
    resolve("Santiago insurance", "expense", personal).category,
    "pets",
  );
  assert.equal(resolve("Santiago insurance").category, "insurance");
  assert.equal(
    resolve("Santiagoland", "expense", personal).category,
    "uncategorized",
  );
  personal.push({
    normalizedDescription: "santiago insurance",
    transactionType: "expense",
    matchMode: "exact",
    category: "uncategorized",
  });
  assert.deepEqual(resolve("Santiago insurance", "expense", personal), {
    category: "uncategorized",
    source: "learned",
  });
  assert.equal(resolve("Santiago", "income", personal).category, "income");
  assert.equal(
    resolve("Santiago insurance", "income", personal).category,
    "income",
  );
});

test("database text is treated as literal phrases rather than regex", () => {
  const rules = [{ ...defaults[0], pattern: "a+b (test)" }];
  assert.equal(
    resolve("purchase a+b (test)", "expense", [], rules).category,
    "pets",
  );
  assert.equal(
    resolve("purchase aaab test", "expense", [], rules).category,
    "uncategorized",
  );
  assert.equal(
    resolve("anything", "expense", [], [{ ...rules[0], pattern: "" }]).category,
    "uncategorized",
  );
});

test("every schema category has catalog metadata and labels in all locales", async () => {
  const keys = Object.values(TransactionCategory).sort();
  assert.deepEqual(Object.keys(transactionCategoryCatalog).sort(), keys);
  for (const locale of ["en", "es", "pt_br"]) {
    const messages = JSON.parse(
      await readFile(
        new URL(`../../src/locales/${locale}.json`, import.meta.url),
        "utf8",
      ),
    );
    for (const key of keys)
      assert.ok(messages.transaction_categories[key], `${locale}: ${key}`);
  }
});
