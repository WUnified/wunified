import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { ChatAvatar } from './ChatAvatar';
import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

const marketIcon = require('../../../../assets/market-icon.png') as ImageSourcePropType;

type ChatInboxRowProps = {
  avatar: string | null;
  name: string;
  onPress?: () => void;
  subtitle: string;
  timestamp: string;
  // Marketplace rows show the store tile instead of a person's avatar.
  variant?: 'person' | 'marketplace';
};

export function ChatInboxRow({
  avatar,
  name,
  onPress,
  subtitle,
  timestamp,
  variant = 'person',
}: ChatInboxRowProps) {
  return (
    <Pressable
      accessibilityLabel={`${name}, ${subtitle}${timestamp ? `, ${timestamp}` : ''}`}
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {variant === 'marketplace' ? (
        <View importantForAccessibility="no-hide-descendants" style={styles.tile}>
          <Image source={marketIcon} style={styles.tileIcon} />
        </View>
      ) : (
        <ChatAvatar name={name} size={48} uri={avatar} />
      )}
      <View style={styles.text}>
        <Text numberOfLines={1} style={styles.name}>
          {name}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>
      {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  timestamp: {
    ...Typography.caption,
    alignSelf: 'flex-start',
    color: Colors.textDim,
  },
});
