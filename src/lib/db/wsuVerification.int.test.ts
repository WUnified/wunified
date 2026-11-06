import { beforeAll, describe, expect, it } from '@jest/globals';

import { ChatRepository } from './chat';
import {
  SEED,
  signInAs,
  signUpNewUser,
  uniqueSuffix,
  type TestClient,
} from '../../test/integration/clients';

// Every gate from supabase/migrations/20261105000400_wsu_verification_gate.sql: the
// restrictive insert policies, and the chats trigger that covers the security definer
// chat RPCs (which bypass RLS).
describe('WSU verification gate against the local stack', () => {
  let unverified: TestClient;
  let unverifiedId: string;
  let verified: TestClient;
  let verifiedId: string;
  let maya: TestClient;

  beforeAll(async () => {
    unverified = await signInAs('unverified');
    unverifiedId = SEED.users.unverified.id;
    ({ client: verified, userId: verifiedId } = await signUpNewUser());
    maya = await signInAs('maya');
  });

  function listing(sellerId: string) {
    return {
      seller_id: sellerId,
      title: `Gate listing ${uniqueSuffix()}`,
      description: 'WSU gate test.',
      category: 'general',
      price: 5,
    };
  }

  function event(createdBy: string) {
    return {
      created_by: createdBy,
      title: `Gate event ${uniqueSuffix()}`,
      description: 'WSU gate test.',
      location: 'Rhatigan Student Center',
      start_time: new Date(Date.now() + 86_400_000).toISOString(),
    };
  }

  describe('blocks an unverified user from creating', () => {
    it('a listing', async () => {
      const { error } = await unverified.from('market_listings').insert(listing(unverifiedId));
      expect(error?.code).toBe('42501');
    });

    it('a board post and a comment', async () => {
      const post = await unverified
        .from('board_posts')
        .insert({ author_id: unverifiedId, title: 'Gate post', body: 'WSU gate test.' });
      const comment = await unverified.from('board_comments').insert({
        post_id: SEED.boardPosts.mayaStudyGroup,
        author_id: unverifiedId,
        body: 'WSU gate test.',
      });
      expect(post.error?.code).toBe('42501');
      expect(comment.error?.code).toBe('42501');
    });

    it('an event', async () => {
      const { error } = await unverified.from('events').insert(event(unverifiedId));
      expect(error?.code).toBe('42501');
    });

    it('a club', async () => {
      const { error } = await unverified
        .from('clubs')
        .insert({ name: `Gate club ${uniqueSuffix()}`, created_by: unverifiedId });
      expect(error?.code).toBe('42501');
    });

    it('a direct, group, or marketplace chat', async () => {
      const chats = new ChatRepository(unverified);
      await expect(chats.createDirectChat({ otherUserId: SEED.users.maya.id })).rejects.toThrow(
        'You do not have permission',
      );
      await expect(
        chats.createGroupChat({ initialMemberIds: [SEED.users.maya.id] }),
      ).rejects.toThrow('You do not have permission');
      await expect(
        chats.createMarketplaceChat({ listingId: SEED.listings.jordanDeskLamp }),
      ).rejects.toThrow('You do not have permission');
    });

    it('a message, even in a chat they were added to', async () => {
      const chat = await new ChatRepository(maya).createGroupChat({
        title: `Gate chat ${uniqueSuffix()}`,
        initialMemberIds: [unverifiedId],
      });
      await expect(
        new ChatRepository(unverified).sendMessage({ chatId: chat.id, content: 'hi' }),
      ).rejects.toThrow('You do not have permission');
    });
  });

  describe('lets a verified user create', () => {
    it('listings, board posts, events, and clubs', async () => {
      const results = await Promise.all([
        verified.from('market_listings').insert(listing(verifiedId)),
        verified
          .from('board_posts')
          .insert({ author_id: verifiedId, title: 'Gate post', body: 'WSU gate test.' }),
        verified.from('events').insert(event(verifiedId)),
        verified
          .from('clubs')
          .insert({ name: `Gate club ${uniqueSuffix()}`, created_by: verifiedId }),
      ]);
      expect(results.map((result) => result.error)).toEqual([null, null, null, null]);
    });

    it('a chat and a message', async () => {
      const chats = new ChatRepository(verified);
      const chat = await chats.createDirectChat({ otherUserId: SEED.users.maya.id });
      await expect(chats.sendMessage({ chatId: chat.id, content: 'hi' })).resolves.toMatchObject({
        chatId: chat.id,
      });
    });
  });
});
