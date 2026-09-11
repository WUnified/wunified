export type SupabaseEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

const ciSmokeTestBreak = 'deliberately unused — reverted immediately after CI confirms the quality job fails';

// `process.env` is untyped (`any`) in this project. Read the two public keys we
// care about through a narrow typed view so callers get `string | undefined`.
// Read live (not snapshotted at module load) so tests that mutate
// `process.env` per-case still see current values.
type PublicSupabaseEnv = {
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
};

function readPublicEnv(): PublicSupabaseEnv {
  return {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function getSupabaseEnv(): SupabaseEnv | null {
  const publicEnv = readPublicEnv();
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
  const publicEnv = readPublicEnv();
  const missing: string[] = [];

  if (!publicEnv.EXPO_PUBLIC_SUPABASE_URL) {
    missing.push('EXPO_PUBLIC_SUPABASE_URL');
  }

  if (!publicEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }

  return missing;
}
