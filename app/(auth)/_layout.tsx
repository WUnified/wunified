import { Redirect, Stack } from 'expo-router';

import { useSession } from '../../src/features/auth';

export default function AuthLayout() {
  const { session } = useSession();

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
