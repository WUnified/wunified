import type { SupabaseClient } from '@supabase/supabase-js';

import { isSignedOutAuthError } from './authErrors';
import type { Database, Tables } from '../../types/database';
import { supabase } from '../supabase';

export type EventRow = Pick<
  Tables<'events'>,
  'id' | 'title' | 'description' | 'location' | 'start_time' | 'end_time'
>;
export type EventRsvpRow = Pick<Tables<'event_rsvps'>, 'event_id' | 'status'>;
export type EventRsvpStatus = 'going' | 'maybe' | 'cancelled';

export interface EventDto {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string | null;
}

export interface CreateEventInput {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string | null;
}

export type MyEventRsvpDto = {
  eventId: string;
  status: Exclude<EventRsvpStatus, 'cancelled'>;
};

export type EventsRepositoryErrorCode = 'CONFIGURATION' | 'UNAUTHENTICATED' | 'DATABASE';

export class EventsRepositoryError extends Error {
  readonly code: EventsRepositoryErrorCode;

  constructor(code: EventsRepositoryErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'EventsRepositoryError';
    this.code = code;
  }
}

const EVENT_COLUMNS = 'id, title, description, location, start_time, end_time';
const ACTIVE_RSVP_STATUSES = ['going', 'maybe'] as const;
const QUERY_PAGE_SIZE = 1000;

function requireClient(client: SupabaseClient<Database> | null) {
  if (!client) {
    throw new EventsRepositoryError('CONFIGURATION', 'Supabase is not configured.');
  }
  return client;
}

function mapDatabaseError(
  operation: string,
  error: { code?: string; message: string },
): EventsRepositoryError {
  if (error.code === '28000') {
    return new EventsRepositoryError('UNAUTHENTICATED', `You must be signed in to ${operation}.`, {
      cause: error,
    });
  }

  return new EventsRepositoryError('DATABASE', `Failed to ${operation}: ${error.message}`, {
    cause: error,
  });
}

function mapEvent(row: EventRow): EventDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    startTime: row.start_time,
    endTime: row.end_time,
  };
}

export class EventsRepository {
  constructor(private readonly client: SupabaseClient<Database> | null = supabase) {}

  private async getCurrentUserId(operation: string): Promise<string> {
    const client = requireClient(this.client);
    const { data, error } = await client.auth.getUser();

    if (error && !isSignedOutAuthError(error)) {
      throw mapDatabaseError('load the current user', error);
    }
    if (error || !data.user) {
      throw new EventsRepositoryError(
        'UNAUTHENTICATED',
        `You must be signed in to ${operation}.`,
        error ? { cause: error } : undefined,
      );
    }

    return data.user.id;
  }

  async listEvents(): Promise<EventDto[]> {
    const client = requireClient(this.client);
    const rows: EventRow[] = [];

    for (let offset = 0; ; offset += QUERY_PAGE_SIZE) {
      const { data, error } = await client
        .from('events')
        .select(EVENT_COLUMNS)
        .order('start_time', { ascending: true })
        .order('id', { ascending: true })
        .range(offset, offset + QUERY_PAGE_SIZE - 1);

      if (error) {
        throw mapDatabaseError('load events', error);
      }

      const page = data as EventRow[];
      rows.push(...page);
      if (page.length < QUERY_PAGE_SIZE) {
        break;
      }
    }

    return rows.map(mapEvent);
  }

  // The events insert policy requires created_by to match auth.uid(), so the
  // repository derives it from the authenticated Supabase user.
  async createEvent(input: CreateEventInput): Promise<EventDto> {
    const userId = await this.getCurrentUserId('create an event');
    const { data, error } = await requireClient(this.client)
      .from('events')
      .insert({
        created_by: userId,
        title: input.title,
        description: input.description,
        location: input.location,
        start_time: input.startTime,
        end_time: input.endTime,
      })
      .select(EVENT_COLUMNS)
      .single();

    if (error) {
      throw mapDatabaseError('create event', error);
    }

    return mapEvent(data);
  }

  async listMyRsvps(): Promise<MyEventRsvpDto[]> {
    const userId = await this.getCurrentUserId('view your events');
    const client = requireClient(this.client);
    const rows: EventRsvpRow[] = [];

    for (let offset = 0; ; offset += QUERY_PAGE_SIZE) {
      const { data, error } = await client
        .from('event_rsvps')
        .select('event_id, status')
        .eq('user_id', userId)
        .in('status', ACTIVE_RSVP_STATUSES)
        .order('event_id', { ascending: true })
        .range(offset, offset + QUERY_PAGE_SIZE - 1);

      if (error) {
        throw mapDatabaseError('load your event RSVPs', error);
      }

      const page = data as EventRsvpRow[];
      rows.push(...page);
      if (page.length < QUERY_PAGE_SIZE) {
        break;
      }
    }

    return rows.map((row) => {
      if (row.status !== 'going' && row.status !== 'maybe') {
        throw new EventsRepositoryError(
          'DATABASE',
          `Unexpected active event RSVP status: ${row.status}`,
        );
      }

      return { eventId: row.event_id, status: row.status };
    });
  }

  async setMyRsvp(eventId: string, isGoing: boolean): Promise<void> {
    const userId = await this.getCurrentUserId('manage your event RSVPs');
    const client = requireClient(this.client);

    if (isGoing) {
      const { error } = await client
        .from('event_rsvps')
        .upsert(
          { event_id: eventId, user_id: userId, status: 'going' },
          { onConflict: 'event_id,user_id' },
        );
      if (error) {
        throw mapDatabaseError('RSVP to this event', error);
      }
      return;
    }

    const { error } = await client
      .from('event_rsvps')
      .update({ status: 'cancelled' })
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) {
      throw mapDatabaseError('cancel your event RSVP', error);
    }
  }
}

export const eventsRepository = new EventsRepository();
