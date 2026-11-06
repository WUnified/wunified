import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import type { DependencyList, EffectCallback } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

import { loadMessages } from './api';
import { MESSAGE_POLL_INTERVAL_MS, useMessagePolling } from './messagePolling.hooks';
import type { ChatMessage } from './types';

jest.mock('./api', () => ({ loadMessages: jest.fn() }));
// Treat the screen as focused for as long as the hook is mounted.
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<{
    useEffect: (effect: EffectCallback, deps: DependencyList) => void;
  }>('react');
  return {
    useFocusEffect: (effect: () => () => void) => useEffect(effect, [effect]),
  };
});

const load = jest.mocked(loadMessages);
const message = { id: 'm1' } as ChatMessage;
let appStateListener: ((state: AppStateStatus) => void) | undefined;

describe('useMessagePolling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    load.mockReset();
    load.mockResolvedValue({ messages: [message], hasMore: false, nextCursor: null });
    Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      appStateListener = listener;
      return { remove: jest.fn() };
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('checks for new messages on each interval and stops when the chat closes', async () => {
    const onMessages = jest.fn();
    const { unmount } = renderHook(() => useMessagePolling('chat-1', onMessages));

    await act(() => jest.advanceTimersByTimeAsync(MESSAGE_POLL_INTERVAL_MS));
    expect(load).toHaveBeenCalledWith('chat-1', { pageSize: 20 });
    expect(onMessages).toHaveBeenCalledWith([message]);

    unmount();
    await act(() => jest.advanceTimersByTimeAsync(MESSAGE_POLL_INTERVAL_MS * 3));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('skips checks in the background and checks right away on return', async () => {
    renderHook(() => useMessagePolling('chat-1', jest.fn()));

    act(() => appStateListener?.('background'));
    await act(() => jest.advanceTimersByTimeAsync(MESSAGE_POLL_INTERVAL_MS * 2));
    expect(load).not.toHaveBeenCalled();

    act(() => appStateListener?.('active'));
    // Let the immediate check's promise settle.
    await act(() => jest.advanceTimersByTimeAsync(0));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('keeps polling after a failed check', async () => {
    load.mockRejectedValueOnce(new Error('offline'));
    const onMessages = jest.fn();
    renderHook(() => useMessagePolling('chat-1', onMessages));

    await act(() => jest.advanceTimersByTimeAsync(MESSAGE_POLL_INTERVAL_MS * 2));
    expect(load).toHaveBeenCalledTimes(2);
    expect(onMessages).toHaveBeenCalledTimes(1);
  });

  it('stops while Realtime is connected and resumes when it drops', async () => {
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useMessagePolling('chat-1', jest.fn(), enabled),
      { initialProps: { enabled: false } },
    );
    await act(() => jest.advanceTimersByTimeAsync(MESSAGE_POLL_INTERVAL_MS * 2));
    expect(load).not.toHaveBeenCalled();

    rerender({ enabled: true });
    await act(() => jest.advanceTimersByTimeAsync(MESSAGE_POLL_INTERVAL_MS));
    expect(load).toHaveBeenCalledTimes(1);
  });
});
