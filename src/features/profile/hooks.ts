import { useEffect, useState } from 'react';

import { loadCurrentProfile, saveProfile } from './api';
import type { ProfileDraft, ProfileRecord } from './types';

// Load profile state once for the mounted feature and ignore late responses
// after unmount so an async request cannot update stale screen state.
export function useCurrentProfile() {
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void loadCurrentProfile()
      .then((nextProfile) => {
        if (!isMounted) {
          return;
        }

        setProfile(nextProfile);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load the profile.',
        );
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    profile,
    loading,
    error,
  };
}

// Encapsulate profile mutation state so consumers receive consistent saving and
// error signals without handling database exceptions directly.
export function useProfileMutation() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateProfile(
    draft: ProfileDraft,
  ): Promise<ProfileRecord | null> {
    setSaving(true);
    setError(null);

    try {
      const nextProfile = await saveProfile(draft);
      return nextProfile;
    } catch (saveError: unknown) {
      const message =
        saveError instanceof Error ? saveError.message : 'Unable to update profile.';
      setError(message);
      return null;
    } finally {
      setSaving(false);
    }
  }

  return {
    saving,
    error,
    updateProfile,
  };
}
