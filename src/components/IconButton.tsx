import { Image, Pressable, StyleSheet } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

interface IconButtonProps {
  accessibilityLabel: string;
  iconSource: ImageSourcePropType;
  onPress: () => void;
}

export function IconButton({ accessibilityLabel, iconSource, onPress }: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Image resizeMode="contain" source={iconSource} style={styles.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 50,
  },
  icon: {
    height: 24,
    width: 24,
  },
  pressed: {
    opacity: 0.8,
  },
});
