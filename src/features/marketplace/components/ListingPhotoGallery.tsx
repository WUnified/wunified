import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Colors } from '../../../constants/colors';
import { Fonts } from '../../../constants/typography';

interface ListingPhotoGalleryProps {
  images: readonly string[];
  listingTitle: string;
}

export function ListingPhotoGallery({ images, listingTitle }: ListingPhotoGalleryProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [width, setWidth] = useState(windowWidth);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>No photo available</Text>
      </View>
    );
  }

  return (
    <View
      onLayout={({ nativeEvent }) => {
        if (nativeEvent.layout.width > 0) setWidth(nativeEvent.layout.width);
      }}
    >
      <ScrollView
        horizontal
        onMomentumScrollEnd={({ nativeEvent }) => {
          setCurrentIndex(Math.round(nativeEvent.contentOffset.x / width));
        }}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      >
        {images.map((image, index) => (
          <Image
            accessibilityLabel={`${listingTitle}, photo ${index + 1} of ${images.length}`}
            key={`${image}-${index}`}
            resizeMode="contain"
            source={{ uri: image }}
            style={[styles.image, { width }]}
          />
        ))}
      </ScrollView>
      {images.length > 1 ? (
        <View pointerEvents="none" style={styles.counter}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {images.length} · Swipe to view
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.border,
    height: 240,
  },
  placeholder: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    height: 180,
    justifyContent: 'center',
  },
  placeholderText: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  counter: {
    alignSelf: 'center',
    backgroundColor: Colors.glass,
    borderRadius: 999,
    bottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    position: 'absolute',
  },
  counterText: {
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    fontSize: 12,
  },
});
