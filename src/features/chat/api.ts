import { fetchChatMessages, type ChatMessage } from '../../lib/db';

// Feature-level error boundary for chat loading. The underlying adapter is
// intentionally temporary while conversation security is being designed.
export async function loadMessages(channelId: string): Promise<ChatMessage[]> {
  try {
    return await fetchChatMessages(channelId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to load chat messages.';
    throw new Error(`Failed to load chat messages: ${message}`);
  }
}
