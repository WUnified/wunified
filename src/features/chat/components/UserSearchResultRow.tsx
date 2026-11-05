import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChatAvatar } from './ChatAvatar';
import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import type { SearchableChatUser } from '../types';

type UserSearchResultRowProps = {
  onPress: () => void;
  selected: boolean;
  user: SearchableChatUser;
};

export function UserSearchResultRow({ onPress, selected, user }: UserSearchResultRowProps) {
  return (
    <Pressable
      accessibilityLabel={`${user.displayName}, @${user.username}${user.wsuVerified ? ', WSU verified' : ''}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <ChatAvatar name={user.displayName} size={44} uri={user.avatar} />
      <View style={styles.text}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={styles.name}>
            {user.displayName}
          </Text>
          {user.wsuVerified ? <Text style={styles.verified}>✓</Text> : null}
        </View>
        <Text numberOfLines={1} style={styles.username}>
          @{user.username}
        </Text>
      </View>
      <View style={[styles.check, selected && styles.checkSelected]}>
        {selected ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  check: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkMark: {
    ...Typography.badge,
    color: Colors.onPrimary,
  },
  checkSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  name: {
    ...Typography.cardTitle,
    color: Colors.text,
    flexShrink: 1,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  pressed: {
    backgroundColor: Colors.subtle,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  text: {
    flex: 1,
  },
  username: {
    ...Typography.caption,
    color: Colors.textDim,
  },
  verified: {
    ...Typography.badge,
    color: Colors.primary,
  },
});
