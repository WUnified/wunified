export type SupabaseEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export function getSupabaseEnv(): SupabaseEnv | null {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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

  if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
    missing.push('EXPO_PUBLIC_SUPABASE_URL');
  }

  if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }

  return missing;
}
