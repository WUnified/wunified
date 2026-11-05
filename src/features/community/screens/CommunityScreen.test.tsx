import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { CommunityScreen } from './CommunityScreen';
import { createCommunityEvent, loadCommunityEvents, setCommunityEventRsvp } from '../events.api';
import type { CommunityEvent } from '../events.types';

let mockUserId = 'user-1';

jest.mock('../../auth', () => ({
  useSession: () => ({ session: { user: { id: mockUserId } } }),
}));

jest.mock('../events.api', () => ({
  createCommunityEvent: jest.fn(),
  loadCommunityEvents: jest.fn(),
  setCommunityEventRsvp: jest.fn(),
}));

const eventFixtures: CommunityEvent[] = [
  {
    id: 'past-event',
    title: 'Past RSVP event',
    description: 'A completed event',
    location: 'Student center',
    startTime: '2020-01-01T10:00:00.000Z',
    endTime: '2020-01-01T12:00:00.000Z',
    rsvpStatus: 'going',
  },
  {
    id: 'upcoming-event',
    title: 'Upcoming RSVP event',
    description: 'An upcoming event',
    location: 'Campus lawn',
    startTime: '2099-01-01T10:00:00.000Z',
    endTime: '2099-01-01T12:00:00.000Z',
    rsvpStatus: 'maybe',
  },
  {
    id: 'discover-event',
    title: 'Discover only event',
    description: 'Not RSVP’d',
    location: 'Library',
    startTime: '2099-02-01T10:00:00.000Z',
    endTime: null,
    rsvpStatus: null,
  },
];

const loadEventsMock = jest.mocked(loadCommunityEvents);
const setRsvpMock = jest.mocked(setCommunityEventRsvp);
const createEventMock = jest.mocked(createCommunityEvent);

describe('CommunityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = 'user-1';
    loadEventsMock.mockResolvedValue(eventFixtures);
    setRsvpMock.mockResolvedValue(undefined);
    createEventMock.mockResolvedValue({
      id: 'new-event',
      title: 'New event',
      description: 'Created from the form',
      location: 'Campus lawn',
      startTime: '2099-03-01T10:00:00.000Z',
      endTime: null,
    });
  });

  it('shows all events in Discover and only past and upcoming RSVPs in My Events', async () => {
    const { getByRole, getByText, queryByText } = render(<CommunityScreen />);

    await waitFor(() => expect(getByText('Past RSVP event')).toBeTruthy());
    expect(getByText('Upcoming RSVP event')).toBeTruthy();
    expect(getByText('Discover only event')).toBeTruthy();

    fireEvent.press(getByRole('tab', { name: 'My Events' }));

    expect(getByText('Past RSVP event')).toBeTruthy();
    expect(getByText('Upcoming RSVP event')).toBeTruthy();
    expect(queryByText('Discover only event')).toBeNull();
    expect(queryByText('Feed')).toBeNull();
    expect(queryByText('Clubs')).toBeNull();
  });

  it('updates My Events when an RSVP is cancelled', async () => {
    const { getByRole, getByText, queryByText } = render(<CommunityScreen />);

    await waitFor(() => expect(getByText('Past RSVP event')).toBeTruthy());
    fireEvent.press(getByRole('tab', { name: 'My Events' }));
    fireEvent.press(getByRole('button', { name: 'Cancel RSVP for Past RSVP event' }));

    await waitFor(() => expect(setRsvpMock).toHaveBeenCalledWith('past-event', false));
    await waitFor(() => expect(queryByText('Past RSVP event')).toBeNull());
  });

  it('adds an event to My Events after the user RSVPs', async () => {
    const { getByRole, getByText } = render(<CommunityScreen />);

    await waitFor(() => expect(getByText('Discover only event')).toBeTruthy());
    fireEvent.press(getByRole('button', { name: 'RSVP for Discover only event' }));

    await waitFor(() => expect(setRsvpMock).toHaveBeenCalledWith('discover-event', true));
    fireEvent.press(getByRole('tab', { name: 'My Events' }));
    expect(getByText('Discover only event')).toBeTruthy();
  });

  it('does not show events from a previous account after the session changes', async () => {
    const otherAccountEvents = [
      { ...eventFixtures[0], id: 'other-account-event', title: 'Other account event' },
    ];
    const { getByText, queryByText, rerender } = render(<CommunityScreen />);

    await waitFor(() => expect(getByText('Past RSVP event')).toBeTruthy());
    mockUserId = 'user-2';
    loadEventsMock.mockResolvedValueOnce(otherAccountEvents);
    rerender(<CommunityScreen />);

    expect(queryByText('Past RSVP event')).toBeNull();
    await waitFor(() => expect(getByText('Other account event')).toBeTruthy());
  });

  it('shows an empty state and offers a way back to Discover', async () => {
    loadEventsMock.mockResolvedValue(
      eventFixtures.map((event) => ({ ...event, rsvpStatus: null })),
    );
    const { getByRole, getByText } = render(<CommunityScreen />);

    await waitFor(() => expect(getByText('Discover only event')).toBeTruthy());
    fireEvent.press(getByRole('tab', { name: 'My Events' }));
    expect(getByText("You haven't RSVP'd to any events yet.")).toBeTruthy();
    fireEvent.press(getByRole('button', { name: 'Explore events' }));
    expect(getByText('Past RSVP event')).toBeTruthy();
  });

  it('shows a loading state, errors, and retries the request', async () => {
    let rejectInitialLoad: (error: Error) => void = () => {};
    const initialLoad = new Promise<CommunityEvent[]>((_resolve, reject) => {
      rejectInitialLoad = reject;
    });
    loadEventsMock.mockReturnValueOnce(initialLoad).mockResolvedValueOnce(eventFixtures);
    const { getByLabelText, getByRole, getByText } = render(<CommunityScreen />);

    expect(getByLabelText('Loading events')).toBeTruthy();
    await act(async () => {
      rejectInitialLoad(new Error('Network unavailable'));
      await initialLoad.catch(() => {});
    });
    await waitFor(() => expect(getByText(/Network unavailable/)).toBeTruthy());
    fireEvent.press(getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(getByText('Past RSVP event')).toBeTruthy());
  });

  it('filters by location and date together, and clears both filters', async () => {
    const { getByLabelText, getByRole, getByText, queryByText } = render(<CommunityScreen />);

    await waitFor(() => expect(getByText('Past RSVP event')).toBeTruthy());
    fireEvent.press(getByLabelText('Filter events'));
    fireEvent.changeText(getByLabelText('Filter by location'), 'Campus');
    fireEvent.press(getByRole('button', { name: 'Upcoming' }));
    fireEvent.press(getByRole('button', { name: 'Apply filters' }));

    expect(getByText('Upcoming RSVP event')).toBeTruthy();
    expect(queryByText('Past RSVP event')).toBeNull();
    expect(queryByText('Discover only event')).toBeNull();

    fireEvent.press(getByLabelText('Filter events, filters applied'));
    fireEvent.press(getByRole('button', { name: 'Clear filters' }));

    expect(getByText('Past RSVP event')).toBeTruthy();
    expect(getByText('Discover only event')).toBeTruthy();
  });

  it('validates required fields before creating an event', () => {
    const { getByLabelText, getByRole, getByText } = render(<CommunityScreen />);

    fireEvent.press(getByLabelText('Create event'));
    fireEvent.press(getByRole('button', { name: 'Submit new event' }));

    expect(getByText('Enter an event title.')).toBeTruthy();
    expect(getByText('Enter a valid start date and time.')).toBeTruthy();
    expect(createEventMock).not.toHaveBeenCalled();
  });

  it('creates an event and reloads the feed', async () => {
    const createdEvent = {
      id: 'new-event',
      title: 'New event',
      description: 'Created from the form',
      location: 'Campus lawn',
      startTime: '2099-03-01T10:00:00.000Z',
      endTime: null,
      rsvpStatus: null,
    };
    const { getByLabelText, getByRole, getByText } = render(<CommunityScreen />);
    await waitFor(() => expect(getByText('Past RSVP event')).toBeTruthy());
    loadEventsMock.mockResolvedValueOnce([...eventFixtures, createdEvent]);

    fireEvent.press(getByLabelText('Create event'));
    fireEvent.changeText(getByLabelText('Title'), 'New event');
    fireEvent.changeText(getByLabelText('Description'), 'Created from the form');
    fireEvent.changeText(getByLabelText('Location'), 'Campus lawn');
    fireEvent.changeText(getByLabelText('Start date'), '2099-03-01');
    fireEvent.changeText(getByLabelText('Start time'), '10:00');
    fireEvent.press(getByRole('button', { name: 'Submit new event' }));

    await waitFor(() =>
      expect(createEventMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New event',
          description: 'Created from the form',
          location: 'Campus lawn',
          startTime: expect.any(String),
          endTime: null,
        }),
      ),
    );
    await waitFor(() => expect(getByText('New event')).toBeTruthy());
    expect(loadEventsMock).toHaveBeenCalledTimes(2);
  });

  it('keeps the form open and shows Supabase errors', async () => {
    createEventMock.mockRejectedValueOnce(new Error('Permission denied'));
    const { getByLabelText, getByRole, getByText } = render(<CommunityScreen />);
    fireEvent.press(getByLabelText('Create event'));
    fireEvent.changeText(getByLabelText('Title'), 'New event');
    fireEvent.changeText(getByLabelText('Description'), 'Created from the form');
    fireEvent.changeText(getByLabelText('Location'), 'Campus lawn');
    fireEvent.changeText(getByLabelText('Start date'), '2099-03-01');
    fireEvent.changeText(getByLabelText('Start time'), '10:00');
    fireEvent.press(getByRole('button', { name: 'Submit new event' }));

    expect(await waitFor(() => getByText(/Permission denied/))).toBeTruthy();
    expect(getByLabelText('Title')).toBeTruthy();
  });
});
