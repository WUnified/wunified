import { isAuthSessionMissingError, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../types/database';
import { supabase } from '../supabase';

type DbClient = SupabaseClient<Database> | null;

// This adapter owns private profile access. Public-facing identity reads should
// use public_profiles instead of widening the RLS policy on this table.
// This shape mirrors the profile columns exposed by the current migrations.
// Keep it at the database boundary so feature code does not depend on raw rows.
export type Profile = {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  wsu_verified: boolean;
  created_at: string;
  updated_at: string;
};

// The client is nullable when Expo environment variables are absent. Failing
// here produces an actionable configuration error instead of a null crash.
// The optional client parameter on each function exists so API integration tests
// can act as a specific signed-in user; the app always uses the shared client.
function getSupabaseClientOrThrow(client: DbClient) {
  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  return client;
}

// Read a profile by its Auth UUID. RLS still enforces whether the caller may
// see the requested row; this function only defines the query shape.
export async function fetchProfileByUserId(
  userId: string,
  dbClient: DbClient = supabase,
): Promise<Profile | null> {
  const client = getSupabaseClientOrThrow(dbClient);

  const { data, error } = await client
    .from('profiles')
    .select('user_id, username, display_name, avatar, wsu_verified, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load profile: ${error.message}`);
  }

  return data;
}

// Resolve the current Auth user first, then reuse the shared profile query.
// Auth identity comes from Supabase rather than a caller-provided user ID.
export async function fetchCurrentUserProfile(
  dbClient: DbClient = supabase,
): Promise<Profile | null> {
  const client = getSupabaseClientOrThrow(dbClient);

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  // Signed out surfaces as AuthSessionMissingError rather than a null user; it is
  // the "no profile" case, not a failure. Other auth errors still throw.
  if (isAuthSessionMissingError(userError)) {
    return null;
  }

  if (userError) {
    throw new Error(`Failed to load current user: ${userError.message}`);
  }

  if (!user) {
    return null;
  }

  return fetchProfileByUserId(user.id, client);
}

// Update only the signed-in user's profile. The database's owner-only RLS is
// the security boundary; the client-side validation is for clearer feedback.
export async function updateCurrentUserProfile(
  profileDraft: {
    username: string;
    display_name?: string;
    avatar?: string | null;
  },
  dbClient: DbClient = supabase,
): Promise<Profile> {
  const client = getSupabaseClientOrThrow(dbClient);

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw new Error(`Failed to load current user: ${userError.message}`);
  }

  if (!user) {
    throw new Error('You must be signed in to update your profile.');
  }

  // Username is the unique handle; display name is editable and may differ.
  const trimmedUsername = profileDraft.username.trim();
  const trimmedDisplayName = (profileDraft.display_name ?? profileDraft.username).trim();

  if (!trimmedUsername) {
    throw new Error('Username is required.');
  }

  if (!trimmedDisplayName) {
    throw new Error('Display name is required.');
  }

  const { data, error } = await client
    .from('profiles')
    .update({
      username: trimmedUsername,
      display_name: trimmedDisplayName,
      avatar: profileDraft.avatar ?? null,
    })
    .eq('user_id', user.id)
    .select('user_id, username, display_name, avatar, wsu_verified, created_at, updated_at')
    .single();

  if (error) {
    throw new Error(`Failed to save profile: ${error.message}`);
  }

  return data;
}
