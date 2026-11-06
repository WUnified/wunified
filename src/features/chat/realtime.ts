import { useEffect, useRef } from 'react';

import { subscribeToChatMessages } from './api';
import type { ChatMessageEvent } from './types';

type UseChatMessageSubscriptionOptions = {
  // Omit to listen to every chat the user can access (the inbox).
  chatId?: string | null;
  enabled?: boolean;
  onMessage: (event: ChatMessageEvent) => void;
  // Called after a dropped connection comes back; realtime never replays what was
  // missed, so the consumer should refetch.
  onResync: () => void;
};

export function useChatMessageSubscription({
  chatId,
  enabled = true,
  onMessage,
  onResync,
}: UseChatMessageSubscriptionOptions) {
  // Callbacks are read through refs so a new closure each render does not tear down
  // and re-create the subscription.
  const onMessageRef = useRef(onMessage);
  const onResyncRef = useRef(onResync);
  useEffect(() => {
    onMessageRef.current = onMessage;
    onResyncRef.current = onResync;
  });

  useEffect(() => {
    if (!enabled) return;

    let dropped = false;
    let unsubscribe: () => void;
    try {
      unsubscribe = subscribeToChatMessages({
        chatId,
        onMessage: (event) => onMessageRef.current(event),
        onStatus: (status) => {
          if (status === 'subscribed') {
            if (dropped) onResyncRef.current();
            dropped = false;
          } else {
            dropped = true;
          }
        },
      });
    } catch {
      // Only an invalid chat id throws, and the normal message load reports that
      // same error to the user.
      return;
    }
    return unsubscribe;
  }, [chatId, enabled]);
}
