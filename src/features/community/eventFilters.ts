import type { CommunityEvent } from './events.types';

export type EventDateFilter = 'all' | 'upcoming' | 'past';

export interface CommunityEventFilters {
  location: string;
  date: EventDateFilter;
}

export const DEFAULT_EVENT_FILTERS: CommunityEventFilters = {
  location: '',
  date: 'all',
};

export function filterCommunityEvents(
  events: CommunityEvent[],
  filters: CommunityEventFilters,
  now = new Date(),
): CommunityEvent[] {
  const normalizedLocation = filters.location.trim().toLowerCase();
  const currentTime = now.getTime();

  return events.filter((event) => {
    const matchesLocation =
      !normalizedLocation || event.location.toLowerCase().includes(normalizedLocation);
    const startsAt = new Date(event.startTime).getTime();
    const matchesDate =
      filters.date === 'all' ||
      (filters.date === 'upcoming' && startsAt >= currentTime) ||
      (filters.date === 'past' && startsAt < currentTime);

    return matchesLocation && matchesDate;
  });
}
