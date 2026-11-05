import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../../constants/colors';
import { Fonts } from '../../../constants/typography';
import { MAX_IMAGES_PER_ENTITY } from '../../../lib/db';
import { pickImage, type PickedImage } from '../../../lib/pickImage';

interface ListingImagePickerProps {
  images: PickedImage[];
  disabled: boolean;
  onChange: (images: PickedImage[]) => void;
}

export function ListingImagePicker({ images, disabled, onChange }: ListingImagePickerProps) {
  const [pickError, setPickError] = useState<string | null>(null);

  const handleAdd = async () => {
    setPickError(null);
    try {
      const picked = await pickImage();
      if (picked) {
        onChange([...images, picked]);
      }
    } catch (error) {
      setPickError(error instanceof Error ? error.message : 'Unable to select the image.');
    }
  };

  return (
    <View>
      <Text style={styles.label}>
        Photos <Text style={styles.optional}>Optional, up to {MAX_IMAGES_PER_ENTITY}</Text>
      </Text>
      <View style={styles.row}>
        {images.map((image, index) => (
          <View key={image.previewUri} style={styles.thumbnailWrapper}>
            <Image
              accessibilityLabel={`Listing photo ${index + 1}`}
              source={{ uri: image.previewUri }}
              style={styles.thumbnail}
            />
            <Pressable
              accessibilityLabel={`Remove photo ${index + 1}`}
              accessibilityRole="button"
              disabled={disabled}
              onPress={() => onChange(images.filter((_, imageIndex) => imageIndex !== index))}
              style={styles.remove}
            >
              <Text style={styles.removeLabel}>×</Text>
            </Pressable>
          </View>
        ))}
        {images.length < MAX_IMAGES_PER_ENTITY ? (
          <Pressable
            accessibilityLabel="Add photo"
            accessibilityRole="button"
            disabled={disabled}
            onPress={() => void handleAdd()}
            style={[styles.thumbnail, styles.add]}
          >
            <Text style={styles.addLabel}>+</Text>
          </Pressable>
        ) : null}
      </View>
      {pickError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {pickError}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    marginBottom: 6,
    marginTop: 12,
  },
  optional: { color: Colors.textMuted, fontFamily: Fonts.body, fontSize: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumbnailWrapper: { position: 'relative' },
  thumbnail: { borderRadius: 8, height: 72, width: 72 },
  add: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    justifyContent: 'center',
  },
  addLabel: { color: Colors.textMuted, fontSize: 28 },
  remove: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 11,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: 4,
    top: 4,
    width: 22,
  },
  removeLabel: { color: '#fff', fontSize: 16, lineHeight: 18 },
  error: { color: Colors.danger, fontFamily: Fonts.body, fontSize: 12, marginTop: 6 },
});
