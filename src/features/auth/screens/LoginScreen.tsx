import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { authScreenStyles as styles } from './AuthScreen.styles';
import { Colors } from '../../../constants/colors';
import { isSupabaseConfigured, supabase } from '../../../lib/supabase';

const wunifiedLogo = require('../../../../assets/wunified-logo.png') as ImageSourcePropType;

type LoginScreenProps = {
  onShowSignup: () => void;
};

export default function LoginScreen({ onShowSignup }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    setMessage(null);

    if (!isSupabaseConfigured) {
      setMessage('Add your Supabase URL and anon key before logging in.');
      return;
    }

    if (!email.trim() || !password) {
      setMessage('Enter your email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase!.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to log in right now.';
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <View style={styles.brand}>
            <View style={styles.logoWindow}>
              <Image
                accessibilityLabel="WUnified"
                resizeMode="contain"
                source={wunifiedLogo}
                style={styles.logoImage}
              />
            </View>
          </View>
          <Text style={styles.title}>Log in</Text>

          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            inputMode="email"
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={Colors.textDim}
            style={styles.input}
            value={email}
          />

          <TextInput
            autoCapitalize="none"
            autoComplete="password"
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={Colors.textDim}
            secureTextEntry
            style={styles.input}
            value={password}
          />

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable
            disabled={isSubmitting}
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || isSubmitting) && styles.buttonPressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.onPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>Log in</Text>
            )}
          </Pressable>

          <Pressable onPress={onShowSignup} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Create an account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
