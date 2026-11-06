import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

type ChatMediaViewerProps = {
  onClose: () => void;
  url: string | null;
};

export function ChatMediaViewer({ onClose, url }: ChatMediaViewerProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={url !== null}>
      {/* A Modal renders outside the app's SafeAreaProvider, so without its own provider
          the insets are zero and Done ends up under the status bar, where it can't be
          tapped. */}
      {/* Starting metrics let it render immediately instead of after a measuring pass. */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.backdrop}>
          <View style={styles.toolbar}>
            <Pressable
              accessibilityLabel="Close photo"
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}
            >
              <Text style={styles.closeLabel}>Done</Text>
            </Pressable>
          </View>
          {url ? (
            // Tapping the photo also closes it, like most photo viewers.
            <Pressable
              accessibilityHint="Closes the photo"
              accessibilityLabel="Photo"
              onPress={onClose}
              style={styles.imageArea}
            >
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="contain"
                source={{ uri: url }}
                style={styles.image}
              />
            </Pressable>
          ) : null}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  close: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
  },
  closeLabel: {
    ...Typography.cardTitle,
    color: Colors.text,
  },
  image: {
    flex: 1,
    width: '100%',
  },
  imageArea: {
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
  },
  toolbar: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
