import { describe, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

import { ChatRepository } from './chat';
import type { ChatMessageEvent } from './chat';
import type { Database } from '../../types/database';

const CHAT_ID = '10000000-0000-0000-0000-000000000001';

type Handler = (payload: { new: unknown }) => void;

function createRealtimeRepository() {
  const handlers: Record<string, Handler> = {};
  const filters: unknown[] = [];
  let statusCallback: ((status: string) => void) | undefined;
  const channel = {
    on: (_type: string, config: { event: string; filter?: string }, handler: Handler) => {
      handlers[config.event] = handler;
      filters.push(config.filter);
      return channel;
    },
    subscribe: (callback: (status: string) => void) => {
      statusCallback = callback;
      return channel;
    },
  };
  const channelNames: string[] = [];
  const removeChannel = jest.fn(() => Promise.resolve('ok'));
  const client = {
    channel: (name: string) => {
      channelNames.push(name);
      return channel;
    },
    removeChannel,
  } as unknown as SupabaseClient<Database>;

  return {
    repository: new ChatRepository(client),
    handlers,
    filters,
    channelNames,
    removeChannel,
    emitStatus: (status: string) => statusCallback?.(status),
  };
}

const row = {
  id: '20000000-0000-0000-0000-000000000001',
  chat_id: CHAT_ID,
  sender_id: '30000000-0000-0000-0000-000000000001',
  content: 'Saturday works',
  media: null,
  created_at: '2026-11-05T10:00:00.123456+00:00',
  is_deleted: false,
};

describe('ChatRepository.subscribeToMessages', () => {
  it('filters to one chat, maps inserts and updates, and unsubscribes', () => {
    const { repository, handlers, filters, removeChannel } = createRealtimeRepository();
    const events: ChatMessageEvent[] = [];

    const unsubscribe = repository.subscribeToMessages({
      chatId: CHAT_ID,
      onMessage: (event) => events.push(event),
    });
    handlers.INSERT?.({ new: row });
    handlers.UPDATE?.({ new: { ...row, content: 'secret', is_deleted: true } });

    expect(filters).toEqual([`chat_id=eq.${CHAT_ID}`, `chat_id=eq.${CHAT_ID}`]);
    expect(events[0]).toMatchObject({
      type: 'insert',
      message: { id: row.id, chatId: CHAT_ID, content: 'Saturday works', isDeleted: false },
    });
    // Soft-deleted content never reaches the UI.
    expect(events[1]).toMatchObject({
      type: 'update',
      message: { content: null, media: null, isDeleted: true },
    });

    unsubscribe();
    expect(removeChannel).toHaveBeenCalledTimes(1);
  });

  it('listens to all accessible chats when no chat id is given', () => {
    const { repository, filters } = createRealtimeRepository();

    repository.subscribeToMessages({ onMessage: () => undefined });

    expect(filters).toEqual([undefined, undefined]);
  });

  it('uses a unique channel name per subscription', () => {
    const { repository, channelNames } = createRealtimeRepository();

    repository.subscribeToMessages({ chatId: CHAT_ID, onMessage: () => undefined });
    repository.subscribeToMessages({ chatId: CHAT_ID, onMessage: () => undefined });

    expect(new Set(channelNames).size).toBe(2);
  });

  it('drops malformed payloads and media without ending the subscription', () => {
    const { repository, handlers } = createRealtimeRepository();
    const onMessage = jest.fn();

    repository.subscribeToMessages({ chatId: CHAT_ID, onMessage });
    handlers.INSERT?.({ new: { id: 'only-an-id' } });
    handlers.INSERT?.({ new: null });
    handlers.INSERT?.({ new: { ...row, media: { not: 'an array' } } });

    expect(onMessage).not.toHaveBeenCalled();
    handlers.INSERT?.({ new: row });
    expect(onMessage).toHaveBeenCalledTimes(1);
  });

  it('reports connection status as subscribed or disconnected', () => {
    const { repository, emitStatus } = createRealtimeRepository();
    const onStatus = jest.fn();

    repository.subscribeToMessages({ onMessage: () => undefined, onStatus });
    emitStatus('SUBSCRIBED');
    emitStatus('CHANNEL_ERROR');
    emitStatus('TIMED_OUT');
    emitStatus('CLOSED');

    expect(onStatus.mock.calls).toEqual([
      ['subscribed'],
      ['disconnected'],
      ['disconnected'],
      ['disconnected'],
    ]);
  });

  it('rejects an invalid chat id before opening a channel', () => {
    const { repository, channelNames } = createRealtimeRepository();

    expect(() =>
      repository.subscribeToMessages({ chatId: 'x,or=(1=1)', onMessage: () => undefined }),
    ).toThrow(expect.objectContaining({ code: 'VALIDATION' }));
    expect(channelNames).toEqual([]);
  });

  it('is a no-op when Supabase is not configured', () => {
    const repository = new ChatRepository(null);

    const unsubscribe = repository.subscribeToMessages({ onMessage: () => undefined });

    expect(() => unsubscribe()).not.toThrow();
  });
});
