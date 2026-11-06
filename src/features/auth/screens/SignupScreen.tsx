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
import { WSU_EMAIL_HINT, getSignupErrorMessage } from '../wsuEmail';

const wunifiedLogo = require('../../../../assets/wunified-logo.png') as ImageSourcePropType;

type SignupScreenProps = {
  onShowLogin: () => void;
};

export default function SignupScreen({ onShowLogin }: SignupScreenProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignup() {
    setMessage(null);

    if (!isSupabaseConfigured) {
      setMessage('Add your Supabase URL and anon key before creating users.');
      return;
    }

    if (!username.trim() || !email.trim() || !password) {
      setMessage('Enter a username, email, and password.');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error: signupError } = await supabase!.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.trim(),
          },
        },
      });

      if (signupError) {
        setMessage(getSignupErrorMessage(signupError.message, email));
        return;
      }

      if (data.session?.access_token) {
        setMessage('Account created. You are now logged in.');
        return;
      }

      setMessage('Account created. Check your WSU inbox to confirm your email, then log in.');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unable to create the account right now.';
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
          <Text style={styles.title}>Create account</Text>

          <TextInput
            autoCapitalize="none"
            autoComplete="username"
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor={Colors.textDim}
            style={styles.input}
            value={username}
          />

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
          <Text style={styles.hint}>{WSU_EMAIL_HINT}</Text>

          <TextInput
            autoCapitalize="none"
            autoComplete="password-new"
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
            onPress={handleSignup}
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || isSubmitting) && styles.buttonPressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.onPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>Create account</Text>
            )}
          </Pressable>

          <Pressable onPress={onShowLogin} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
