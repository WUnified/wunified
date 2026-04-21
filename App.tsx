import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { Session } from '@supabase/supabase-js';

import LoginScreen from './app/auth/login';
import SignupScreen from './app/auth/signup';
import HomeScreen from './app/tabs/home';
import { getMissingSupabaseEnvNames } from './src/lib/env';
import { isSupabaseConfigured, supabase } from './src/lib/supabase';

const styles = StyleSheet.create({ 
  safeArea: { //padding to not overlap with ios status bar
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: { // Main container for the app
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  topBar: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingTop: 10,
    paddingBottom: 10,
  },
  topButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  topButtonLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  signOutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  signOutButtonLabel: {
    color: '#ffdf3d',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#444',
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  tabLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  centered: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  setupTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  setupText: {
    color: '#d4d4d4',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  authError: {
    color: '#ffb4a8',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default function App() { // Main App component
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoadingSession(false);
      return;
    }

    supabase!.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          setAuthError(`Failed to load session: ${error.message}`);
          return;
        }

        setSession(data.session);
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : 'Unable to load session.';
        setAuthError(message);
      })
      .finally(() => setIsLoadingSession(false));

    const {
      data: { subscription },
    } = supabase!.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    const missingEnv = getMissingSupabaseEnvNames().join(', ');

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.setupTitle}>Supabase setup needed</Text>
          <Text style={styles.setupText}>
            Add these Expo environment variables, then restart Expo:
          </Text>
          <Text style={styles.authError}>{missingEnv}</Text>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  if (isLoadingSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator color="#ffdf3d" />
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  if (authError || !session) {
    return (
      <>
        {authError ? (
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.centered}>
              <Text style={styles.setupTitle}>Authentication error</Text>
              <Text style={styles.authError}>{authError}</Text>
            </View>
          </SafeAreaView>
        ) : null}
        {authScreen === 'login' ? (
          <LoginScreen onShowSignup={() => setAuthScreen('signup')} />
        ) : (
          <SignupScreen onShowLogin={() => setAuthScreen('login')} />
        )}
        <StatusBar style="light" />
      </>
    );
  }

  return ( //temp buttons a
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topButton}>
            <Text style={styles.topButtonLabel}>Button 1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topButton}>
            <Text style={styles.topButtonLabel}>Button 2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topButton}>
            <Text style={styles.topButtonLabel}>Button 3</Text>
          </TouchableOpacity>
          <Pressable
            onPress={() => {
              supabase!.auth.signOut().catch((error) => {
                console.error('Logout error:', error);
              });
            }}
            style={styles.signOutButton}
          >
            <Text style={styles.signOutButtonLabel}>Sign out</Text>
          </Pressable>
        </View>
        <HomeScreen />
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabLabel}>Tab 1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabLabel}>Tab 2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabLabel}>Tab 3</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="light" />
      </View>
    </SafeAreaView>
  );
}
