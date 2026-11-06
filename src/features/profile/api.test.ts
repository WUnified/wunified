import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { changeAvatar, loadCurrentProfile, saveProfile } from './api';
import type { ProfileRecord } from './types';
import { fetchCurrentUserProfile, storageRepository, updateCurrentUserProfile } from '../../lib/db';
import type { Profile } from '../../lib/db';
import { pickImage } from '../../lib/pickImage';

jest.mock('../../lib/db', () => ({
  ...jest.requireActual<Record<string, unknown>>('../../lib/db'),
  fetchCurrentUserProfile: jest.fn(),
  updateCurrentUserProfile: jest.fn(),
}));
jest.mock('../../lib/pickImage', () => ({ pickImage: jest.fn() }));

const fetchProfile = jest.mocked(fetchCurrentUserProfile);
const updateProfile = jest.mocked(updateCurrentUserProfile);
const pick = jest.mocked(pickImage);

const dbRow: Profile = {
  user_id: 'user-1',
  username: 'shocker',
  display_name: 'Shocker',
  avatar: null,
  wsu_verified: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z',
};

describe('loadCurrentProfile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('maps the database row onto the feature record', async () => {
    fetchProfile.mockResolvedValue(dbRow);

    await expect(loadCurrentProfile()).resolves.toEqual(dbRow);
  });

  it('returns null when there is no profile', async () => {
    fetchProfile.mockResolvedValue(null);

    await expect(loadCurrentProfile()).resolves.toBeNull();
  });

  it('adds context to a failure', async () => {
    fetchProfile.mockRejectedValue(new Error('offline'));

    await expect(loadCurrentProfile()).rejects.toThrow('Failed to load profile: offline');
  });

  it('does not repeat context the database layer already added', async () => {
    fetchProfile.mockRejectedValue(new Error('Failed to load profile: denied'));

    await expect(loadCurrentProfile()).rejects.toThrow(/^Failed to load profile: denied$/);
  });
});

describe('saveProfile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('adds context to a failure', async () => {
    updateProfile.mockRejectedValue(new Error('taken'));

    await expect(saveProfile({ username: 'shocker' })).rejects.toThrow(
      'Failed to save profile: taken',
    );
  });
});

describe('changeAvatar', () => {
  const current: ProfileRecord = { ...dbRow, avatar: 'user-1/old.jpg' };
  const source = {
    data: new ArrayBuffer(4),
    contentType: 'image/jpeg',
    previewUri: 'file:///picked.jpg',
  };
  const uploaded = { path: 'user-1/new.jpg', contentType: 'image/jpeg' as const };

  let uploadAvatar: jest.SpiedFunction<typeof storageRepository.uploadAvatar>;
  let remove: jest.SpiedFunction<typeof storageRepository.remove>;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    pick.mockResolvedValue(source);
    uploadAvatar = jest.spyOn(storageRepository, 'uploadAvatar').mockResolvedValue(uploaded);
    remove = jest.spyOn(storageRepository, 'remove').mockResolvedValue(undefined);
  });

  it('does nothing when the user cancels the picker', async () => {
    pick.mockResolvedValue(null);

    await expect(changeAvatar(current)).resolves.toBeNull();

    expect(uploadAvatar).not.toHaveBeenCalled();
  });

  it('saves the new path and removes the old file', async () => {
    updateProfile.mockResolvedValue({ ...dbRow, avatar: uploaded.path });

    const result = await changeAvatar(current);

    expect(result?.avatar).toBe(uploaded.path);
    expect(remove).toHaveBeenCalledWith('avatars', ['user-1/old.jpg']);
  });

  it('does not try to delete a legacy https avatar', async () => {
    updateProfile.mockResolvedValue({ ...dbRow, avatar: uploaded.path });

    await changeAvatar({ ...current, avatar: 'https://cdn.example/a.jpg' });

    expect(remove).not.toHaveBeenCalled();
  });

  it('removes the new upload if saving the profile fails, and keeps the old file', async () => {
    updateProfile.mockRejectedValue(new Error('taken'));

    await expect(changeAvatar(current)).rejects.toThrow('Failed to save profile: taken');

    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith('avatars', [uploaded.path]);
  });

  it('still succeeds if cleaning up the old file fails', async () => {
    updateProfile.mockResolvedValue({ ...dbRow, avatar: uploaded.path });
    remove.mockRejectedValue(new Error('offline'));

    await expect(changeAvatar(current)).resolves.toMatchObject({ avatar: uploaded.path });
  });
});
