import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { changeAvatar, loadCurrentProfile, saveProfile } from './api';
import { useAvatarUpload, useCurrentProfile, useProfileMutation } from './hooks';
import type { ProfileRecord } from './types';

jest.mock('./api', () => ({
  changeAvatar: jest.fn(),
  loadCurrentProfile: jest.fn(),
  saveProfile: jest.fn(),
}));

const load = jest.mocked(loadCurrentProfile);
const save = jest.mocked(saveProfile);
const change = jest.mocked(changeAvatar);

const profile: ProfileRecord = {
  user_id: 'user-1',
  username: 'shocker',
  display_name: 'Shocker',
  avatar: null,
  wsu_verified: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z',
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe('useCurrentProfile', () => {
  it('starts loading, then exposes the profile', async () => {
    load.mockResolvedValue(profile);

    const { result } = renderHook(() => useCurrentProfile());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ profile, error: null });
  });

  it('exposes a load failure', async () => {
    load.mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useCurrentProfile());

    await waitFor(() => expect(result.current.error).toBe('offline'));
    expect(result.current).toMatchObject({ loading: false, profile: null });
  });

  it('uses a fallback message for a non-Error failure', async () => {
    load.mockRejectedValue('nope');

    const { result } = renderHook(() => useCurrentProfile());

    await waitFor(() => expect(result.current.error).toBe('Unable to load the profile.'));
  });
});

describe('useProfileMutation', () => {
  it('returns the saved profile and clears the saving flag', async () => {
    save.mockResolvedValue(profile);
    const { result } = renderHook(() => useProfileMutation());

    let saved: ProfileRecord | null = null;
    await act(async () => {
      saved = await result.current.updateProfile({ username: 'shocker' });
    });

    expect(saved).toEqual(profile);
    expect(result.current).toMatchObject({ saving: false, error: null });
  });

  it('exposes a failure and returns null', async () => {
    save.mockRejectedValue(new Error('taken'));
    const { result } = renderHook(() => useProfileMutation());

    let saved: ProfileRecord | null = profile;
    await act(async () => {
      saved = await result.current.updateProfile({ username: 'shocker' });
    });

    expect(saved).toBeNull();
    expect(result.current).toMatchObject({ saving: false, error: 'taken' });
  });

  it('clears an earlier failure when saving again', async () => {
    save.mockRejectedValueOnce(new Error('taken')).mockResolvedValueOnce(profile);
    const { result } = renderHook(() => useProfileMutation());
    await act(async () => {
      await result.current.updateProfile({ username: 'shocker' });
    });

    await act(async () => {
      await result.current.updateProfile({ username: 'shocker2' });
    });

    expect(result.current.error).toBeNull();
  });
});

describe('useAvatarUpload', () => {
  it('returns the updated profile and clears the uploading flag', async () => {
    change.mockResolvedValue(profile);
    const { result } = renderHook(() => useAvatarUpload());

    let updated: ProfileRecord | null = null;
    await act(async () => {
      updated = await result.current.uploadAvatar(profile);
    });

    expect(updated).toEqual(profile);
    expect(result.current).toMatchObject({ uploading: false, error: null });
  });

  it('exposes a failure and returns null', async () => {
    change.mockRejectedValue(new Error('too large'));
    const { result } = renderHook(() => useAvatarUpload());

    let updated: ProfileRecord | null = profile;
    await act(async () => {
      updated = await result.current.uploadAvatar(profile);
    });

    expect(updated).toBeNull();
    expect(result.current).toMatchObject({ uploading: false, error: 'too large' });
  });
});
