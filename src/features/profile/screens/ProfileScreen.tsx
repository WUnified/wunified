import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

// Pinned to en-US so "Member since" reads the same on every device.
function formatMemberSince(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

type DetailRowProps = {
  glyph: string;
  label: string;
  value: string;
  isLast?: boolean;
};

function DetailRow({ glyph, label, value, isLast = false }: DetailRowProps) {
  return (
    <View style={[styles.detailRow, !isLast && styles.detailRowSeparator]}>
      {/* Decorative: the label already names the row for screen readers. */}
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.detailChip}
      >
        <Text style={styles.detailGlyph}>{glyph}</Text>
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
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
      style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
    >
      <Text style={styles.secondaryButtonLabel}>Sign out</Text>
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
      <SafeAreaView edges={['top']} style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, styles.formCard]}>
            <Text style={styles.formHeading}>Edit profile</Text>
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
          </View>
          <View style={styles.actions}>
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
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, styles.headerCard]}>
          {current.avatar ? (
            <Image
              accessibilityLabel={`${current.display_name}'s avatar`}
              source={{ uri: current.avatar }}
              style={[styles.avatar, styles.avatarImage]}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {current.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{current.display_name}</Text>
          <Text style={styles.username}>@{current.username}</Text>
          {current.wsu_verified ? (
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>WSU Verified</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.card, styles.detailsCard]}>
          <DetailRow glyph="@" label="Username" value={`@${current.username}`} />
          <DetailRow
            glyph="📅"
            label="Member since"
            value={formatMemberSince(current.created_at)}
          />
          <DetailRow
            glyph="✓"
            isLast
            label="Status"
            value={current.wsu_verified ? 'Verified' : 'Unverified'}
          />
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="Edit profile"
            accessibilityRole="button"
            onPress={() => startEditing(current)}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonLabel}>Edit profile</Text>
          </Pressable>
          {signOutButton}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignSelf: 'stretch',
    gap: 12,
    marginTop: 24,
  },
  avatar: {
    borderRadius: 44,
    height: 88,
    width: 88,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    justifyContent: 'center',
  },
  // Shows a neutral circle while a remote avatar loads or if the URL fails.
  avatarImage: {
    backgroundColor: Colors.border,
  },
  avatarInitial: {
    color: Colors.onPrimary,
    fontSize: 32,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeLabel: {
    color: Colors.onPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    color: Colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.75,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
  },
  container: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    flex: 1,
    gap: 20,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  detailChip: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  detailGlyph: {
    color: Colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  detailLabel: {
    color: Colors.textDim,
    fontSize: 15,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    minHeight: 52,
  },
  detailRowSeparator: {
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  detailsCard: {
    marginTop: 16,
    padding: 20,
  },
  detailValue: {
    color: Colors.text,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 'auto',
    textAlign: 'right',
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
  formCard: {
    gap: 12,
    marginTop: 16,
    padding: 20,
  },
  formHeading: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  headerCard: {
    alignItems: 'center',
    marginTop: 16,
    padding: 24,
  },
  heading: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: 12,
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
  name: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  screen: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: Colors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 24,
  },
  secondaryButtonLabel: {
    color: Colors.textDim,
    fontSize: 16,
    fontWeight: '600',
  },
  username: {
    color: Colors.textMuted,
    fontSize: 15,
    marginTop: 4,
    textAlign: 'center',
  },
});
