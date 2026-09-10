import { router } from 'expo-router';

import { LoginScreen } from '../../src/features/auth';

export default function LoginRoute() {
  return <LoginScreen onShowSignup={() => router.push('/(auth)/signup')} />;
}
