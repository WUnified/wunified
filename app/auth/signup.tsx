import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { isSupabaseConfigured, supabase } from '../../src/lib/supabase';

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
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.trim(),
          },
        },
      });

      if (signupError) {
        setMessage(signupError.message);
        return;
      }

      if (!data.user) {
        setMessage('Account created. Check your email before logging in.');
        return;
      }

      setMessage('Account created. You are now logged in.');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to create the account right now.';
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
      <View style={styles.form}>
        <Text style={styles.brand}>WUnified</Text>
        <Text style={styles.title}>Create account</Text>

        <TextInput
          autoCapitalize="none"
          autoComplete="username"
          onChangeText={setUsername}
          placeholder="Username"
          placeholderTextColor="#9a9a9a"
          style={styles.input}
          value={username}
        />

        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          inputMode="email"
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#9a9a9a"
          style={styles.input}
          value={email}
        />

        <TextInput
          autoCapitalize="none"
          autoComplete="password-new"
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#9a9a9a"
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
            <ActivityIndicator color="#101010" />
          ) : (
            <Text style={styles.primaryButtonText}>Create account</Text>
          )}
        </Pressable>

        <Pressable onPress={onShowLogin} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
    justifyContent: 'center',
    padding: 24,
  },
  form: {
    gap: 14,
  },
  brand: {
    color: '#ffdf3d',
    fontSize: 42,
    fontWeight: '800',
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#282828',
    borderColor: '#3d3d3d',
    borderRadius: 8,
    borderWidth: 1,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  message: {
    color: '#ffb4a8',
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#ffdf3d',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#101010',
    fontSize: 16,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.75,
  },
  secondaryButton: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
