import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '../src/constants/colors';
import { getMissingSupabaseEnvNames } from '../src/lib/env';
import { isSupabaseConfigured } from '../src/lib/supabase';
import { SessionProvider, useSession } from '../src/features/auth';

function RootGate() {
  const { isLoading, error, retry } = useSession();

  if (!isSupabaseConfigured) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Supabase setup needed</Text>
        <Text style={styles.body}>
          Add these Expo environment variables, then restart Expo:
        </Text>
        <Text style={styles.mono}>{getMissingSupabaseEnvNames().join(', ')}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Authentication error</Text>
        <Text style={styles.error}>{error}</Text>
        <Pressable
          onPress={retry}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonLabel}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <RootGate />
        <StatusBar style="light" />
      </SessionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    color: Colors.textDim,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  mono: {
    color: Colors.danger,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    textAlign: 'center',
  },
  error: {
    color: Colors.danger,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 44,
    paddingHorizontal: 24,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonLabel: {
    color: Colors.onPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
});
