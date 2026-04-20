import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import { getSupabaseEnv } from './env';

const supabaseEnv = getSupabaseEnv();

export const isSupabaseConfigured = Boolean(supabaseEnv);

export const supabase = createClient(
  supabaseEnv?.supabaseUrl ?? 'http://127.0.0.1:54321',
  supabaseEnv?.supabaseAnonKey ?? 'missing-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
