"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseSearchOptionsOptions<T> {
  fetcher: (query: string) => Promise<T[]>;
  debounceMs?: number;
  initialFetch?: boolean;
}

export interface UseSearchOptionsReturn<T> {
  options: T[];
  loading: boolean;
  search: (query: string) => void;
}

/**
 * Debounced search hook for fetching options from an API.
 * Used by SearchableDropdown to provide autocomplete suggestions.
 */
export function useSearchOptions<T>(
  opts: UseSearchOptionsOptions<T>,
): UseSearchOptionsReturn<T> {
  const { fetcher, debounceMs = 300, initialFetch = false } = opts;

  const [options, setOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetchOptions = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const results = await fetcherRef.current(query);
      setOptions(results);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(
    (query: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        fetchOptions(query);
      }, debounceMs);
    },
    [debounceMs, fetchOptions],
  );

  useEffect(() => {
    if (initialFetch) {
      fetchOptions("");
    }
  }, [initialFetch, fetchOptions]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { options, loading, search };
}
