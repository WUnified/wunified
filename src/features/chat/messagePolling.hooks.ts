import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { loadMessages } from './api';
import type { ChatMessage } from './types';

// Stopgap until chat_messages has Supabase Realtime: while a conversation is open and
// the app is in the foreground, fetch the newest page every 10 seconds. That is one
// request per open chat, and it stops when the user leaves or backgrounds the app.
export const MESSAGE_POLL_INTERVAL_MS = 10_000;

export function useMessagePolling(chatId: string, onMessages: (messages: ChatMessage[]) => void) {
  // Read the latest callback through a ref so the polling loop never restarts mid-chat.
  const onMessagesRef = useRef(onMessages);
  useEffect(() => {
    onMessagesRef.current = onMessages;
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let inForeground = AppState.currentState === 'active';

      async function poll() {
        if (!inForeground) return;
        try {
          // Only the newest messages can be new, so a small page keeps each check light.
          const page = await loadMessages(chatId, { pageSize: 20 });
          if (active) onMessagesRef.current(page.messages);
        } catch {
          // A missed background refresh is retried on the next tick; showing an error
          // for it would be noise while the visible conversation still works.
        }
      }

      const timer = setInterval(() => void poll(), MESSAGE_POLL_INTERVAL_MS);
      const subscription = AppState.addEventListener('change', (state) => {
        const returning = state === 'active' && !inForeground;
        inForeground = state === 'active';
        // Coming back to the app should show replies right away, not after a tick.
        if (returning) void poll();
      });

      return () => {
        active = false;
        clearInterval(timer);
        subscription.remove();
      };
    }, [chatId]),
  );
}
