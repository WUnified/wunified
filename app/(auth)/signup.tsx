import { router } from 'expo-router';

import { SignupScreen } from '../../src/features/auth';

export default function SignupRoute() {
  return (
    <SignupScreen
      onShowLogin={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
    />
  );
}
