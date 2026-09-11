import type { ProfileDraft, ProfileRecord } from './types';
import { fetchCurrentUserProfile, upsertCurrentUserProfile, type Profile } from '../../lib/db';

// Translate the database record into the feature contract. Keeping this mapper
// here prevents database response details from leaking into UI-facing code.
// Exported so it can be unit-tested without touching the database client.
export function mapProfile(profile: Profile | null): ProfileRecord | null {
  if (!profile) {
    return null;
  }

  return {
    user_id: profile.user_id,
    username: profile.username,
    display_name: profile.display_name,
    avatar: profile.avatar,
    wsu_verified: profile.wsu_verified,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

// Load the current profile and normalize low-level database errors for callers.
export async function loadCurrentProfile(): Promise<ProfileRecord | null> {
  try {
    return mapProfile(await fetchCurrentUserProfile());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load profile.';
    throw new Error(
      message.startsWith('Failed to load profile:')
        ? message
        : `Failed to load profile: ${message}`,
    );
  }
}

// Save profile edits through the shared database adapter, then return the same
// feature-level shape used by profile reads.
export async function saveProfile(draft: ProfileDraft): Promise<ProfileRecord> {
  try {
    const profile = await upsertCurrentUserProfile(draft);

    return {
      user_id: profile.user_id,
      username: profile.username,
      display_name: profile.display_name,
      avatar: profile.avatar,
      wsu_verified: profile.wsu_verified,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save profile.';
    throw new Error(`Failed to save profile: ${message}`);
  }
}
