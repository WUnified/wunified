import { describe, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  buildAvatarPath,
  buildChatMediaPath,
  buildClubImagePath,
  buildOwnedEntityImagePath,
  parseImageRefs,
  requireRefsUnderPrefix,
} from './imagePaths';
import { StorageRepository } from './storage';
import {
  AUTH_SERVICE_FAILURES,
  SIGNED_OUT_AUTH_ERRORS,
  clientWithAuthError,
} from '../../test/authFailures';
import type { Database } from '../../types/database';

const USER_ID = '10000000-0000-0000-0000-000000000001';
const CHAT_ID = '30000000-0000-0000-0000-000000000001';
const LISTING_ID = '20000000-0000-0000-0000-000000000001';

function createRepository(uploadError: unknown = null) {
  const upload = jest.fn((_path: string, _body: unknown, _options: unknown) =>
    Promise.resolve({ data: null, error: uploadError }),
  );
  const from = jest.fn((_bucket: string) => ({ upload }));
  const client = {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: USER_ID } }, error: null }) },
    storage: { from },
  } as unknown as SupabaseClient<Database>;

  return { repository: new StorageRepository(client), upload, from };
}

const jpeg = (bytes = 10) => ({ data: new ArrayBuffer(bytes), contentType: 'image/jpeg' });

describe('storage path builders', () => {
  it('puts the owner in the first folder for avatars', () => {
    expect(buildAvatarPath(USER_ID, 'image/png')).toMatch(new RegExp(`^${USER_ID}/[\\w-]+\\.png$`));
  });

  it('nests listing images under owner then listing', () => {
    expect(buildOwnedEntityImagePath(USER_ID, LISTING_ID, 'image/webp')).toMatch(
      new RegExp(`^${USER_ID}/${LISTING_ID}/[\\w-]+\\.webp$`),
    );
  });

  it('puts the chat first and the sender second for chat media', () => {
    expect(buildChatMediaPath(CHAT_ID, USER_ID, 'image/jpeg')).toMatch(
      new RegExp(`^${CHAT_ID}/${USER_ID}/[\\w-]+\\.jpg$`),
    );
  });

  it('rejects non-UUID folder segments', () => {
    expect(() => buildChatMediaPath('../x', USER_ID, 'image/jpeg')).toThrow('valid ID');
  });
});

describe('StorageRepository', () => {
  it('uploads avatars to the avatars bucket under the signed-in user', async () => {
    const { repository, upload, from } = createRepository();

    const result = await repository.uploadAvatar(jpeg());

    expect(from).toHaveBeenCalledWith('avatars');
    expect(result.path.startsWith(`${USER_ID}/`)).toBe(true);
    expect(upload).toHaveBeenCalledWith(result.path, expect.anything(), {
      contentType: 'image/jpeg',
      upsert: false,
    });
  });

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

  it('maps storage permission failures', async () => {
    const { repository } = createRepository({ message: 'denied', statusCode: '403' });

    await expect(repository.uploadChatMedia(CHAT_ID, [jpeg()])).rejects.toMatchObject({
      code: 'PERMISSION',
    });
  });

  it('fails clearly when Supabase is not configured', async () => {
    await expect(new StorageRepository(null).uploadAvatar(jpeg())).rejects.toMatchObject({
      code: 'CONFIGURATION',
    });
  });
});

describe('image refs', () => {
  it('puts the club first for club images', () => {
    expect(buildClubImagePath(LISTING_ID, 'image/png')).toMatch(
      new RegExp(`^${LISTING_ID}/[\\w-]+\\.png$`),
    );
  });

  it('drops malformed entries when parsing', () => {
    expect(
      parseImageRefs([
        { path: 'a/b.jpg', contentType: 'image/jpeg' },
        { path: '../x.jpg', contentType: 'image/jpeg' },
        { path: 'a/b.gif', contentType: 'image/gif' },
        'https://cdn.example/x.jpg',
        null,
      ]),
    ).toEqual([{ path: 'a/b.jpg', contentType: 'image/jpeg' }]);
    expect(parseImageRefs('nope')).toEqual([]);
  });

  it('requires refs to live under the caller prefix', () => {
    const prefix = `${USER_ID}/${LISTING_ID}/`;
    const ok = { path: `${prefix}a.jpg`, contentType: 'image/jpeg' as const };
    expect(requireRefsUnderPrefix([ok], prefix)).toEqual([ok]);
    expect(() => requireRefsUnderPrefix([{ ...ok, path: 'other/a.jpg' }], prefix)).toThrow(
      'not valid',
    );
    expect(() => requireRefsUnderPrefix(Array(6).fill(ok), prefix)).toThrow('at most');
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
  it.each(AUTH_SERVICE_FAILURES)(
    'reports %s as a failure, not as being signed out',
    async (_name, error) => {
      await expect(
        new StorageRepository(clientWithAuthError(error)).uploadAvatar(jpeg()),
      ).rejects.toMatchObject({ code: 'STORAGE' });
    },
  );

  it.each(SIGNED_OUT_AUTH_ERRORS)('reports %s as UNAUTHENTICATED', async (_name, error) => {
    await expect(
      new StorageRepository(clientWithAuthError(error)).uploadAvatar(jpeg()),
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });
});
