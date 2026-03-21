"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type ProtectedPageSectionCache<T> = {
  entries: Map<string, T>;
};

type ProtectedPageSectionResult<T> = {
  data: T | null;
  isLoading: boolean;
  hasError: boolean;
  isNotFound: boolean;
  retry: () => void;
};

export function useProtectedPageSection<T>(
  endpoint: string,
  cacheKey: string,
  cache: ProtectedPageSectionCache<T>,
): ProtectedPageSectionResult<T> {
  const router = useRouter();
  const isMountedRef = useRef(true);
  const activeRequestKeyRef = useRef(cacheKey);
  const cacheRef = useRef(cache);
  const [data, setData] = useState<T | null>(cache.entries.get(cacheKey) ?? null);
  const [isLoading, setIsLoading] = useState(!cache.entries.has(cacheKey));
  const [hasError, setHasError] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);

  const load = useCallback(
    async (
      showLoading: boolean,
      requestKey: string,
      requestEndpoint: string,
    ): Promise<void> => {
      activeRequestKeyRef.current = requestKey;

      if (showLoading && isMountedRef.current) {
        setIsLoading(true);
        setHasError(false);
        setIsNotFound(false);
      }

      try {
        const response = await fetch(requestEndpoint, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (response.status === 404) {
          if (
            !isMountedRef.current ||
            activeRequestKeyRef.current !== requestKey
          ) {
            return;
          }

          setData(null);
          setHasError(false);
          setIsNotFound(true);
          return;
        }

        if (!response.ok) {
          throw new Error("protected_page_section_fetch_failed");
        }

        const payload = (await response.json()) as T;
        cacheRef.current.entries.set(requestKey, payload);

        if (
          !isMountedRef.current ||
          activeRequestKeyRef.current !== requestKey
        ) {
          return;
        }

        setData(payload);
        setHasError(false);
        setIsNotFound(false);
      } catch {
        if (
          !isMountedRef.current ||
          activeRequestKeyRef.current !== requestKey
        ) {
          return;
        }

        const cachedData = cacheRef.current.entries.get(requestKey) ?? null;

        if (cachedData === null) {
          setData(null);
          setHasError(true);
          setIsNotFound(false);
        } else {
          setData(cachedData);
          setHasError(false);
          setIsNotFound(false);
        }
      } finally {
        if (
          showLoading &&
          isMountedRef.current &&
          activeRequestKeyRef.current === requestKey
        ) {
          setIsLoading(false);
        }
      }
    },
    [router],
  );

  // eslint-disable-next-line warn-use-effect -- This effect synchronizes client-mounted protected section fetching with browser navigation and per-request cache reuse.
  useEffect(() => {
    isMountedRef.current = true;
    activeRequestKeyRef.current = cacheKey;

    const cachedData = cacheRef.current.entries.get(cacheKey) ?? null;

    setData(cachedData);
    setIsLoading(cachedData === null);
    setHasError(false);
    setIsNotFound(false);

    void load(cachedData === null, cacheKey, endpoint);

    return () => {
      isMountedRef.current = false;
    };
  }, [cacheKey, endpoint, load]);

  function retry(): void {
    void load(true, cacheKey, endpoint);
  }

  return {
    data,
    isLoading,
    hasError,
    isNotFound,
    retry,
  };
}
