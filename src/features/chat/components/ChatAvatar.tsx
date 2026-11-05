import { Image, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Fonts } from '../../../constants/typography';
import { getInitials } from '../presentation';

type ChatAvatarProps = {
  name: string;
  size: number;
  uri: string | null;
};

// Decorative: every row that shows an avatar already announces the chat name.
export function ChatAvatar({ name, size, uri }: ChatAvatarProps) {
  const dimensions = { borderRadius: Radius.full, height: size, width: size };

  if (uri) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        importantForAccessibility="no"
        source={{ uri }}
        style={[styles.image, dimensions]}
      />
    );
  }

  return (
    <View importantForAccessibility="no-hide-descendants" style={[styles.fallback, dimensions]}>
      <Text style={[styles.initials, { fontSize: Math.round(size * 0.36) }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    backgroundColor: Colors.subtle,
    justifyContent: 'center',
  },
  image: {
    backgroundColor: Colors.subtle,
  },
  initials: {
    color: Colors.text,
    fontFamily: Fonts.heading,
  },
});
