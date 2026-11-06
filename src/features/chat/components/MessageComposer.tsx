import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

const sendIcon = require('../../../../assets/send-icon.png') as ImageSourcePropType;
const photoIcon = require('../../../../assets/photo-icon.png') as ImageSourcePropType;

export type ComposerAttachment = { key: string; previewUri: string };

type MessageComposerProps = {
  attachments?: readonly ComposerAttachment[];
  canAddPhoto?: boolean;
  onAddPhoto?: () => void;
  onChangeText: (value: string) => void;
  onRemoveAttachment?: (key: string) => void;
  onSend: () => void;
  sending: boolean;
  value: string;
};

export function MessageComposer({
  attachments = [],
  canAddPhoto = false,
  onAddPhoto,
  onChangeText,
  onRemoveAttachment,
  onSend,
  sending,
  value,
}: MessageComposerProps) {
  // A message can be text, photos, or both.
  const canSend = (value.trim().length > 0 || attachments.length > 0) && !sending;
  const photoEnabled = Boolean(onAddPhoto) && canAddPhoto && !sending;

  return (
    <View style={styles.container}>
      {attachments.length > 0 ? (
        <ScrollView contentContainerStyle={styles.attachments} horizontal>
          {attachments.map((attachment, index) => (
            <View key={attachment.key}>
              <Image
                accessibilityIgnoresInvertColors
                accessibilityLabel={`Attached photo ${index + 1}`}
                source={{ uri: attachment.previewUri }}
                style={styles.thumbnail}
              />
              <Pressable
                accessibilityLabel={`Remove attached photo ${index + 1}`}
                accessibilityRole="button"
                disabled={sending}
                hitSlop={10}
                onPress={() => onRemoveAttachment?.(attachment.key)}
                style={styles.remove}
              >
                <Text style={styles.removeLabel}>×</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}
      <View style={styles.row}>
        {onAddPhoto ? (
          <Pressable
            accessibilityLabel="Add photo"
            accessibilityRole="button"
            accessibilityState={{ disabled: !photoEnabled }}
            disabled={!photoEnabled}
            onPress={onAddPhoto}
            style={({ pressed }) => [
              styles.photoButton,
              !photoEnabled && styles.sendDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Image importantForAccessibility="no" source={photoIcon} style={styles.photoIcon} />
          </Pressable>
        ) : null}
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
    </View>
  );
}

const styles = StyleSheet.create({
  attachments: {
    gap: 8,
    paddingBottom: 10,
    paddingTop: 2,
  },
  container: {
    borderTopColor: Colors.border,
    borderTopWidth: 1,
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
  photoButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 36,
  },
  photoIcon: {
    height: 24,
    width: 24,
  },
  pressed: {
    opacity: 0.75,
  },
  remove: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: -6,
    top: -6,
    width: 24,
  },
  removeLabel: {
    ...Typography.cardTitle,
    color: Colors.text,
    lineHeight: 20,
  },
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
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
  thumbnail: {
    backgroundColor: Colors.subtle,
    borderRadius: Radius.md,
    height: 64,
    width: 64,
  },
});
