import { describe, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

import { EventsRepository } from './events';
import type { Database } from '../../types/database';

describe('EventsRepository', () => {
  it('scopes RSVP reads to the authenticated user and active statuses', async () => {
    const filters: [string, unknown][] = [];
    const result = {
      data: [
        { event_id: 'event-1', status: 'going' },
        { event_id: 'event-2', status: 'maybe' },
      ],
      error: null,
    };
    const query = {
      select: () => query,
      eq: (column: string, value: unknown) => {
        filters.push([column, value]);
        return query;
      },
      in: (column: string, values: readonly string[]) => {
        filters.push([column, values]);
        return Promise.resolve(result);
      },
    };
    const auth = {
      getUser: jest
        .fn<
          () => Promise<{
            data: { user: { id: string } };
            error: null;
          }>
        >()
        .mockResolvedValue({
          data: { user: { id: 'authenticated-user' } },
          error: null,
        }),
    };
    const client = {
      auth,
      from: jest.fn(() => query),
    } as unknown as SupabaseClient<Database>;

    await expect(new EventsRepository(client).listMyRsvps()).resolves.toEqual([
      { eventId: 'event-1', status: 'going' },
      { eventId: 'event-2', status: 'maybe' },
    ]);
    expect(filters).toEqual([
      ['user_id', 'authenticated-user'],
      ['status', ['going', 'maybe']],
    ]);
  });

  it('inserts an event with the authenticated user as its creator', async () => {
    const insertedEvent = {
      id: 'created-event',
      title: 'Campus meetup',
      description: 'Bring a friend',
      location: 'Student center',
      start_time: '2099-03-01T10:30:00.000Z',
      end_time: null,
    };
    const insert = jest.fn();
    const single = jest
      .fn<
        () => Promise<{
          data: typeof insertedEvent;
          error: null;
        }>
      >()
      .mockResolvedValue({ data: insertedEvent, error: null });
    const query = {
      insert,
      select: jest.fn(),
      single,
    };
    insert.mockReturnValue(query);
    query.select.mockReturnValue(query);
    const auth = {
      getUser: jest
        .fn<
          () => Promise<{
            data: { user: { id: string } };
            error: null;
          }>
        >()
        .mockResolvedValue({
          data: { user: { id: 'authenticated-user' } },
          error: null,
        }),
    };
    const client = {
      auth,
      from: jest.fn(() => query),
    } as unknown as SupabaseClient<Database>;

    await expect(
      new EventsRepository(client).createEvent({
        title: 'Campus meetup',
        description: 'Bring a friend',
        location: 'Student center',
        startTime: '2099-03-01T10:30:00.000Z',
        endTime: null,
      }),
    ).resolves.toEqual({
      id: 'created-event',
      title: 'Campus meetup',
      description: 'Bring a friend',
      location: 'Student center',
      startTime: '2099-03-01T10:30:00.000Z',
      endTime: null,
    });
    expect(insert).toHaveBeenCalledWith({
      created_by: 'authenticated-user',
      title: 'Campus meetup',
      description: 'Bring a friend',
      location: 'Student center',
      start_time: '2099-03-01T10:30:00.000Z',
      end_time: null,
    });
  });
});
