"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type DashboardSectionCache<T> = {
  data: T | null;
};

type DashboardSectionResult<T> = {
  data: T | null;
  isLoading: boolean;
  hasError: boolean;
  retry: () => void;
};

export function useDashboardSection<T>(
  endpoint: string,
  cache: DashboardSectionCache<T>,
): DashboardSectionResult<T> {
  const router = useRouter();
  const isMountedRef = useRef(true);
  const initialHasCachedDataRef = useRef(cache.data !== null);
  const [data, setData] = useState<T | null>(cache.data);
  const [isLoading, setIsLoading] = useState(cache.data === null);
  const [hasError, setHasError] = useState(false);
  const cacheRef = useRef(cache);

  const load = useCallback(
    async (showLoading: boolean): Promise<void> => {
      if (showLoading && isMountedRef.current) {
        setIsLoading(true);
        setHasError(false);
      }

      try {
        const response = await fetch(endpoint, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("dashboard_section_fetch_failed");
        }

        const payload = (await response.json()) as T;
        cacheRef.current.data = payload;

        if (!isMountedRef.current) {
          return;
        }

        setData(payload);
        setHasError(false);
      } catch {
        if (!isMountedRef.current) {
          return;
        }

        if (cacheRef.current.data === null) {
          setData(null);
          setHasError(true);
        }
      } finally {
        if (showLoading && isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [endpoint, router],
  );

  // eslint-disable-next-line warn-use-effect -- This effect synchronizes client-mounted dashboard section fetching with browser navigation and per-session in-memory cache reuse.
  useEffect(() => {
    isMountedRef.current = true;
    void load(!initialHasCachedDataRef.current);

    return () => {
      isMountedRef.current = false;
    };
  }, [load]);

  const retry = (): void => {
    void load(true);
  };

  return {
    data,
    isLoading,
    hasError,
    retry,
  };
}
