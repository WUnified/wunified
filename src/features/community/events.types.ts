import type { EventDto, EventRsvpStatus } from '../../lib/db';

export type CommunityEvent = EventDto & {
  rsvpStatus: Exclude<EventRsvpStatus, 'cancelled'> | null;
};
