import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { subscribeToChatMessages } from './api';
import { useChatMessageSubscription } from './realtime';
import type { ChatMessageEvent } from './types';

jest.mock('./api', () => ({ subscribeToChatMessages: jest.fn() }));

type SubscribeOptions = Parameters<typeof subscribeToChatMessages>[0];

const subscribe = jest.mocked(subscribeToChatMessages);
const unsubscribe = jest.fn();

function latestSubscription(): SubscribeOptions {
  const lastCall = subscribe.mock.calls.at(-1);
  if (!lastCall) throw new Error('The hook should have subscribed.');
  return lastCall[0];
}

function renderSubscription(
  overrides: Partial<Parameters<typeof useChatMessageSubscription>[0]> = {},
) {
  const onMessage = jest.fn();
  const onResync = jest.fn();
  const view = renderHook(
    (props: Partial<Parameters<typeof useChatMessageSubscription>[0]>) =>
      useChatMessageSubscription({ onMessage, onResync, ...props }),
    { initialProps: overrides },
  );
  return { ...view, onMessage, onResync };
}

describe('useChatMessageSubscription', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    subscribe.mockReturnValue(unsubscribe);
  });

  it('subscribes to the requested chat, and reports connected once subscribed', () => {
    const { result } = renderSubscription({ chatId: 'chat-1' });

    expect(latestSubscription().chatId).toBe('chat-1');
    expect(result.current.connected).toBe(false);

    act(() => latestSubscription().onStatus?.('subscribed'));

    expect(result.current.connected).toBe(true);
  });

  it('forwards incoming messages to the latest callback without resubscribing', () => {
    const { rerender, onMessage } = renderSubscription();
    const event = { type: 'insert' } as unknown as ChatMessageEvent;
    const replacement = jest.fn();

    rerender({ onMessage: replacement });
    latestSubscription().onMessage(event);

    expect(replacement).toHaveBeenCalledWith(event);
    expect(onMessage).not.toHaveBeenCalled();
    expect(subscribe).toHaveBeenCalledTimes(1);
  });

  it('does not resync on the first successful connection', () => {
    const { onResync } = renderSubscription();

    act(() => latestSubscription().onStatus?.('subscribed'));

    expect(onResync).not.toHaveBeenCalled();
  });

  it('reports disconnected when the connection drops, and resyncs when it returns', () => {
    const { result, onResync } = renderSubscription();
    act(() => latestSubscription().onStatus?.('subscribed'));

    act(() => latestSubscription().onStatus?.('disconnected'));
    expect(result.current.connected).toBe(false);
    expect(onResync).not.toHaveBeenCalled();

    act(() => latestSubscription().onStatus?.('subscribed'));
    expect(result.current.connected).toBe(true);
    expect(onResync).toHaveBeenCalledTimes(1);
  });

  it('does not subscribe while disabled', () => {
    const { result } = renderSubscription({ enabled: false });

    expect(subscribe).not.toHaveBeenCalled();
    expect(result.current.connected).toBe(false);
  });

  it('resubscribes when the chat changes', () => {
    const { rerender } = renderSubscription({ chatId: 'chat-1' });

    rerender({ chatId: 'chat-2' });

    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(latestSubscription().chatId).toBe('chat-2');
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderSubscription();

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('stays disconnected instead of crashing when subscribing throws', () => {
    subscribe.mockImplementation(() => {
      throw new Error('A valid chat ID is required.');
    });

    const { result, unmount } = renderSubscription({ chatId: 'bad-id' });

    expect(result.current.connected).toBe(false);
    expect(() => unmount()).not.toThrow();
  });
});
