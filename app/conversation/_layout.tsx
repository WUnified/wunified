import { Redirect, Stack } from 'expo-router';

import { useSession } from '../../src/features/auth';

// Conversations sit above the tab bar, so they need the same signed-in guard as (tabs).
export default function ConversationLayout() {
  const { session } = useSession();

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
