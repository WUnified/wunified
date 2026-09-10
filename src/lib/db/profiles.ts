import { supabase } from '../supabase';

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
function getSupabaseClientOrThrow() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  return supabase;
}

// Read a profile by its Auth UUID. RLS still enforces whether the caller may
// see the requested row; this function only defines the query shape.
export async function fetchProfileByUserId(
  userId: string,
): Promise<Profile | null> {
  const client = getSupabaseClientOrThrow();

  const { data, error } = await client
    .from('profiles')
    .select('user_id, username, display_name, avatar, wsu_verified, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load profile: ${error.message}`);
  }

  return data as Profile | null;
}

// Resolve the current Auth user first, then reuse the shared profile query.
// Auth identity comes from Supabase rather than a caller-provided user ID.
export async function fetchCurrentUserProfile(): Promise<Profile | null> {
  const client = getSupabaseClientOrThrow();

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw new Error(`Failed to load current user: ${userError.message}`);
  }

  if (!user) {
    return null;
  }

  return fetchProfileByUserId(user.id);
}

// Update only the signed-in user's profile. The database's owner-only RLS is
// the security boundary; the client-side validation is for clearer feedback.
export async function upsertCurrentUserProfile(
  profileDraft: {
    username: string;
    display_name?: string;
    avatar?: string | null;
  },
): Promise<Profile> {
  const client = getSupabaseClientOrThrow();

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
    .upsert(
      {
        user_id: user.id,
        username: trimmedUsername,
        display_name: trimmedDisplayName,
        avatar: profileDraft.avatar ?? null,
      },
      { onConflict: 'user_id' },
    )
    .select('user_id, username, display_name, avatar, wsu_verified, created_at, updated_at')
    .single();

  if (error) {
    throw new Error(`Failed to save profile: ${error.message}`);
  }

  return data as Profile;
}
