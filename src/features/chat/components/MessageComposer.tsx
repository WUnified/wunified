import { ActivityIndicator, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

const sendIcon = require('../../../../assets/send-icon.png') as ImageSourcePropType;

type MessageComposerProps = {
  onChangeText: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  value: string;
};

export function MessageComposer({ onChangeText, onSend, sending, value }: MessageComposerProps) {
  const canSend = value.trim().length > 0 && !sending;

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="Message"
        editable={!sending}
        multiline
        onChangeText={onChangeText}
        placeholder="Message"
        placeholderTextColor={Colors.textDim}
        style={styles.input}
        value={value}
      />
      <Pressable
        accessibilityLabel="Send message"
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        onPress={onSend}
        style={({ pressed }) => [
          styles.send,
          !canSend && styles.sendDisabled,
          pressed && styles.pressed,
        ]}
      >
        {sending ? (
          <ActivityIndicator color={Colors.onPrimary} />
        ) : (
          <Image importantForAccessibility="no" source={sendIcon} style={styles.sendIcon} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  input: {
    ...Typography.body,
    backgroundColor: Colors.subtle,
    borderRadius: Radius.xl,
    color: Colors.text,
    flex: 1,
    // Caps growth at about five lines so the message list stays visible.
    maxHeight: 120,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
  },
  pressed: {
    opacity: 0.75,
  },
  send: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sendDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    height: 22,
    width: 22,
  },
});
