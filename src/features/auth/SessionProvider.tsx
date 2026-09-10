import { createContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from '../../lib/supabase';

export type SessionContextValue = {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
};

export const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    supabase!.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (sessionError) {
          setError(`Failed to load session: ${sessionError.message}`);
          return;
        }

        setSession(data.session);
      })
      .catch((caught) => {
        const message =
          caught instanceof Error ? caught.message : 'Unable to load session.';
        setError(message);
      })
      .finally(() => setIsLoading(false));

    const {
      data: { subscription },
    } = supabase!.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ session, isLoading, error }),
    [session, isLoading, error],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
