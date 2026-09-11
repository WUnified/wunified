import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../../constants/colors';
import type { ProfileRecord } from '../types';
import { styles } from './ProfileScreen.styles';

type DetailRowProps = {
  glyph: string;
  label: string;
  value: string;
  isLast?: boolean;
};

type ProfileEditSectionProps = {
  avatar: string;
  displayName: string;
  formError: string | null;
  saving: boolean;
  username: string;
  onAvatarChange: (value: string) => void;
  onCancel: () => void;
  onDisplayNameChange: (value: string) => void;
  onSave: () => void;
  onUsernameChange: (value: string) => void;
};

type ProfileDisplaySectionProps = {
  profile: ProfileRecord;
  signOutButton: ReactNode;
  onEdit: () => void;
};

const STAT_LABELS = ['Connections', 'Posts', 'Saved'] as const;

// Pinned to en-US so "Member since" reads the same on every device.
function formatMemberSince(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

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

export function ProfileEditSection({
  avatar,
  displayName,
  formError,
  saving,
  username,
  onAvatarChange,
  onCancel,
  onDisplayNameChange,
  onSave,
  onUsernameChange,
}: ProfileEditSectionProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
            onChangeText={onUsernameChange}
            style={styles.input}
            value={username}
          />
          <Text style={styles.fieldLabel}>Display name</Text>
          <TextInput
            accessibilityLabel="Display name"
            editable={!saving}
            onChangeText={onDisplayNameChange}
            style={styles.input}
            value={displayName}
          />
          <Text style={styles.fieldLabel}>Avatar URL</Text>
          <TextInput
            accessibilityLabel="Avatar URL"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!saving}
            keyboardType="url"
            onChangeText={onAvatarChange}
            placeholder="https://"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={avatar}
          />
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="Save profile"
            accessibilityRole="button"
            accessibilityState={{ disabled: saving }}
            disabled={saving}
            onPress={onSave}
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
            onPress={onCancel}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.secondaryButtonLabel}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function ProfileDisplaySection({
  profile,
  signOutButton,
  onEdit,
}: ProfileDisplaySectionProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, styles.headerCard]}>
          {profile.avatar ? (
            <Image
              accessibilityLabel={`${profile.display_name}'s avatar`}
              source={{ uri: profile.avatar }}
              style={[styles.avatar, styles.avatarImage]}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {profile.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{profile.display_name}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          {profile.wsu_verified ? (
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>WSU Verified</Text>
            </View>
          ) : null}
          {/* TODO: replace with real counts once the follows and posts tables exist. */}
          <View style={styles.statsRow}>
            {STAT_LABELS.map((label) => (
              <View key={label} style={styles.stat}>
                <Text style={styles.statCount}>0</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={[styles.card, styles.detailsCard]}>
          <DetailRow glyph="@" label="Username" value={`@${profile.username}`} />
          <DetailRow
            glyph="📅"
            label="Member since"
            value={formatMemberSince(profile.created_at)}
          />
          <DetailRow
            glyph="✓"
            isLast
            label="Status"
            value={profile.wsu_verified ? 'Verified' : 'Unverified'}
          />
        </View>
        <Text accessibilityRole="header" style={styles.sectionHeading}>
          Posts
        </Text>
        <View style={[styles.card, styles.emptyPostsCard]}>
          <Text style={styles.emptyPostsTitle}>No posts yet</Text>
          <Text style={styles.emptyPostsBody}>Posts you share will show up here.</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="Edit profile"
            accessibilityRole="button"
            onPress={onEdit}
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
