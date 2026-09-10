import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from '../../lib/supabase';

export type SessionContextValue = {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  /** Re-run the initial session load after a failure. */
  retry: () => void;
};

export const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    supabase!.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!isMounted.current) {
          return;
        }
        if (sessionError) {
          setError(`Failed to load session: ${sessionError.message}`);
          return;
        }
        setSession(data.session);
      })
      .catch((caught) => {
        if (!isMounted.current) {
          return;
        }
        setError(
          caught instanceof Error ? caught.message : 'Unable to load session.',
        );
      })
      .finally(() => {
        if (isMounted.current) {
          setIsLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase!.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      // A later auth event means the client recovered — drop a stale load error.
      setError(null);
    });

    return () => subscription.unsubscribe();
  }, [reloadKey]);

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  const value = useMemo<SessionContextValue>(
    () => ({ session, isLoading, error, retry }),
    [session, isLoading, error, retry],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
