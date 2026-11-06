import { beforeAll, describe, expect, it } from '@jest/globals';

import { ChatRepository } from './chat';
import { loadChatInboxExtras } from './chatInbox';
import { ListingsRepository } from './listings';
import { SEED, signInAs, uniqueSuffix, type TestClient } from '../../test/integration/clients';

describe('chat inbox extras against the local stack', () => {
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
      title: `Integration inbox ${uniqueSuffix()}`,
      initialMemberIds: [SEED.users.jordan.id],
    });
  }

  async function inboxRow(client: TestClient, chatId: string) {
    const chats = await new ChatRepository(client).listMyChats();
    const row = chats.find((chat) => chat.id === chatId);
    if (!row) throw new Error('The chat should be in this inbox.');
    return row;
  }

  it('shows the newest message as the preview', async () => {
    const group = await createGroupWithJordan();
    const repository = new ChatRepository(maya);
    await repository.sendMessage({ chatId: group.id, content: 'First' });
    await repository.sendMessage({ chatId: group.id, content: 'Second' });

    const row = await inboxRow(jordan, group.id);

    expect(row.lastMessage?.content).toBe('Second');
  });

  it("counts other people's messages as unread, but not your own", async () => {
    const group = await createGroupWithJordan();
    const repository = new ChatRepository(maya);
    await repository.sendMessage({ chatId: group.id, content: 'One' });
    await repository.sendMessage({ chatId: group.id, content: 'Two' });

    expect((await inboxRow(jordan, group.id)).unreadCount).toBe(2);
    expect((await inboxRow(maya, group.id)).unreadCount).toBe(0);
  });

  it('counts only messages after the read position', async () => {
    const group = await createGroupWithJordan();
    const repository = new ChatRepository(maya);
    const read = await repository.sendMessage({ chatId: group.id, content: 'Read' });
    await repository.sendMessage({ chatId: group.id, content: 'Not read' });

    await new ChatRepository(jordan).markRead(group.id, read.id);

    expect((await inboxRow(jordan, group.id)).unreadCount).toBe(1);
  });

  it('attaches a summary of the listing to a marketplace chat', async () => {
    const listing = await new ListingsRepository(jordan).create({
      title: `Integration inbox listing ${uniqueSuffix()}`,
      description: 'For an inbox test.',
      category: 'general',
      price: 5,
    });
    const chat = await new ChatRepository(maya).createMarketplaceChat({ listingId: listing.id });

    const row = await inboxRow(maya, chat.id);

    expect(row.listing).toMatchObject({ id: listing.id, title: listing.title });
  });

  it('gives an outsider no preview or unread count for a chat they are not in', async () => {
    const extras = await loadChatInboxExtras(samir, SEED.users.samir.id, [
      { chatId: SEED.chats.mayaJordanDirect, lastReadMessageId: null, listingId: null },
    ]);

    expect(extras.lastMessageByChat.get(SEED.chats.mayaJordanDirect) ?? null).toBeNull();
    expect(extras.unreadByChat.get(SEED.chats.mayaJordanDirect) ?? 0).toBe(0);
  });
});
