import { Pressable, StyleSheet, Text } from 'react-native';

import { ChatAvatar } from './ChatAvatar';
import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

type ChannelItemProps = {
  avatar: string | null;
  name: string;
  onPress?: () => void;
};

export function ChannelItem({ avatar, name, onPress }: ChannelItemProps) {
  return (
    <Pressable
      accessibilityLabel={`Open ${name}`}
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <ChatAvatar name={name} size={60} uri={avatar} />
      <Text numberOfLines={1} style={styles.name}>
        {name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: Radius.md,
    gap: 6,
    minHeight: 44,
    width: 72,
  },
  name: {
    ...Typography.caption,
    color: Colors.text,
    textAlign: 'center',
    width: '100%',
  },
  pressed: {
    opacity: 0.75,
  },
});
