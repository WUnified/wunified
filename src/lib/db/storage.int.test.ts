import { beforeAll, describe, expect, it } from '@jest/globals';

import { ChatRepository } from './chat';
import { StorageRepository, type ImageUploadSource } from './storage';
import {
  SEED,
  createAnonClient,
  signInAs,
  uniqueSuffix,
  type TestClient,
} from '../../test/integration/clients';
import { newUuid } from '../uuid';

const jpeg = (): ImageUploadSource => ({
  data: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]).buffer,
  contentType: 'image/jpeg',
});

const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

async function httpStatus(url: string): Promise<number> {
  const response = await fetch(url);
  return response.status;
}

// Objects can't be cleaned up by the throwaway stack's seed, so every test uses a
// fresh entity ID or relies on the random file names the path builders generate.
describe('StorageRepository against the local stack', () => {
  let maya: TestClient;
  let jordan: TestClient;
  let samir: TestClient;

  beforeAll(async () => {
    maya = await signInAs('maya');
    jordan = await signInAs('jordan');
    samir = await signInAs('samir');
  });

  async function createGroupWithJordan() {
    return new ChatRepository(maya).createGroupChat({
      title: `Integration media ${uniqueSuffix()}`,
      initialMemberIds: [SEED.users.jordan.id],
    });
  }

  describe('avatars', () => {
    it('uploads to the owner folder, readable by anyone at its public URL', async () => {
      const repository = new StorageRepository(maya);

      const image = await repository.uploadAvatar(jpeg());

      expect(image.path.startsWith(`${SEED.users.maya.id}/`)).toBe(true);
      expect(await httpStatus(repository.getPublicUrl('avatars', image.path))).toBe(200);
    });

    it("blocks uploading into another user's folder", async () => {
      const { error } = await maya.storage
        .from('avatars')
        .upload(`${SEED.users.jordan.id}/${newUuid()}.jpg`, jpegBytes, {
          contentType: 'image/jpeg',
        });

      expect(error).not.toBeNull();
    });

    it("silently skips deleting another user's avatar", async () => {
      const image = await new StorageRepository(jordan).uploadAvatar(jpeg());
      const jordanRepository = new StorageRepository(jordan);

      await new StorageRepository(maya).remove('avatars', [image.path]);

      expect(await httpStatus(jordanRepository.getPublicUrl('avatars', image.path))).toBe(200);
    });

    it('lets the owner delete their avatar', async () => {
      const repository = new StorageRepository(maya);
      const image = await repository.uploadAvatar(jpeg());

      await repository.remove('avatars', [image.path]);

      expect(await httpStatus(repository.getPublicUrl('avatars', image.path))).not.toBe(200);
    });

    it('rejects a signed-out upload', async () => {
      await expect(
        new StorageRepository(createAnonClient()).uploadAvatar(jpeg()),
      ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    });

    it('enforces the allowed file types in the bucket, not just in the client', async () => {
      const { error } = await maya.storage
        .from('avatars')
        .upload(`${SEED.users.maya.id}/${newUuid()}.txt`, new Uint8Array([1, 2, 3]), {
          contentType: 'text/plain',
        });

      expect(error).not.toBeNull();
    });
  });

  describe('listing and post images', () => {
    it.each([
      ['listing-images', (r: StorageRepository, id: string) => r.uploadListingImages(id, [jpeg()])],
      ['post-images', (r: StorageRepository, id: string) => r.uploadPostImages(id, [jpeg()])],
    ] as const)('stores %s under the owner and entity', async (bucket, upload) => {
      const repository = new StorageRepository(maya);
      const entityId = newUuid();

      const [image] = await upload(repository, entityId);

      expect(image.path.startsWith(`${SEED.users.maya.id}/${entityId}/`)).toBe(true);
      expect(await httpStatus(repository.getPublicUrl(bucket, image.path))).toBe(200);
    });

    it.each(['listing-images', 'post-images'] as const)(
      "blocks %s uploads into another user's folder",
      async (bucket) => {
        const { error } = await maya.storage
          .from(bucket)
          .upload(`${SEED.users.jordan.id}/${newUuid()}/${newUuid()}.jpg`, jpegBytes, {
            contentType: 'image/jpeg',
          });

        expect(error).not.toBeNull();
      },
    );
  });

  describe('club images', () => {
    it('lets an active club owner upload', async () => {
      const repository = new StorageRepository(maya);

      const image = await repository.uploadClubImage(SEED.clubs.localTestClub, jpeg());

      expect(image.path.startsWith(`${SEED.clubs.localTestClub}/`)).toBe(true);
      expect(await httpStatus(repository.getPublicUrl('club-images', image.path))).toBe(200);
    });

    it('stops a regular club member from uploading', async () => {
      await expect(
        new StorageRepository(jordan).uploadClubImage(SEED.clubs.localTestClub, jpeg()),
      ).rejects.toMatchObject({ code: 'PERMISSION' });
    });

    it('denies a path whose folder is not a club ID, rather than erroring in the policy', async () => {
      const { error } = await maya.storage
        .from('club-images')
        .upload(`not-a-uuid/${newUuid()}.jpg`, jpegBytes, { contentType: 'image/jpeg' });

      expect(error).toMatchObject({ statusCode: '403' });
    });
  });

  describe('chat media', () => {
    it('lets a member upload and another member open it through a signed URL', async () => {
      const group = await createGroupWithJordan();
      const [image] = await new StorageRepository(maya).uploadChatMedia(group.id, [jpeg()]);

      const url = await new StorageRepository(jordan).createChatMediaUrl(image.path);

      expect(image.path.startsWith(`${group.id}/${SEED.users.maya.id}/`)).toBe(true);
      expect(await httpStatus(url)).toBe(200);
    });

    it('stops an outsider from uploading to the chat', async () => {
      const group = await createGroupWithJordan();

      await expect(
        new StorageRepository(samir).uploadChatMedia(group.id, [jpeg()]),
      ).rejects.toMatchObject({ code: 'PERMISSION' });
    });

    it('stops an outsider from getting a signed URL', async () => {
      const group = await createGroupWithJordan();
      const [image] = await new StorageRepository(maya).uploadChatMedia(group.id, [jpeg()]);

      await expect(
        new StorageRepository(samir).createChatMediaUrl(image.path),
      ).rejects.toMatchObject({ code: 'STORAGE' });
    });

    it('keeps chat media private at its public URL', async () => {
      const group = await createGroupWithJordan();
      const [image] = await new StorageRepository(maya).uploadChatMedia(group.id, [jpeg()]);
      const { data } = maya.storage.from('chat-media').getPublicUrl(image.path);

      expect(await httpStatus(data.publicUrl)).not.toBe(200);
    });

    it("blocks uploading into another member's subfolder", async () => {
      const group = await createGroupWithJordan();

      const { error } = await maya.storage
        .from('chat-media')
        .upload(`${group.id}/${SEED.users.jordan.id}/${newUuid()}.jpg`, jpegBytes, {
          contentType: 'image/jpeg',
        });

      expect(error).not.toBeNull();
    });

    it("silently skips a member deleting another member's upload", async () => {
      const group = await createGroupWithJordan();
      const [image] = await new StorageRepository(maya).uploadChatMedia(group.id, [jpeg()]);

      await new StorageRepository(jordan).remove('chat-media', [image.path]);

      const url = await new StorageRepository(maya).createChatMediaUrl(image.path);
      expect(await httpStatus(url)).toBe(200);
    });

    it('lets a message reference the sender’s own upload', async () => {
      const group = await createGroupWithJordan();
      const [image] = await new StorageRepository(maya).uploadChatMedia(group.id, [jpeg()]);

      const message = await new ChatRepository(maya).sendMessage({
        chatId: group.id,
        media: [image],
      });

      expect(message.media).toHaveLength(1);
    });

    it("stops a message from referencing another member's upload", async () => {
      const group = await createGroupWithJordan();
      const [image] = await new StorageRepository(jordan).uploadChatMedia(group.id, [jpeg()]);

      const { error } = await maya.from('chat_messages').insert({
        chat_id: group.id,
        sender_id: SEED.users.maya.id,
        media: [image],
      });

      expect(error?.code).toBe('42501');
    });
  });
});
