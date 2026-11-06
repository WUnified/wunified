import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Session } from '@supabase/supabase-js';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useSession } from './hooks';
import { SessionProvider } from './SessionProvider';

type AuthListener = (event: string, session: Session | null) => void;
type GetSessionResult = { data: { session: Session | null }; error: { message: string } | null };

const mockGetSession = jest.fn<() => Promise<GetSessionResult>>();
const mockUnsubscribe = jest.fn();
const mockOnAuthStateChange = jest.fn((_listener: AuthListener) => ({
  data: { subscription: { unsubscribe: mockUnsubscribe } },
}));
let mockIsConfigured = true;

jest.mock('../../lib/supabase', () => ({
  get isSupabaseConfigured() {
    return mockIsConfigured;
  },
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (listener: AuthListener) => mockOnAuthStateChange(listener),
      signOut: jest.fn(),
    },
  },
}));

const session = { access_token: 'token', user: { id: 'user-1' } } as Session;
const noSession: GetSessionResult = { data: { session: null }, error: null };

function renderSession() {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionProvider>{children}</SessionProvider>
  );
  return renderHook(() => useSession(), { wrapper });
}

function latestAuthListener(): AuthListener {
  const lastCall = mockOnAuthStateChange.mock.calls.at(-1);
  if (!lastCall) throw new Error('The provider should have subscribed to auth changes.');
  return lastCall[0];
}

describe('SessionProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsConfigured = true;
    mockGetSession.mockResolvedValue(noSession);
  });

  it('starts loading, then exposes the stored session', async () => {
    mockGetSession.mockResolvedValue({ data: { session }, error: null });

    const { result } = renderSession();

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject({ session, error: null });
  });

  it('finishes loading with no session when there is none', async () => {
    const { result } = renderSession();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.session).toBeNull();
  });

  it('skips Supabase entirely when it is not configured', async () => {
    mockIsConfigured = false;

    const { result } = renderSession();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockGetSession).not.toHaveBeenCalled();
    expect(mockOnAuthStateChange).not.toHaveBeenCalled();
  });

  it('reports an error returned while loading the session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: { message: 'storage' } });

    const { result } = renderSession();

    await waitFor(() => expect(result.current.error).toBe('Failed to load session: storage'));
    expect(result.current.isLoading).toBe(false);
  });

  it('reports a thrown failure while loading the session', async () => {
    mockGetSession.mockRejectedValue(new Error('offline'));

    const { result } = renderSession();

    await waitFor(() => expect(result.current.error).toBe('offline'));
    expect(result.current.isLoading).toBe(false);
  });

  it('follows sign-in and sign-out events', async () => {
    const { result } = renderSession();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => latestAuthListener()('SIGNED_IN', session));
    expect(result.current.session).toBe(session);

    act(() => latestAuthListener()('SIGNED_OUT', null));
    expect(result.current.session).toBeNull();
  });

  it('clears a stale load error when a later auth event arrives', async () => {
    mockGetSession.mockRejectedValue(new Error('offline'));
    const { result } = renderSession();
    await waitFor(() => expect(result.current.error).toBe('offline'));

    act(() => latestAuthListener()('TOKEN_REFRESHED', session));

    expect(result.current).toMatchObject({ session, error: null });
  });

  it('retry reloads the session and clears the error', async () => {
    mockGetSession.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderSession();
    await waitFor(() => expect(result.current.error).toBe('offline'));
    mockGetSession.mockResolvedValue({ data: { session }, error: null });

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.session).toBe(session));
    expect(result.current.error).toBeNull();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('stops listening for auth changes on unmount', async () => {
    const { result, unmount } = renderSession();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
