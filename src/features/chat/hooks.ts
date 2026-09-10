import { useEffect, useState } from 'react';

import { loadMessages } from './api';
import type { ChatMessage } from './types';

export function useChatMessages(channelId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void loadMessages(channelId)
      .then((nextMessages) => {
        if (!isMounted) {
          return;
        }

        setMessages(nextMessages);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load chat messages.',
        );
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [channelId]);

  return { messages, loading, error };
}
