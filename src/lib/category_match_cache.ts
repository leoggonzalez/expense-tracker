"use client";

import type {
  CategoryRuleMatchMode,
  TransactionCategory,
} from "@prisma/client";
import { useEffect, useState } from "react";

import type { CategoryDefaultRule } from "@/lib/category_matching";

export type CategoryMatchRecordSnapshot = {
  id: string;
  userAccountId: string;
  normalizedDescription: string;
  matchMode: CategoryRuleMatchMode;
  transactionType: string;
  category: TransactionCategory;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type CategoryMatchCacheSnapshot = {
  ownerId: string;
  rulesVersion: number;
  matches: CategoryMatchRecordSnapshot[];
  defaults: CategoryDefaultRule[];
  defaultsVersion: string;
  loadedAt: number;
  stale: boolean;
};

type CategoryMatchPayload = Omit<
  CategoryMatchCacheSnapshot,
  "loadedAt" | "stale"
> & {
  normalizationVersion: number;
};

type CategoryMatchPatch = {
  ownerId: string;
  rulesVersion: number;
  match: Pick<
    CategoryMatchRecordSnapshot,
    "normalizedDescription" | "transactionType" | "category"
  >;
};

type CategoryMatchChannelMessage =
  | CategoryMatchPatch
  | { type: "logout"; ownerId: string };

// Revalidate on form activation or focus after one minute; never fetch while typing.
const snapshotMaxAgeMs = 60_000;

const cache = new Map<string, CategoryMatchCacheSnapshot>();
const inFlight = new Map<string, Promise<CategoryMatchCacheSnapshot | null>>();
const listeners = new Map<string, Set<() => void>>();
const channels = new Map<string, BroadcastChannel>();
const requestTokens = new Map<string, object>();
const pendingPatches = new Map<string, CategoryMatchPatch[]>();
let activeOwnerId = "";

function activateOwner(ownerId: string): void {
  if (activeOwnerId && activeOwnerId !== ownerId) {
    cache.delete(activeOwnerId);
    inFlight.delete(activeOwnerId);
    requestTokens.delete(activeOwnerId);
    pendingPatches.delete(activeOwnerId);
    channels.get(activeOwnerId)?.close();
    channels.delete(activeOwnerId);
  }
  activeOwnerId = ownerId;
}

function notify(ownerId: string): void {
  listeners.get(ownerId)?.forEach((listener) => listener());
}

function currentChannel(ownerId: string): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  let channel = channels.get(ownerId);
  if (!channel) {
    channel = new BroadcastChannel(`transaction-category-matches:${ownerId}`);
    channel.onmessage = (event: MessageEvent<CategoryMatchChannelMessage>) => {
      const message = event.data;
      if (
        message &&
        "type" in message &&
        message.type === "logout" &&
        message.ownerId === ownerId
      ) {
        cache.delete(ownerId);
        inFlight.delete(ownerId);
        requestTokens.delete(ownerId);
        notify(ownerId);
        return;
      }
      const patch = message as CategoryMatchPatch;
      if (patch?.ownerId !== ownerId || !patch.match) return;
      const snapshot = cache.get(ownerId);
      if (!snapshot) return;
      if (patch.rulesVersion <= snapshot.rulesVersion) return;
      if (snapshot.stale || patch.rulesVersion !== snapshot.rulesVersion + 1) {
        cache.set(ownerId, { ...snapshot, stale: true });
      } else {
        const matches = snapshot.matches.filter(
          (match) =>
            match.normalizedDescription !== patch.match.normalizedDescription ||
            match.transactionType !== patch.match.transactionType ||
            match.matchMode !== "exact",
        );
        matches.push({
          id: "",
          userAccountId: ownerId,
          normalizedDescription: patch.match.normalizedDescription,
          matchMode: "exact",
          transactionType: patch.match.transactionType,
          category: patch.match.category,
          createdAt: new Date(0).toISOString(),
          updatedAt: new Date().toISOString(),
        });
        cache.set(ownerId, {
          ...snapshot,
          rulesVersion: patch.rulesVersion,
          matches,
          stale: false,
        });
      }
      notify(ownerId);
    };
    channels.set(ownerId, channel);
  }
  return channel;
}

export function getCategoryMatchSnapshot(
  ownerId: string,
): CategoryMatchCacheSnapshot | null {
  return cache.get(ownerId) ?? null;
}

export function clearCategoryMatchCache(): void {
  for (const [ownerId, channel] of channels) {
    channel.postMessage({ type: "logout", ownerId });
    channel.close();
  }
  channels.clear();
  cache.clear();
  inFlight.clear();
  requestTokens.clear();
  pendingPatches.clear();
  activeOwnerId = "";
  for (const ownerId of listeners.keys()) notify(ownerId);
}

export function useCategoryMatches(
  ownerId: string,
): CategoryMatchCacheSnapshot | null {
  const [snapshot, setSnapshot] = useState<CategoryMatchCacheSnapshot | null>(
    () => (ownerId ? getCategoryMatchSnapshot(ownerId) : null),
  );

  // eslint-disable-next-line warn-use-effect -- This effect synchronizes the account-scoped memory cache with the authenticated match bootstrap and BroadcastChannel.
  useEffect(() => {
    if (!ownerId) {
      setSnapshot(null);
      return;
    }
    activateOwner(ownerId);
    setSnapshot(getCategoryMatchSnapshot(ownerId));
    const unsubscribe = subscribeToCategoryMatches(ownerId, () => {
      setSnapshot(getCategoryMatchSnapshot(ownerId));
    });
    const refresh = () => {
      if (document.visibilityState === "visible")
        void loadCategoryMatches(ownerId);
    };
    void loadCategoryMatches(ownerId);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [ownerId]);

  // eslint-disable-next-line warn-use-effect -- This effect refreshes once when a cross-tab version gap marks the active account cache stale.
  useEffect(() => {
    if (ownerId && snapshot?.stale) void loadCategoryMatches(ownerId);
  }, [ownerId, snapshot?.stale]);

  return snapshot?.ownerId === ownerId ? snapshot : null;
}

export function subscribeToCategoryMatches(
  ownerId: string,
  listener: () => void,
): () => void {
  const ownerListeners = listeners.get(ownerId) ?? new Set<() => void>();
  ownerListeners.add(listener);
  listeners.set(ownerId, ownerListeners);
  currentChannel(ownerId);
  return () => {
    ownerListeners.delete(listener);
    if (!ownerListeners.size) {
      listeners.delete(ownerId);
      channels.get(ownerId)?.close();
      channels.delete(ownerId);
    }
  };
}

export async function loadCategoryMatches(
  ownerId: string,
): Promise<CategoryMatchCacheSnapshot | null> {
  activateOwner(ownerId);
  const existing = cache.get(ownerId);
  if (
    existing &&
    !existing.stale &&
    Date.now() - existing.loadedAt < snapshotMaxAgeMs
  )
    return existing;
  const pending = inFlight.get(ownerId);
  if (pending) return pending;

  const token = {};
  requestTokens.set(ownerId, token);
  const request = fetch("/api/transactions/category-matches", {
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) return null;
      const payload = (await response.json()) as CategoryMatchPayload;
      if (
        activeOwnerId !== ownerId ||
        requestTokens.get(ownerId) !== token ||
        payload.ownerId !== ownerId ||
        payload.normalizationVersion !== 1 ||
        !Array.isArray(payload.matches) ||
        !Array.isArray(payload.defaults) ||
        typeof payload.defaultsVersion !== "string"
      ) {
        return null;
      }
      // A manual save can finish while this bootstrap is in flight. Keep any newer personal patch.
      const current = cache.get(ownerId);
      const newerPersonal =
        current && current.rulesVersion > payload.rulesVersion;
      const snapshot: CategoryMatchCacheSnapshot = {
        ownerId,
        rulesVersion: newerPersonal
          ? current.rulesVersion
          : payload.rulesVersion,
        matches: newerPersonal ? current.matches : payload.matches,
        defaults: payload.defaults,
        defaultsVersion: payload.defaultsVersion,
        loadedAt: Date.now(),
        stale: false,
      };
      // An explicit save can also finish before the first bootstrap has produced a snapshot.
      const queued = (pendingPatches.get(ownerId) ?? []).sort(
        (a, b) => a.rulesVersion - b.rulesVersion,
      );
      for (const patch of queued) {
        if (patch.rulesVersion <= snapshot.rulesVersion) continue;
        if (patch.rulesVersion !== snapshot.rulesVersion + 1)
          snapshot.stale = true;
        snapshot.matches = snapshot.matches.filter(
          (match) =>
            match.normalizedDescription !== patch.match.normalizedDescription ||
            match.transactionType !== patch.match.transactionType ||
            match.matchMode !== "exact",
        );
        snapshot.matches.push({
          ...patch.match,
          id: "",
          userAccountId: ownerId,
          matchMode: "exact",
          createdAt: new Date(0).toISOString(),
          updatedAt: new Date().toISOString(),
        });
        snapshot.rulesVersion = patch.rulesVersion;
      }
      pendingPatches.delete(ownerId);
      cache.set(ownerId, snapshot);
      notify(ownerId);
      return snapshot;
    })
    .catch(() => null)
    .finally(() => {
      if (inFlight.get(ownerId) === request) inFlight.delete(ownerId);
      if (requestTokens.get(ownerId) === token) requestTokens.delete(ownerId);
    });
  inFlight.set(ownerId, request);
  return request;
}

export function applyCategoryMatchPatch(patch: CategoryMatchPatch): void {
  const snapshot = cache.get(patch.ownerId);
  if (!snapshot && activeOwnerId === patch.ownerId) {
    const queued = pendingPatches.get(patch.ownerId) ?? [];
    queued.push(patch);
    pendingPatches.set(patch.ownerId, queued);
  }
  if (snapshot) {
    if (patch.rulesVersion <= snapshot.rulesVersion) return;
    if (!snapshot.stale && patch.rulesVersion === snapshot.rulesVersion + 1) {
      const matches = snapshot.matches.filter(
        (match) =>
          match.normalizedDescription !== patch.match.normalizedDescription ||
          match.transactionType !== patch.match.transactionType ||
          match.matchMode !== "exact",
      );
      matches.push({
        id: "",
        userAccountId: patch.ownerId,
        normalizedDescription: patch.match.normalizedDescription,
        matchMode: "exact",
        transactionType: patch.match.transactionType,
        category: patch.match.category as TransactionCategory,
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date().toISOString(),
      });
      cache.set(patch.ownerId, {
        ...snapshot,
        rulesVersion: patch.rulesVersion,
        matches,
        stale: false,
      });
      notify(patch.ownerId);
    } else if (patch.rulesVersion !== snapshot.rulesVersion) {
      cache.set(patch.ownerId, { ...snapshot, stale: true });
      notify(patch.ownerId);
    }
  }
  currentChannel(patch.ownerId)?.postMessage(patch);
}
