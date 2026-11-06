import { useMemo, useState } from 'react';
import { Image, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

interface ListingCardPhotosProps {
  images: readonly string[];
  onPress: () => void;
  title: string;
  variant: 'grid' | 'trending';
}

export function ListingCardPhotos({ images, onPress, title, variant }: ListingCardPhotosProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const index = Math.min(selectedIndex, Math.max(images.length - 1, 0));
  const image = images[index];

  const swipe = useMemo(
    () =>
      PanResponder.create({
        // At the ends, leave horizontal gestures to the surrounding recently-listed row.
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          Math.abs(gesture.dx) > 10 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
          ((gesture.dx < 0 && index < images.length - 1) || (gesture.dx > 0 && index > 0)),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -10) setSelectedIndex(Math.min(index + 1, images.length - 1));
          if (gesture.dx > 10) setSelectedIndex(Math.max(index - 1, 0));
        },
      }),
    [images.length, index],
  );

  return (
    <View
      {...swipe.panHandlers}
      style={[styles.frame, variant === 'grid' ? styles.gridFrame : styles.trendingFrame]}
    >
      <Pressable
        accessibilityLabel={`View photos for ${title}`}
        accessibilityRole="button"
        onPress={onPress}
        style={styles.photoButton}
      >
        {image ? (
          <Image
            accessibilityLabel={`${title}, photo ${index + 1} of ${images.length}`}
            resizeMode="contain"
            source={{ uri: image }}
            style={styles.image}
          />
        ) : (
          <Text style={styles.placeholder}>No photo</Text>
        )}
      </Pressable>
      {images.length > 1 ? (
        <>
          {index > 0 ? (
            <Pressable
              accessibilityLabel={`Previous photo for ${title}`}
              accessibilityRole="button"
              onPress={() => setSelectedIndex(index - 1)}
              style={[styles.control, styles.previous]}
            >
              <Text style={styles.controlText}>‹</Text>
            </Pressable>
          ) : null}
          {index < images.length - 1 ? (
            <Pressable
              accessibilityLabel={`Next photo for ${title}`}
              accessibilityRole="button"
              onPress={() => setSelectedIndex(index + 1)}
              style={[styles.control, styles.next]}
            >
              <Text style={styles.controlText}>›</Text>
            </Pressable>
          ) : null}
          <View pointerEvents="none" style={styles.counter}>
            <Text style={styles.counterText}>{`${index + 1} / ${images.length}`}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: Colors.border,
    width: '100%',
  },
  gridFrame: { height: 132 },
  trendingFrame: { height: 76 },
  photoButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  placeholder: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  control: {
    alignItems: 'center',
    backgroundColor: Colors.glass,
    borderRadius: Radius.full,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    top: '35%',
    width: 32,
  },
  previous: { left: 2 },
  next: { right: 2 },
  controlText: {
    ...Typography.sectionTitle,
    color: Colors.text,
  },
  counter: {
    alignSelf: 'center',
    backgroundColor: Colors.glass,
    borderRadius: Radius.full,
    bottom: 3,
    paddingHorizontal: 6,
    position: 'absolute',
  },
  counterText: {
    ...Typography.badge,
    color: Colors.text,
  },
});
