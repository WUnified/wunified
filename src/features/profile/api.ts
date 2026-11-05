import type { ProfileDraft, ProfileRecord } from './types';
import {
  fetchCurrentUserProfile,
  isRemoteImageUrl,
  storageRepository,
  updateCurrentUserProfile,
  type Profile,
} from '../../lib/db';
import { pickImage } from '../../lib/pickImage';

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
    const profile = await updateCurrentUserProfile(draft);

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

// `avatar` holds a bucket-relative path in the `avatars` bucket, so the public
// URL is derived at read time.
export function getAvatarUrl(avatar: string | null): string | null {
  // Pre-upload profiles may still hold an https URL; resolvePublicUrl passes those through.
  return storageRepository.resolvePublicUrl('avatars', avatar);
}

// Pick, upload, then save the new path. Returns null if the user cancels.
// Upload happens before the profile write so a failed upload never leaves the
// profile pointing at a missing object.
export async function changeAvatar(current: ProfileRecord): Promise<ProfileRecord | null> {
  const source = await pickImage();
  if (!source) {
    return null;
  }

  const uploaded = await storageRepository.uploadAvatar(source);
  let updated: ProfileRecord;
  try {
    updated = await saveProfile({
      username: current.username,
      display_name: current.display_name,
      avatar: uploaded.path,
    });
  } catch (error) {
    await storageRepository.remove('avatars', [uploaded.path]).catch(() => undefined);
    throw error;
  }

  if (current.avatar && !isRemoteImageUrl(current.avatar)) {
    // Best-effort cleanup: an orphaned old avatar is harmless and must not fail
    // an otherwise successful change.
    await storageRepository.remove('avatars', [current.avatar]).catch(() => undefined);
  }

  return updated;
}
