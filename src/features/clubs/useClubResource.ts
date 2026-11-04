import { useCallback, useEffect, useRef, useState } from 'react';

// Loads one value and reloads whenever resetKey changes. Request IDs stop an
// older response from overwriting a newer one or updating an unmounted screen.
export function useClubResource<T>(
  load: () => Promise<T>,
  resetKey: string,
  fallbackError: string,
) {
  const [data, setData] = useState<T | null>(null);
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadRef = useRef(load);
  const keyRef = useRef(resetKey);
  const requestIdRef = useRef(0);
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
  // here, so the effect that starts the first load never sets state itself.
  const fetchValue = useCallback(
    async (key: string) => {
      const requestId = ++requestIdRef.current;

      try {
        const result = await loadRef.current();
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setData(result);
        setError(null);
      } catch (loadError: unknown) {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setError(loadError instanceof Error ? loadError.message : fallbackError);
        }
      } finally {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setSettledKey(key);
          setReloading(false);
        }
      }
    },
    [fallbackError],
  );

  const reload = useCallback(() => {
    setReloading(true);
    setError(null);
    return fetchValue(keyRef.current);
  }, [fetchValue]);

  useEffect(() => {
    void fetchValue(resetKey);
  }, [fetchValue, resetKey]);

  const current = settledKey === resetKey;
  return {
    data,
    loading: reloading || !current,
    error: current ? error : null,
    reload,
  };
}
