import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { createCommunityEvent, loadCommunityEvents } from './events.api';
import { eventsRepository } from '../../lib/db';

jest.mock('../../lib/db', () => ({
  eventsRepository: {
    createEvent: jest.fn(),
    listEvents: jest.fn(),
    listMyRsvps: jest.fn(),
    setMyRsvp: jest.fn(),
  },
}));

describe('loadCommunityEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('joins active RSVPs to unique events and retains past RSVP events', async () => {
    jest.mocked(eventsRepository).listEvents.mockResolvedValue([
      {
        id: 'past',
        title: 'Past event',
        description: 'Completed',
        location: 'Campus',
        startTime: '2020-01-01T10:00:00.000Z',
        endTime: null,
      },
      {
        id: 'past',
        title: 'Duplicate event',
        description: 'Duplicate',
        location: 'Campus',
        startTime: '2020-01-01T10:00:00.000Z',
        endTime: null,
      },
      {
        id: 'not-rsvped',
        title: 'Discover event',
        description: 'No RSVP',
        location: 'Campus',
        startTime: '2099-01-01T10:00:00.000Z',
        endTime: null,
      },
    ]);
    jest
      .mocked(eventsRepository)
      .listMyRsvps.mockResolvedValue([{ eventId: 'past', status: 'maybe' }]);

    await expect(loadCommunityEvents()).resolves.toEqual([
      {
        id: 'past',
        title: 'Past event',
        description: 'Completed',
        location: 'Campus',
        startTime: '2020-01-01T10:00:00.000Z',
        endTime: null,
        rsvpStatus: 'maybe',
      },
      {
        id: 'not-rsvped',
        title: 'Discover event',
        description: 'No RSVP',
        location: 'Campus',
        startTime: '2099-01-01T10:00:00.000Z',
        endTime: null,
        rsvpStatus: null,
      },
    ]);
  });
});

describe('createCommunityEvent', () => {
  it('creates events through the events repository', async () => {
    const input = {
      title: 'Campus meetup',
      description: 'Bring a friend',
      location: 'Student center',
      startTime: '2099-03-01T10:30:00.000Z',
      endTime: null,
    };
    const result = {
      id: 'event-1',
      ...input,
    };
    jest.mocked(eventsRepository).createEvent.mockResolvedValue(result);

    await expect(createCommunityEvent(input)).resolves.toEqual(result);
    expect(jest.mocked(eventsRepository).createEvent.mock.calls).toContainEqual([input]);
  });
});
