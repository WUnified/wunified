import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { styles } from './CreateCommunityPostModal.styles';
import { Colors } from '../../../constants/colors';

interface CreateCommunityPostModalProps {
  visible: boolean;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: { title: string; body: string }) => Promise<boolean>;
}

export function CreateCommunityPostModal({
  visible,
  saving,
  error,
  onClose,
  onSubmit,
}: CreateCommunityPostModalProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) {
      setValidationError('Add a title and message before posting.');
      return;
    }

    setValidationError(null);
    if (await onSubmit({ title: trimmedTitle, body: trimmedBody })) {
      setTitle('');
      setBody('');
    }
  }

  function close() {
    if (saving) return;
    setValidationError(null);
    onClose();
  }

  return (
    <Modal animationType="slide" onRequestClose={close} transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <ScrollView
          contentContainerStyle={styles.composerContent}
          keyboardShouldPersistTaps="handled"
          style={styles.composer}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create a post</Text>
            <Pressable
              accessibilityLabel="Close post composer"
              accessibilityRole="button"
              disabled={saving}
              onPress={close}
            >
              <Text style={styles.closeLabel}>Cancel</Text>
            </Pressable>
          </View>
          <TextInput
            accessibilityLabel="Post title"
            editable={!saving}
            maxLength={120}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={Colors.textDim}
            style={styles.titleInput}
            value={title}
          />
          <TextInput
            accessibilityLabel="Post message"
            editable={!saving}
            multiline
            onChangeText={setBody}
            placeholder="What's happening on campus?"
            placeholderTextColor={Colors.textDim}
            style={styles.bodyInput}
            textAlignVertical="top"
            value={body}
          />
          {validationError || error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {validationError ?? error}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() => void handleSubmit()}
            style={({ pressed }) => [styles.submitButton, (pressed || saving) && styles.pressed]}
          >
            {saving ? (
              <ActivityIndicator color={Colors.onPrimary} />
            ) : (
              <Text style={styles.submitLabel}>Post</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
