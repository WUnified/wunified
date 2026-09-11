export type SupabaseEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

// `process.env` is untyped (`any`) in this project. Read the two public keys we
// care about through a narrow typed view so callers get `string | undefined`.
type PublicSupabaseEnv = {
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
};

const publicEnv: PublicSupabaseEnv = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
};

export function getSupabaseEnv(): SupabaseEnv | null {
  const supabaseUrl = publicEnv.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = publicEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

export function getMissingSupabaseEnvNames(): string[] {
  const missing: string[] = [];

  if (!publicEnv.EXPO_PUBLIC_SUPABASE_URL) {
    missing.push('EXPO_PUBLIC_SUPABASE_URL');
  }

  if (!publicEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }

  return missing;
}
