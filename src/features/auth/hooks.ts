import { useContext } from 'react';

import { SessionContext } from './SessionProvider';
import type { SessionContextValue } from './SessionProvider';
import { supabase } from '../../lib/supabase';

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);

  if (!value) {
    throw new Error('useSession must be used within a SessionProvider');
  }

  return value;
}

export function useSignOut(): () => void {
  return () => {
    supabase?.auth.signOut().catch((caught) => {
      console.error('Logout error:', caught);
    });
  };
}
