import { describe, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

import { StorageRepository } from './storage';
import { AUTH_SERVICE_FAILURE, clientWithAuthError } from '../../test/authFailures';
import type { Database } from '../../types/database';

const USER_ID = '10000000-0000-0000-0000-000000000001';
const LISTING_ID = '20000000-0000-0000-0000-000000000001';

function createRepository() {
  const upload = jest.fn((_path: string, _body: unknown, _options: unknown) =>
    Promise.resolve({ data: null, error: null }),
  );
  const from = jest.fn((_bucket: string) => ({ upload }));
  const client = {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: USER_ID } }, error: null }) },
    storage: { from },
  } as unknown as SupabaseClient<Database>;

  return { repository: new StorageRepository(client), upload };
}

const jpeg = (bytes = 10) => ({ data: new ArrayBuffer(bytes), contentType: 'image/jpeg' });

describe('StorageRepository', () => {
  it('rejects unsupported content types before uploading', async () => {
    const { repository, upload } = createRepository();

    await expect(
      repository.uploadAvatar({ data: new ArrayBuffer(10), contentType: 'image/gif' }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
    expect(upload).not.toHaveBeenCalled();
  });

  it('rejects empty and oversized images', async () => {
    const { repository } = createRepository();

    await expect(repository.uploadAvatar(jpeg(0))).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(repository.uploadAvatar(jpeg(5 * 1024 * 1024 + 1))).rejects.toMatchObject({
      code: 'VALIDATION',
    });
  });

  it('reports listing image upload progress for each completed image', async () => {
    const { repository } = createRepository();
    const onProgress = jest.fn();

    await repository.uploadListingImages(LISTING_ID, [jpeg(), jpeg()], onProgress);

    expect(onProgress.mock.calls.map(([progress]) => progress)).toEqual([
      { completed: 0, total: 2 },
      { completed: 1, total: 2 },
      { completed: 2, total: 2 },
    ]);
  });

  it('fails clearly when Supabase is not configured', async () => {
    await expect(new StorageRepository(null).uploadAvatar(jpeg())).rejects.toMatchObject({
      code: 'CONFIGURATION',
    });
  });
});

describe('StorageRepository multi-upload and URLs', () => {
  it('removes already uploaded files when a later upload fails', async () => {
    const upload = jest
      .fn<(...args: unknown[]) => Promise<{ error: unknown }>>()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: 'boom' } });
    const remove = jest.fn(() => Promise.resolve({ error: null }));
    const client = {
      auth: { getUser: () => Promise.resolve({ data: { user: { id: USER_ID } }, error: null }) },
      storage: { from: () => ({ upload, remove }) },
    } as unknown as SupabaseClient<Database>;

    await expect(
      new StorageRepository(client).uploadListingImages(LISTING_ID, [jpeg(), jpeg()]),
    ).rejects.toMatchObject({ code: 'STORAGE' });
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('keeps legacy https URLs and tolerates a missing client', () => {
    const repository = new StorageRepository(null);
    expect(repository.resolvePublicUrl('avatars', 'https://cdn.example/a.jpg')).toBe(
      'https://cdn.example/a.jpg',
    );
    expect(repository.resolvePublicUrl('avatars', 'u/a.jpg')).toBeNull();
    expect(repository.resolvePublicUrls('listing-images', ['https://cdn.example/a.jpg'])).toEqual([
      'https://cdn.example/a.jpg',
    ]);
  });
});

describe('StorageRepository auth failures', () => {
  it('reports an auth service failure as a failure, not as being signed out', async () => {
    await expect(
      new StorageRepository(clientWithAuthError(AUTH_SERVICE_FAILURE)).uploadAvatar(jpeg()),
    ).rejects.toMatchObject({ code: 'STORAGE' });
  });
});
