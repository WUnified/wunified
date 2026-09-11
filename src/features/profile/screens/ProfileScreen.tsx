import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '../../../constants/colors';
import { useSignOut } from '../../auth';
import { useCurrentProfile, useProfileMutation } from '../hooks';
import type { ProfileRecord } from '../types';

type ProfileForm = {
  username: string;
  display_name: string;
  avatar: string;
};

function toForm(profile: ProfileRecord): ProfileForm {
  return {
    username: profile.username,
    display_name: profile.display_name,
    avatar: profile.avatar ?? '',
  };
}

export function ProfileScreen() {
  const signOut = useSignOut();
  const { profile: loadedProfile, loading, error: loadError } = useCurrentProfile();
  const { saving, error: saveError, updateProfile } = useProfileMutation();

  // The load hook exposes no setter, so local state only holds records returned
  // by a save. Falling back to the loaded profile during render (not via an
  // effect) avoids a one-frame "Profile not found" flash after loading ends.
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const current = profile ?? loadedProfile;
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  // The mutation hook cannot reset its error, so hide a failure from an earlier
  // edit session until the user attempts another save.
  const [saveAttempted, setSaveAttempted] = useState(false);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.container}>
        <Text accessibilityRole="alert" style={styles.errorText}>
          {loadError}
        </Text>
      </View>
    );
  }

  const signOutButton = (
    <Pressable
      accessibilityLabel="Sign out"
      accessibilityRole="button"
      onPress={signOut}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Text style={styles.buttonLabel}>Sign out</Text>
    </Pressable>
  );

  if (!current) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Profile not found</Text>
        <Text style={styles.mutedText}>
          We couldn&apos;t find a profile for your account. Try signing out and back in.
        </Text>
        {signOutButton}
      </View>
    );
  }

  function startEditing(record: ProfileRecord) {
    setForm(toForm(record));
    setValidationError(null);
    setSaveAttempted(false);
  }

  function cancelEditing() {
    setForm(null);
    setValidationError(null);
  }

  async function handleSave(values: ProfileForm) {
    const username = values.username.trim();
    const displayName = values.display_name.trim();

    // The db layer validates too, but checking here gives instant feedback
    // without a network round trip.
    if (!username || !displayName) {
      setValidationError('Username and display name are required.');
      return;
    }

    setValidationError(null);
    setSaveAttempted(true);

    const avatar = values.avatar.trim();
    const saved = await updateProfile({
      username,
      display_name: displayName,
      avatar: avatar || null,
    });

    if (saved) {
      setProfile(saved);
      setForm(null);
    }
  }

  if (form) {
    const formError = validationError ?? (saveAttempted ? saveError : null);

    return (
      <ScrollView
        contentContainerStyle={styles.formContainer}
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
      >
        {formError ? (
          <Text accessibilityRole="alert" style={styles.errorText}>
            {formError}
          </Text>
        ) : null}
        <Text style={styles.fieldLabel}>Username</Text>
        <TextInput
          accessibilityLabel="Username"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!saving}
          onChangeText={(username) => setForm({ ...form, username })}
          style={styles.input}
          value={form.username}
        />
        <Text style={styles.fieldLabel}>Display name</Text>
        <TextInput
          accessibilityLabel="Display name"
          editable={!saving}
          onChangeText={(display_name) => setForm({ ...form, display_name })}
          style={styles.input}
          value={form.display_name}
        />
        <Text style={styles.fieldLabel}>Avatar URL</Text>
        <TextInput
          accessibilityLabel="Avatar URL"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!saving}
          keyboardType="url"
          onChangeText={(avatar) => setForm({ ...form, avatar })}
          placeholder="https://"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          value={form.avatar}
        />
        <Pressable
          accessibilityLabel="Save profile"
          accessibilityRole="button"
          accessibilityState={{ disabled: saving }}
          disabled={saving}
          onPress={() => void handleSave(form)}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            saving && styles.buttonDisabled,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={Colors.onPrimary} />
          ) : (
            <Text style={styles.buttonLabel}>Save</Text>
          )}
        </Pressable>
        <Pressable
          accessibilityLabel="Cancel editing"
          accessibilityRole="button"
          disabled={saving}
          onPress={cancelEditing}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.secondaryButtonLabel}>Cancel</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{current.display_name}</Text>
      <Text style={styles.mutedText}>@{current.username}</Text>
      {current.wsu_verified ? (
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>WSU Verified</Text>
        </View>
      ) : null}
      <Pressable
        accessibilityLabel="Edit profile"
        accessibilityRole="button"
        onPress={() => startEditing(current)}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.secondaryButtonLabel}>Edit profile</Text>
      </Pressable>
      {signOutButton}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderColor: Colors.primary,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeLabel: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    color: Colors.onPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.75,
  },
  container: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    flex: 1,
    gap: 20,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 15,
    textAlign: 'center',
  },
  fieldLabel: {
    color: Colors.textDim,
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    gap: 12,
    padding: 24,
  },
  heading: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.text,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  mutedText: {
    color: Colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  scroll: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 24,
  },
  secondaryButtonLabel: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
