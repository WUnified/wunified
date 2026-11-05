import { Image, Pressable, StyleSheet } from 'react-native';
import type { ImageSourcePropType, ImageStyle, StyleProp, ViewStyle } from 'react-native';

interface IconButtonProps {
  accessibilityLabel: string;
  buttonStyle?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ImageStyle>;
  iconSource: ImageSourcePropType;
  onPress: () => void;
}

export function IconButton({
  accessibilityLabel,
  buttonStyle,
  iconSource,
  iconStyle,
  onPress,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, buttonStyle, pressed && styles.pressed]}
    >
      <Image resizeMode="contain" source={iconSource} style={[styles.icon, iconStyle]} />
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
