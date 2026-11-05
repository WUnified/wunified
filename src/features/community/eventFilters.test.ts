import { describe, expect, it } from '@jest/globals';

import { filterCommunityEvents } from './eventFilters';
import type { CommunityEvent } from './events.types';

const events: CommunityEvent[] = [
  {
    id: 'past',
    title: 'Past event',
    description: 'Completed event',
    location: 'Student center',
    startTime: '2020-01-01T10:00:00.000Z',
    endTime: null,
    rsvpStatus: 'going',
  },
  {
    id: 'upcoming-campus',
    title: 'Campus event',
    description: 'Upcoming event',
    location: 'Campus lawn',
    startTime: '2099-01-01T10:00:00.000Z',
    endTime: null,
    rsvpStatus: null,
  },
];

describe('filterCommunityEvents', () => {
  it('combines location and date filters using event schema fields', () => {
    expect(
      filterCommunityEvents(
        events,
        { location: 'campus', date: 'upcoming' },
        new Date('2026-01-01T00:00:00.000Z'),
      ).map((event) => event.id),
    ).toEqual(['upcoming-campus']);
  });

  it('matches location case-insensitively and supports past/all dates', () => {
    expect(
      filterCommunityEvents(events, { location: 'STUDENT', date: 'past' }).map((event) => event.id),
    ).toEqual(['past']);
    expect(filterCommunityEvents(events, { location: '', date: 'all' })).toHaveLength(2);
  });
});
