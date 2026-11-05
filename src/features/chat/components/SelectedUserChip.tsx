import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

type SelectedUserChipProps = {
  name: string;
  onRemove: () => void;
};

export function SelectedUserChip({ name, onRemove }: SelectedUserChipProps) {
  return (
    <Pressable
      accessibilityLabel={`Remove ${name}`}
      accessibilityRole="button"
      onPress={onRemove}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      <Text numberOfLines={1} style={styles.name}>
        {name}
      </Text>
      <Text style={styles.remove}>×</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: Colors.subtle,
    borderRadius: Radius.full,
    flexDirection: 'row',
    gap: 6,
    maxWidth: 180,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  name: {
    ...Typography.caption,
    color: Colors.text,
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.75,
  },
  remove: {
    ...Typography.cardTitle,
    color: Colors.textDim,
  },
});
