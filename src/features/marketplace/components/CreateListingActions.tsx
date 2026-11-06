import { Pressable, Text, View } from 'react-native';

import { styles } from './CreateListingForm.styles';
import type { ImageUploadProgress } from '../../../lib/db';

interface CreateListingActionsProps {
  saving: boolean;
  imageUploadProgress: ImageUploadProgress | null;
  onCancel: () => void;
  onSubmit: () => void;
}

function getSubmitLabel(saving: boolean, progress: ImageUploadProgress | null): string {
  if (!saving) return 'Publish listing';
  if (!progress) return 'Publishing…';
  if (progress.completed >= progress.total) return 'Saving listing…';
  return `Uploading photo ${progress.completed + 1} of ${progress.total}…`;
}

export function CreateListingActions({
  saving,
  imageUploadProgress,
  onCancel,
  onSubmit,
}: CreateListingActionsProps) {
  return (
    <View style={styles.actions}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: saving }}
        disabled={saving}
        onPress={onSubmit}
        style={({ pressed }) => [styles.submitButton, (pressed || saving) && styles.pressed]}
      >
        <Text accessibilityLiveRegion="polite" style={styles.submitLabel}>
          {getSubmitLabel(saving, imageUploadProgress)}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: saving }}
        disabled={saving}
        onPress={onCancel}
        style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
      >
        <Text style={styles.cancelLabel}>Cancel</Text>
      </Pressable>
    </View>
  );
}
