import type { CommunityEvent } from './events.types';
import { eventsRepository } from '../../lib/db';
import type { CreateEventInput, EventDto } from '../../lib/db';

export async function loadCommunityEvents(): Promise<CommunityEvent[]> {
  try {
    const [events, rsvps] = await Promise.all([
      eventsRepository.listEvents(),
      eventsRepository.listMyRsvps(),
    ]);
    const rsvpsByEventId = new Map(rsvps.map((rsvp) => [rsvp.eventId, rsvp.status]));
    const uniqueEvents = new Map<string, EventDto>();

    for (const event of events) {
      if (!uniqueEvents.has(event.id)) {
        uniqueEvents.set(event.id, event);
      }
    }

    return [...uniqueEvents.values()].map((event) => ({
      ...event,
      rsvpStatus: rsvpsByEventId.get(event.id) ?? null,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load events.';
    throw new Error(`Failed to load community events: ${message}`, { cause: error });
  }
}

export async function setCommunityEventRsvp(eventId: string, isGoing: boolean): Promise<void> {
  try {
    await eventsRepository.setMyRsvp(eventId, isGoing);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update your RSVP.';
    throw new Error(`Failed to update event RSVP: ${message}`, { cause: error });
  }
}

// Adds the missing create operation at the feature boundary without changing
// the existing event-read or RSVP API contracts.
export async function createCommunityEvent(input: CreateEventInput): Promise<EventDto> {
  try {
    return await eventsRepository.createEvent(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create event.';
    throw new Error(`Failed to create event: ${message}`, { cause: error });
  }
}
