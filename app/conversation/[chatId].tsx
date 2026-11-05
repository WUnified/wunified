import { useLocalSearchParams } from 'expo-router';

import { ConversationScreen } from '../../src/features/chat';

export default function ConversationRoute() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  return <ConversationScreen chatId={chatId} />;
}
