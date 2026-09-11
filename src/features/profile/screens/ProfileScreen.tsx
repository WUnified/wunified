import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Colors } from '../../../constants/colors';
import { useSignOut } from '../../auth';
import { useCurrentProfile, useProfileMutation } from '../hooks';
import type { ProfileRecord } from '../types';
import { styles } from './ProfileScreen.styles';
import { ProfileDisplaySection, ProfileEditSection } from './ProfileScreenSections';

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
      <ProfileEditSection
        avatar={form.avatar}
        displayName={form.display_name}
        formError={formError}
        saving={saving}
        username={form.username}
        onAvatarChange={(avatar) => setForm({ ...form, avatar })}
        onCancel={cancelEditing}
        onDisplayNameChange={(display_name) => setForm({ ...form, display_name })}
        onSave={() => void handleSave(form)}
        onUsernameChange={(username) => setForm({ ...form, username })}
      />
    );
  }

  return (
    <ProfileDisplaySection
      profile={current}
      signOutButton={signOutButton}
      onEdit={() => startEditing(current)}
    />
  );
}
