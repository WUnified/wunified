import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import { getSupabaseEnv } from './env';

const supabaseEnv = getSupabaseEnv();

export const isSupabaseConfigured = Boolean(supabaseEnv);

export const supabase = supabaseEnv
  ? createClient(supabaseEnv.supabaseUrl, supabaseEnv.supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
