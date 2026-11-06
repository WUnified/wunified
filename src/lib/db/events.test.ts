import { describe, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

import { EventsRepository } from './events';
import {
  AUTH_SERVICE_FAILURES,
  SIGNED_OUT_AUTH_ERRORS,
  clientWithAuthError,
} from '../../test/authFailures';
import type { Database } from '../../types/database';

describe('EventsRepository', () => {
  it('pages event reads with deterministic ordering', async () => {
    const eventRows = Array.from({ length: 1001 }, (_, index) => ({
      id: `event-${index}`,
      title: `Event ${index}`,
      description: '',
      location: 'Student center',
      start_time: `2099-03-${String((index % 28) + 1).padStart(2, '0')}T10:30:00.000Z`,
      end_time: null,
    }));
    const rangeCalls: [number, number][] = [];
    const orderCalls: [string, { ascending: boolean }][] = [];
    const query = {
      select: () => query,
      order: (column: string, options: { ascending: boolean }) => {
        orderCalls.push([column, options]);
        return query;
      },
      range: (from: number, to: number) => {
        rangeCalls.push([from, to]);
        return Promise.resolve({ data: eventRows.slice(from, to + 1), error: null });
      },
    };
    const client = {
      from: jest.fn(() => query),
    } as unknown as SupabaseClient<Database>;

    const events = await new EventsRepository(client).listEvents();

    expect(events).toHaveLength(1001);
    expect(events[1000]?.id).toBe('event-1000');
    expect(orderCalls).toEqual([
      ['start_time', { ascending: true }],
      ['id', { ascending: true }],
      ['start_time', { ascending: true }],
      ['id', { ascending: true }],
    ]);
    expect(rangeCalls).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
  });

  it('pages active RSVP reads scoped to the authenticated user', async () => {
    const rsvpRows = Array.from({ length: 1001 }, (_, index) => ({
      event_id: `event-${index}`,
      status: index % 2 === 0 ? 'going' : 'maybe',
    }));
    const filters: [string, unknown][] = [];
    const rangeCalls: [number, number][] = [];
    const query = {
      select: () => query,
      eq: (column: string, value: unknown) => {
        filters.push([column, value]);
        return query;
      },
      in: (column: string, values: readonly string[]) => {
        filters.push([column, values]);
        return query;
      },
      order: (column: string, options: { ascending: boolean }) => {
        filters.push([column, options]);
        return query;
      },
      range: (from: number, to: number) => {
        rangeCalls.push([from, to]);
        return Promise.resolve({ data: rsvpRows.slice(from, to + 1), error: null });
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

    const rsvps = await new EventsRepository(client).listMyRsvps();

    expect(rsvps).toHaveLength(1001);
    expect(rsvps[1000]).toEqual({ eventId: 'event-1000', status: 'going' });
    expect(filters).toEqual([
      ['user_id', 'authenticated-user'],
      ['status', ['going', 'maybe']],
      ['event_id', { ascending: true }],
      ['user_id', 'authenticated-user'],
      ['status', ['going', 'maybe']],
      ['event_id', { ascending: true }],
    ]);
    expect(rangeCalls).toEqual([
      [0, 999],
      [1000, 1999],
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

describe('EventsRepository auth failures', () => {
  it.each(AUTH_SERVICE_FAILURES)(
    'reports %s as a failure, not as being signed out',
    async (_name, error) => {
      await expect(
        new EventsRepository(clientWithAuthError(error)).listMyRsvps(),
      ).rejects.toMatchObject({ code: 'DATABASE' });
    },
  );

  it.each(SIGNED_OUT_AUTH_ERRORS)('reports %s as UNAUTHENTICATED', async (_name, error) => {
    await expect(
      new EventsRepository(clientWithAuthError(error)).listMyRsvps(),
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });
});
