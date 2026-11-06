import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../types/database';

export type TestClient = SupabaseClient<Database>;

// Deterministic fixtures from supabase/seed.sql. Tests may read seeded rows but
// must not change them — create your own rows for anything that mutates state.
export const SEED = {
  password: 'wunified-test-password',
  users: {
    maya: { id: '10000000-0000-0000-0000-000000000001', email: 'maya.thompson@example.test' },
    jordan: { id: '10000000-0000-0000-0000-000000000002', email: 'jordan.lee@example.test' },
    samir: { id: '10000000-0000-0000-0000-000000000003', email: 'samir.patel@example.test' },
  },
  listings: {
    mayaTextbooks: '20000000-0000-0000-0000-000000000001',
    jordanDeskLamp: '20000000-0000-0000-0000-000000000002',
  },
  boardPosts: { mayaStudyGroup: '30000000-0000-0000-0000-000000000001' },
  clubs: { localTestClub: '50000000-0000-0000-0000-000000000001' },
  // Members: maya (owner) + jordan. samir is deliberately outside it.
  chats: { mayaJordanDirect: '60000000-0000-0000-0000-000000000001' },
} as const;

export type SeedUserName = keyof typeof SEED.users;

function readStackEnv() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase test env is missing; globalSetup should have caught this.');
  }
  return { url, anonKey };
}

/** A client with no session — what a signed-out visitor can do. */
export function createAnonClient(): TestClient {
  const { url, anonKey } = readStackEnv();
  // Each client keeps its session in memory only, so several users can be
  // signed in side by side within one test file.
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** A client signed in as one of the seeded users. */
export async function signInAs(user: SeedUserName): Promise<TestClient> {
  const client = createAnonClient();
  const { error } = await client.auth.signInWithPassword({
    email: SEED.users[user].email,
    password: SEED.password,
  });
  if (error) {
    throw new Error(`Could not sign in as seed user "${user}": ${error.message}`);
  }
  return client;
}

/**
 * Signs up a brand-new user. Use it when a test needs a user with no history,
 * or must mutate a profile without touching the shared seed users.
 */
export async function signUpNewUser(): Promise<{ client: TestClient; userId: string }> {
  const client = createAnonClient();
  const suffix = uniqueSuffix();
  const { data, error } = await client.auth.signUp({
    email: `it-${suffix}@example.test`,
    password: SEED.password,
    options: { data: { username: `it_${suffix}`, display_name: `Integration ${suffix}` } },
  });
  // Local GoTrue auto-confirms, so a successful signup always returns a session.
  if (error || !data.user || !data.session) {
    throw new Error(`Could not sign up a test user: ${error?.message ?? 'no session returned'}`);
  }
  return { client, userId: data.user.id };
}

/**
 * Short unique suffix for test-created rows. The database is shared across runs
 * locally, so tests find their own rows by this value, never by row counts.
 */
export function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
