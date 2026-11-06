import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { useChatMediaUrl } from '../mediaUrl';

type ChatMediaImageProps = {
  accessibilityLabel: string;
  onOpen: (url: string) => void;
  path: string;
  size: number;
};

// One private chat photo. It loads through a signed link, so each photo has its own
// loading and failure state and one broken photo never hides the rest of a message.
export function ChatMediaImage({ accessibilityLabel, onOpen, path, size }: ChatMediaImageProps) {
  const { url, loading } = useChatMediaUrl(path);
  const box = { height: size, width: size };

  if (!url) {
    return (
      <View accessibilityLabel={accessibilityLabel} style={[styles.placeholder, box]}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <Text style={styles.unavailable}>Photo unavailable</Text>
        )}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint="Opens the photo full screen"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="imagebutton"
      onPress={() => onOpen(url)}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Image accessibilityIgnoresInvertColors source={{ uri: url }} style={[styles.image, box]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.subtle,
    borderRadius: Radius.lg,
  },
  placeholder: {
    alignItems: 'center',
    backgroundColor: Colors.subtle,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    padding: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  unavailable: {
    ...Typography.caption,
    color: Colors.textDim,
    textAlign: 'center',
  },
});
