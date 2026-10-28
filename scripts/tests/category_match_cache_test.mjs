import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { register } from "tsx/esm/api";
import "tsx/cjs";
register();
const cache = await import("../../src/lib/category_match_cache.ts");
const { resolveTransactionCategory } =
  await import("../../src/lib/category_matching.ts");

const payload = (ownerId, defaultsVersion = "v1", category = "shopping") => ({
  ownerId,
  normalizationVersion: 1,
  rulesVersion: 0,
  matches: [],
  defaultsVersion,
  defaults: [
    {
      id: "shared",
      pattern: "test store",
      transactionType: "expense",
      matchMode: "exact",
      category,
      priority: 0,
    },
  ],
});

test("cached database rules avoid typing requests, refresh after focus-age, and retain personal patches", async () => {
  const originalChannel = globalThis.BroadcastChannel;
  globalThis.BroadcastChannel = class {
    postMessage() {}
    close() {}
  };
  let time = 1000;
  let requests = 0;
  const timeMock = mock.method(Date, "now", () => time);
  const fetchMock = mock.method(globalThis, "fetch", async () => {
    requests++;
    return {
      ok: true,
      json: async () =>
        payload(
          "owner",
          requests === 1 ? "v1" : "v2",
          requests === 1 ? "shopping" : "travel",
        ),
    };
  });
  try {
    const [first, concurrent] = await Promise.all([
      cache.loadCategoryMatches("owner"),
      cache.loadCategoryMatches("owner"),
    ]);
    assert.equal(requests, 1);
    assert.deepEqual(first, concurrent);
    for (let index = 0; index < 30; index++) {
      const snapshot = await cache.loadCategoryMatches("owner");
      resolveTransactionCategory(
        `description ${index}`,
        "expense",
        snapshot.matches,
        snapshot.defaults,
      );
    }
    assert.equal(
      requests,
      1,
      "repeated form use and typing reuse the bootstrap",
    );
    cache.applyCategoryMatchPatch({
      ownerId: "owner",
      rulesVersion: 1,
      match: {
        normalizedDescription: "test store",
        transactionType: "expense",
        category: "pets",
      },
    });
    const personal = cache.getCategoryMatchSnapshot("owner");
    assert.equal(
      resolveTransactionCategory(
        "test store",
        "expense",
        personal.matches,
        personal.defaults,
      ).category,
      "pets",
    );
    time += 61000;
    const refreshed = await cache.loadCategoryMatches("owner");
    assert.equal(requests, 2);
    assert.equal(refreshed.defaultsVersion, "v2");
    assert.equal(refreshed.defaults[0].category, "travel");
    assert.equal(
      refreshed.matches[0].category,
      "pets",
      "late bootstrap must preserve newer manual learning",
    );
    assert.equal(
      resolveTransactionCategory(
        "test store",
        "expense",
        refreshed.matches,
        refreshed.defaults,
      ).category,
      "pets",
    );
  } finally {
    cache.clearCategoryMatchCache();
    fetchMock.mock.restore();
    timeMock.mock.restore();
    globalThis.BroadcastChannel = originalChannel;
  }
});

test("late responses for another account cannot restore its personal rules", async () => {
  let finishOld;
  const fetchMock = mock.method(
    globalThis,
    "fetch",
    () =>
      new Promise((resolve) => {
        finishOld = resolve;
      }),
  );
  try {
    const old = cache.loadCategoryMatches("old-owner");
    fetchMock.mock.mockImplementation(async () => ({
      ok: true,
      json: async () => payload("new-owner"),
    }));
    assert.equal(
      (await cache.loadCategoryMatches("new-owner")).ownerId,
      "new-owner",
    );
    finishOld({ ok: true, json: async () => payload("old-owner") });
    assert.equal(await old, null);
    assert.equal(cache.getCategoryMatchSnapshot("old-owner"), null);
    assert.equal(cache.getCategoryMatchSnapshot("new-owner").matches.length, 0);
  } finally {
    cache.clearCategoryMatchCache();
    fetchMock.mock.restore();
  }
});

test("a manual save finishing during the first bootstrap is retained", async () => {
  const originalChannel = globalThis.BroadcastChannel;
  globalThis.BroadcastChannel = class {
    postMessage() {}
    close() {}
  };
  let finish;
  const fetchMock = mock.method(
    globalThis,
    "fetch",
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  try {
    const first = cache.loadCategoryMatches("owner");
    cache.applyCategoryMatchPatch({
      ownerId: "owner",
      rulesVersion: 1,
      match: {
        normalizedDescription: "test store",
        transactionType: "expense",
        category: "pets",
      },
    });
    finish({ ok: true, json: async () => payload("owner") });
    const result = await first;
    assert.equal(result.rulesVersion, 1);
    assert.equal(
      resolveTransactionCategory(
        "test store",
        "expense",
        result.matches,
        result.defaults,
      ).category,
      "pets",
    );
  } finally {
    cache.clearCategoryMatchCache();
    fetchMock.mock.restore();
    globalThis.BroadcastChannel = originalChannel;
  }
});
