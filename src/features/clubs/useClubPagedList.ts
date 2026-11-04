import { useCallback, useEffect, useRef, useState } from 'react';

import type { ClubPageResult } from './types';

// Offset-paged list state shared by clubs and members. Changing resetKey (for
// example a new search term) restarts from page 0. A reload supersedes any
// in-flight request; loadMore never overlaps one. Appended pages drop IDs that
// were already shown because offset pages can overlap as rows change.
export function useClubPagedList<T extends { id: string }>(
  load: (page: number) => Promise<ClubPageResult<T>>,
  resetKey: string,
  fallbackError: string,
) {
  const [items, setItems] = useState<T[]>([]);
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadRef = useRef(load);
  const keyRef = useRef(resetKey);
  const nextPageRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);
  const inFlightRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    loadRef.current = load;
    keyRef.current = resetKey;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  // Loading for a changed resetKey is derived from settledKey rather than set
  // here, so the effect that starts the first page never sets state itself.
  const runLoad = useCallback(
    async (page: number, append: boolean, key: string) => {
      const requestId = ++requestIdRef.current;
      inFlightRef.current = requestId;
      if (!append) nextPageRef.current = null;

      try {
        const result = await loadRef.current(page);
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setItems((current) => {
          if (!append) return result.items;
          const seen = new Set(current.map((item) => item.id));
          return [...current, ...result.items.filter((item) => !seen.has(item.id))];
        });
        setHasMore(result.hasMore);
        setError(null);
        nextPageRef.current = result.nextPage;
      } catch (loadError: unknown) {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setError(loadError instanceof Error ? loadError.message : fallbackError);
          if (!append) setHasMore(false);
        }
      } finally {
        if (inFlightRef.current === requestId) inFlightRef.current = null;
        if (mountedRef.current && requestId === requestIdRef.current) {
          setSettledKey(key);
          setReloading(false);
          setLoadingMore(false);
        }
      }
    },
    [fallbackError],
  );

  const reload = useCallback(() => {
    setReloading(true);
    setLoadingMore(false);
    setError(null);
    return runLoad(0, false, keyRef.current);
  }, [runLoad]);

  const loadMore = useCallback(async () => {
    const page = nextPageRef.current;
    if (page === null || inFlightRef.current !== null) return;
    setLoadingMore(true);
    setError(null);
    await runLoad(page, true, keyRef.current);
  }, [runLoad]);

  useEffect(() => {
    void runLoad(0, false, resetKey);
  }, [runLoad, resetKey]);

  const current = settledKey === resetKey;
  return {
    items,
    loading: reloading || !current,
    loadingMore,
    hasMore: current && hasMore,
    error: current ? error : null,
    reload,
    loadMore,
  };
}
