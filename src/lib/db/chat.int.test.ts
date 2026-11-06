import { beforeAll, describe, expect, it } from '@jest/globals';

import { ChatRepository } from './chat';
import { ListingsRepository } from './listings';
import {
  SEED,
  createAnonClient,
  createClientWithRejectedToken,
  signInAs,
  signUpNewUser,
  uniqueSuffix,
  type TestClient,
} from '../../test/integration/clients';

// Most rules under test live in SQL (RPCs, triggers, RLS). Seeded chats are only
// read; anything that changes membership uses a chat the test creates itself.
describe('ChatRepository against the local stack', () => {
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
      title: `Integration group ${uniqueSuffix()}`,
      initialMemberIds: [SEED.users.jordan.id],
    });
  }

  async function chatIdsVisibleTo(client: TestClient) {
    const chats = await new ChatRepository(client).listMyChats();
    return chats.map((chat) => chat.id);
  }

  describe('reading', () => {
    it("lists a member's chats with participant identities", async () => {
      const chats = await new ChatRepository(maya).listMyChats();

      const direct = chats.find((chat) => chat.id === SEED.chats.mayaJordanDirect);
      expect(direct?.participants.map((participant) => participant.username)).toEqual([
        'maya_t',
        'jordan_l',
      ]);
    });

    it('filters the list by chat type', async () => {
      const groups = await new ChatRepository(maya).listMyChats({ type: 'group' });

      expect(groups.length).toBeGreaterThan(0);
      expect(groups.every((chat) => chat.type === 'group')).toBe(true);
    });

    it('pages messages oldest-to-newest with a cursor for older history', async () => {
      const repository = new ChatRepository(maya);

      const firstPage = await repository.listMessages(SEED.chats.mayaJordanDirect, {
        pageSize: 1,
      });
      const olderPage = await repository.listMessages(SEED.chats.mayaJordanDirect, {
        pageSize: 1,
        cursor: firstPage.nextCursor,
      });

      const [newest] = firstPage.messages;
      const [older] = olderPage.messages;
      expect(firstPage.hasMore).toBe(true);
      expect(older.createdAt < newest.createdAt).toBe(true);
    });

    it('hides messages from users outside the chat', async () => {
      const page = await new ChatRepository(samir).listMessages(SEED.chats.mayaJordanDirect);

      expect(page.messages).toEqual([]);
    });
  });

  describe('searchUsersByUsername', () => {
    it('finds other users by username prefix and never returns the searcher', async () => {
      const results = await new ChatRepository(maya).searchUsersByUsername('ma');
      const jordanResults = await new ChatRepository(maya).searchUsersByUsername('jor');

      expect(results.map((user) => user.userId)).not.toContain(SEED.users.maya.id);
      expect(jordanResults.map((user) => user.username)).toContain('jordan_l');
    });

    it('treats SQL wildcards in the query as literal characters', async () => {
      await expect(new ChatRepository(maya).searchUsersByUsername('%_')).resolves.toEqual([]);
    });

    it('treats a token the auth service rejects as signed out', async () => {
      await expect(
        new ChatRepository(createClientWithRejectedToken()).searchUsersByUsername('jor'),
      ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    });

    it('rejects a signed-out user', async () => {
      await expect(
        new ChatRepository(createAnonClient()).searchUsersByUsername('jor'),
      ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    });
  });

  describe('markRead', () => {
    it("moves the member's own read pointer", async () => {
      const group = await createGroupWithJordan();
      const message = await new ChatRepository(jordan).sendMessage({
        chatId: group.id,
        content: 'Unread until Maya reads it',
      });

      await new ChatRepository(maya).markRead(group.id, message.id);

      const mayaChats = await new ChatRepository(maya).listMyChats({ type: 'group' });
      const mayaView = mayaChats.find((chat) => chat.id === group.id);
      expect(mayaView?.membership.lastReadMessageId).toBe(message.id);
    });

    it("silently skips moving another member's read pointer", async () => {
      const group = await createGroupWithJordan();

      const { data } = await jordan
        .from('chat_members')
        .update({ last_read_message_id: null })
        .eq('chat_id', group.id)
        .eq('user_id', SEED.users.maya.id)
        .select('user_id');

      expect(data).toEqual([]);
    });
  });

  describe('messaging', () => {
    it('delivers a message to the other members', async () => {
      const group = await createGroupWithJordan();
      const content = `Hello ${uniqueSuffix()}`;

      const sent = await new ChatRepository(maya).sendMessage({ chatId: group.id, content });
      const jordanView = await new ChatRepository(jordan).listMessages(group.id);

      expect(sent).toMatchObject({ senderId: SEED.users.maya.id, content });
      expect(jordanView.messages.map((message) => message.id)).toContain(sent.id);
    });

    it('rejects a message from a non-member as a PERMISSION error', async () => {
      await expect(
        new ChatRepository(samir).sendMessage({
          chatId: SEED.chats.mayaJordanDirect,
          content: 'Let me in',
        }),
      ).rejects.toMatchObject({ code: 'PERMISSION' });
    });
  });

  describe('creating chats', () => {
    it('reuses the existing direct chat between two users', async () => {
      const chat = await new ChatRepository(jordan).createDirectChat({
        otherUserId: SEED.users.maya.id,
      });

      expect(chat.id).toBe(SEED.chats.mayaJordanDirect);
    });

    it('creates a new direct chat for a pair that has none', async () => {
      const { client: newcomer, userId: newcomerId } = await signUpNewUser();

      const chat = await new ChatRepository(newcomer).createDirectChat({
        otherUserId: SEED.users.maya.id,
      });

      expect(chat.type).toBe('direct');
      expect(chat.participants.map((participant) => participant.userId).sort()).toEqual(
        [newcomerId, SEED.users.maya.id].sort(),
      );
      expect(await chatIdsVisibleTo(maya)).toContain(chat.id);
    });

    it('refuses a direct chat with yourself', async () => {
      await expect(
        new ChatRepository(maya).createDirectChat({ otherUserId: SEED.users.maya.id }),
      ).rejects.toThrow('a direct chat requires two different users');
    });

    it('lets an active club member create a club chat', async () => {
      const title = `Integration club chat ${uniqueSuffix()}`;

      const chat = await new ChatRepository(jordan).createClubChat({
        clubId: SEED.clubs.localTestClub,
        title,
      });

      expect(chat).toMatchObject({ type: 'club', clubId: SEED.clubs.localTestClub, title });
      expect(chat.participants.map((participant) => participant.userId)).toContain(
        SEED.users.jordan.id,
      );
    });

    it('stops a non-member from creating a club chat', async () => {
      await expect(
        new ChatRepository(samir).createClubChat({ clubId: SEED.clubs.localTestClub }),
      ).rejects.toThrow('active club membership is required to create this chat');
    });

    it('opens a marketplace chat between a buyer and the seller', async () => {
      const listing = await new ListingsRepository(jordan).create({
        title: `Integration listing ${uniqueSuffix()}`,
        description: 'For a marketplace chat test.',
        category: 'general',
        price: 5,
      });

      const chat = await new ChatRepository(maya).createMarketplaceChat({
        listingId: listing.id,
      });

      expect(chat).toMatchObject({ type: 'marketplace', listingId: listing.id });
      expect(chat.participants.map((participant) => participant.userId).sort()).toEqual(
        [SEED.users.jordan.id, SEED.users.maya.id].sort(),
      );
    });

    it('refuses a marketplace chat about a listing that is no longer active', async () => {
      const sellers = new ListingsRepository(jordan);
      const listing = await sellers.create({
        title: `Integration sold listing ${uniqueSuffix()}`,
        description: 'Already sold.',
        category: 'general',
        price: 5,
      });
      await sellers.updateStatus(listing.id, 'sold');

      await expect(
        new ChatRepository(samir).createMarketplaceChat({ listingId: listing.id }),
      ).rejects.toThrow('an active listing is required to create a marketplace chat');
    });

    it('stops a seller from opening a marketplace chat with themselves', async () => {
      await expect(
        new ChatRepository(jordan).createMarketplaceChat({
          listingId: SEED.listings.jordanDeskLamp,
        }),
      ).rejects.toThrow('a seller cannot start a marketplace chat with themselves');
    });
  });

  describe('membership rules', () => {
    it('stops the last owner from leaving', async () => {
      const group = await createGroupWithJordan();

      await expect(new ChatRepository(maya).leaveChat(group.id)).rejects.toThrow(
        'transfer ownership before leaving as the last owner',
      );
    });

    it('lets the last owner leave after promoting another member', async () => {
      const group = await createGroupWithJordan();
      const mayaRepository = new ChatRepository(maya);

      await mayaRepository.setMemberRole(group.id, SEED.users.jordan.id, 'owner');
      await mayaRepository.leaveChat(group.id);

      const mayaChats = await mayaRepository.listMyChats({ type: 'group' });
      expect(mayaChats.map((chat) => chat.id)).not.toContain(group.id);
    });

    it('lets an owner invite a new member, who can then see the chat', async () => {
      const group = await createGroupWithJordan();

      await new ChatRepository(maya).inviteMember(group.id, SEED.users.samir.id);

      expect(await chatIdsVisibleTo(samir)).toContain(group.id);
    });

    it('only lets an owner invite members', async () => {
      const group = await createGroupWithJordan();

      await expect(
        new ChatRepository(jordan).inviteMember(group.id, SEED.users.samir.id),
      ).rejects.toThrow('only a chat owner can invite members');
    });

    it('refuses invitations into a direct chat', async () => {
      await expect(
        new ChatRepository(maya).inviteMember(SEED.chats.mayaJordanDirect, SEED.users.samir.id),
      ).rejects.toThrow('participants cannot be added to this chat type');
    });

    it('lets an owner remove a member, who then loses access', async () => {
      const group = await createGroupWithJordan();

      await new ChatRepository(maya).removeMember(group.id, SEED.users.jordan.id);

      expect(await chatIdsVisibleTo(jordan)).not.toContain(group.id);
    });

    it('only lets an owner remove another member', async () => {
      const group = await createGroupWithJordan();

      await expect(
        new ChatRepository(jordan).removeMember(group.id, SEED.users.maya.id),
      ).rejects.toThrow('only a chat owner can remove another member');
    });

    it('only lets an owner change member roles', async () => {
      const group = await createGroupWithJordan();

      await expect(
        new ChatRepository(jordan).setMemberRole(group.id, SEED.users.jordan.id, 'owner'),
      ).rejects.toThrow('only a chat owner can change member roles');
    });

    it('stops the last owner from demoting themselves', async () => {
      const group = await createGroupWithJordan();

      await expect(
        new ChatRepository(maya).setMemberRole(group.id, SEED.users.maya.id, 'member'),
      ).rejects.toThrow('a chat must retain at least one owner');
    });

    it('stops participants from leaving a direct chat', async () => {
      await expect(
        new ChatRepository(jordan).leaveChat(SEED.chats.mayaJordanDirect),
      ).rejects.toThrow('participants cannot leave a fixed-participant chat');
    });
  });
});
