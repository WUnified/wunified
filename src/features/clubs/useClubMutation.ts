import { useEffect, useRef, useState } from 'react';

// Mutations resolve to null on failure so screens keep their form values and
// render the hook's error instead of catching at every call site.
export function useClubMutation<TInput, TResult>(
  operation: (input: TInput) => Promise<TResult>,
  fallbackError: string,
) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function submit(input: TInput): Promise<TResult | null> {
    if (savingRef.current) return null;

    savingRef.current = true;
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const result = await operation(input);
      if (mountedRef.current) setSuccess(true);
      return result;
    } catch (mutationError: unknown) {
      if (mountedRef.current) {
        setError(mutationError instanceof Error ? mutationError.message : fallbackError);
      }
      return null;
    } finally {
      savingRef.current = false;
      if (mountedRef.current) setSaving(false);
    }
  }

  return { saving, success, error, submit };
}
