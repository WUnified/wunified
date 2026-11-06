import { describe, expect, it } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

import { ChatInboxQueryError, loadChatInboxExtras } from './chatInbox';
import type { Database } from '../../types/database';

const ME = 'user-me';
type Call = { method: string; args: unknown[] };

// Builds a thenable query that records its calls and resolves with `result`.
function fakeQuery(result: Record<string, unknown>, calls: Call[], table: string) {
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'neq', 'gt', 'or', 'in', 'order', 'limit']) {
    query[method] = (...args: unknown[]) => {
      calls.push({ method: `${table}.${method}`, args });
      return query;
    };
  }
  query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return query;
}

function createClient(options: {
  lastMessage?: Record<string, unknown> | null;
  count?: number;
  readPointers?: { id: string; created_at: string }[];
  listings?: { id: string; title: string; images: unknown }[];
  error?: { message: string };
}) {
  const calls: Call[] = [];
  let messageSelects = 0;
  const client = {
    from: (table: string) => {
      if (table === 'market_listings') {
        return fakeQuery({ data: options.listings ?? [], error: null }, calls, table);
      }
      // chat_messages is queried three ways; tell them apart by call order via select args.
      const query = fakeQuery({}, calls, table);
      const originalSelect = query.select as (...args: unknown[]) => unknown;
      query.select = (columns: string, config?: { head?: boolean }) => {
        originalSelect(columns, config);
        messageSelects += 1;
        let result: Record<string, unknown>;
        if (options.error) result = { data: null, count: null, error: options.error };
        else if (config?.head) result = { data: null, count: options.count ?? 0, error: null };
        else if (columns === 'id, created_at') {
          result = { data: options.readPointers ?? [], error: null };
        } else {
          result = { data: options.lastMessage ? [options.lastMessage] : [], error: null };
        }
        query.then = (resolve: (value: unknown) => unknown) =>
          Promise.resolve(result).then(resolve);
        return query;
      };
      return query;
    },
  } as unknown as SupabaseClient<Database>;
  return { client, calls, selectCount: () => messageSelects };
}

describe('loadChatInboxExtras', () => {
  it('returns the preview, unread count only for others after the read pointer, and listing', async () => {
    const { client, calls } = createClient({
      lastMessage: {
        id: 'm9',
        sender_id: 'u2',
        content: 'Still here',
        media: null,
        created_at: '2026-11-05T10:00:00.123456+00:00',
        is_deleted: false,
      },
      count: 2,
      readPointers: [{ id: 'm5', created_at: '2026-11-05T09:00:00.000000+00:00' }],
      listings: [{ id: 'l1', title: 'Calculus textbook', images: [] }],
    });

    const extras = await loadChatInboxExtras(client, ME, [
      { chatId: 'c1', lastReadMessageId: 'm5', listingId: 'l1' },
    ]);

    expect(extras.lastMessageByChat.get('c1')).toMatchObject({
      id: 'm9',
      content: 'Still here',
      hasMedia: false,
    });
    expect(extras.unreadByChat.get('c1')).toBe(2);
    expect(extras.listingsById.get('l1')?.title).toBe('Calculus textbook');
    // Tuple comparison so a message sharing the pointer's timestamp but with a
    // greater id still counts as unread.
    expect(calls).toContainEqual({
      method: 'chat_messages.or',
      args: [
        'created_at.gt.2026-11-05T09:00:00.000000+00:00,and(created_at.eq.2026-11-05T09:00:00.000000+00:00,id.gt.m5)',
      ],
    });
    expect(calls).toContainEqual({ method: 'chat_messages.neq', args: ['sender_id', ME] });
    expect(calls).toContainEqual({ method: 'chat_messages.eq', args: ['is_deleted', false] });
  });

  it('counts every message from others when nothing has been read', async () => {
    const { client, calls } = createClient({ count: 4 });

    const extras = await loadChatInboxExtras(client, ME, [
      { chatId: 'c1', lastReadMessageId: null, listingId: null },
    ]);

    expect(extras.unreadByChat.get('c1')).toBe(4);
    expect(extras.lastMessageByChat.get('c1')).toBeNull();
    expect(calls.some(({ method }) => method === 'chat_messages.or')).toBe(false);
    expect(calls.some(({ method }) => method.startsWith('market_listings'))).toBe(false);
  });

  it('hides deleted content and flags media-only messages', async () => {
    const deleted = createClient({
      lastMessage: {
        id: 'm1',
        sender_id: 'u2',
        content: 'secret',
        media: null,
        created_at: '2026-11-05T10:00:00+00:00',
        is_deleted: true,
      },
    });
    const media = createClient({
      lastMessage: {
        id: 'm2',
        sender_id: 'u2',
        content: null,
        media: [{ path: 'a/b/c.jpg', contentType: 'image/jpeg' }],
        created_at: '2026-11-05T10:00:00+00:00',
        is_deleted: false,
      },
    });
    const input = [{ chatId: 'c1', lastReadMessageId: null, listingId: null }];

    const deletedExtras = await loadChatInboxExtras(deleted.client, ME, input);
    const mediaExtras = await loadChatInboxExtras(media.client, ME, input);

    expect(deletedExtras.lastMessageByChat.get('c1')).toMatchObject({
      content: null,
      isDeleted: true,
    });
    expect(mediaExtras.lastMessageByChat.get('c1')).toMatchObject({ hasMedia: true });
  });

  it('degrades a chat whose preview and count queries fail instead of failing the inbox', async () => {
    const { client } = createClient({ error: { message: 'boom' } });

    const extras = await loadChatInboxExtras(client, ME, [
      { chatId: 'c1', lastReadMessageId: null, listingId: null },
    ]);

    expect(extras.lastMessageByChat.get('c1')).toBeNull();
    expect(extras.unreadByChat.get('c1')).toBe(0);
  });

  it('still surfaces failures in the shared read-marker lookup', async () => {
    const { client } = createClient({ error: { message: 'boom' } });

    await expect(
      loadChatInboxExtras(client, ME, [{ chatId: 'c1', lastReadMessageId: 'm5', listingId: null }]),
    ).rejects.toBeInstanceOf(ChatInboxQueryError);
  });
});
