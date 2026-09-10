// Temporary chat contract used until the reviewed conversations and
// participant-pair RLS model is implemented. No chat tables are queried here.
export type ChatMessage = {
  id: string;
  sender_id: string;
  text: string;
  created_at: string;
};

// Keep the feature API usable during schema work without implying that this is
// a production persistence path.
export async function fetchChatMessages(
  channelId: string,
): Promise<ChatMessage[]> {
  return [
    {
      id: `welcome-${channelId}`,
      sender_id: 'system',
      text: `Welcome to #${channelId}. Start the conversation.`,
      created_at: new Date().toISOString(),
    },
  ];
}
