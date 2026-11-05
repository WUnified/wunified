import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { ChatAvatar } from './ChatAvatar';
import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { formatUnreadCount } from '../presentation';

const marketIcon = require('../../../../assets/market-icon.png') as ImageSourcePropType;

type ChatInboxRowProps = {
  avatar: string | null;
  // Listing photo for marketplace rows; falls back to the store tile when absent.
  imageUri?: string | null;
  name: string;
  onPress?: () => void;
  subtitle: string;
  timestamp: string;
  unreadCount?: number;
  // Marketplace rows show the listing tile instead of a person's avatar.
  variant?: 'person' | 'marketplace';
};

export function ChatInboxRow({
  avatar,
  imageUri = null,
  name,
  onPress,
  subtitle,
  timestamp,
  unreadCount = 0,
  variant = 'person',
}: ChatInboxRowProps) {
  const unread = unreadCount > 0;
  return (
    <Pressable
      accessibilityLabel={`${name}, ${subtitle}${timestamp ? `, ${timestamp}` : ''}${
        unread ? `, ${unreadCount} unread` : ''
      }`}
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {variant === 'marketplace' ? (
        <View importantForAccessibility="no-hide-descendants" style={styles.tile}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.tileImage} />
          ) : (
            <Image source={marketIcon} style={styles.tileIcon} />
          )}
        </View>
      ) : (
        <ChatAvatar name={name} size={48} uri={avatar} />
      )}
      <View style={styles.text}>
        <Text numberOfLines={1} style={[styles.name, unread && styles.unreadText]}>
          {name}
        </Text>
        <Text numberOfLines={1} style={[styles.subtitle, unread && styles.unreadText]}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.meta}>
        {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
        {unread ? (
          <View importantForAccessibility="no-hide-descendants" style={styles.badge}>
            <Text style={styles.badgeLabel}>{formatUnreadCount(unreadCount)}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: 6,
  },
  badgeLabel: {
    ...Typography.caption,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  meta: {
    alignItems: 'flex-end',
    alignSelf: 'flex-start',
    gap: 6,
  },
  name: {
    ...Typography.cardTitle,
    color: Colors.text,
  },
  pressed: {
    backgroundColor: Colors.subtle,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textDim,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  tile: {
    alignItems: 'center',
    backgroundColor: Colors.subtle,
    borderRadius: Radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  tileIcon: {
    height: 24,
    width: 24,
  },
  tileImage: {
    borderRadius: Radius.md,
    height: 48,
    width: 48,
  },
  timestamp: {
    ...Typography.caption,
    color: Colors.textDim,
  },
  unreadText: {
    color: Colors.text,
    fontWeight: '700',
  },
});
