import { useCallback, useEffect, useRef, useState } from 'react';

// Loads one value and reloads whenever resetKey changes. Request IDs stop an
// older response from overwriting a newer one or updating an unmounted screen.
export function useClubResource<T>(
  load: () => Promise<T>,
  resetKey: string,
  fallbackError: string,
) {
  const [data, setData] = useState<T | null>(null);
  const [dataKey, setDataKey] = useState<string | null>(null);
  const [tracker, setTracker] = useState({ key: resetKey, generation: 0 });
  const [settledGeneration, setSettledGeneration] = useState<number | null>(null);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadRef = useRef(load);
  const keyRef = useRef(resetKey);
  const generationRef = useRef(0);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  // Every resetKey change starts a new generation, even when the key returns to
  // an earlier value, so a settled A cannot be mistaken for the fresh A request.
  let generation = tracker.generation;
  if (tracker.key !== resetKey) {
    generation += 1;
    setTracker({ key: resetKey, generation });
  }

  useEffect(() => {
    loadRef.current = load;
    keyRef.current = resetKey;
    generationRef.current = generation;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  // Loading for a changed resetKey is derived from settledGeneration rather than
  // set here, so the effect that starts the first load never sets state itself.
  const fetchValue = useCallback(
    async (key: string, requestGeneration: number) => {
      const requestId = ++requestIdRef.current;

      try {
        const result = await loadRef.current();
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setData(result);
        setDataKey(key);
        setError(null);
      } catch (loadError: unknown) {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setError(loadError instanceof Error ? loadError.message : fallbackError);
        }
      } finally {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setSettledGeneration(requestGeneration);
          setReloading(false);
        }
      }
    },
    [fallbackError],
  );

  const reload = useCallback(() => {
    setReloading(true);
    setError(null);
    return fetchValue(keyRef.current, generationRef.current);
  }, [fetchValue]);

  useEffect(() => {
    void fetchValue(resetKey, generation);
  }, [fetchValue, resetKey, generation]);

  const current = settledGeneration === generation;
  return {
    data: dataKey === resetKey ? data : null,
    loading: reloading || !current,
    error: current ? error : null,
    reload,
  };
}
