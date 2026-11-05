import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import type { ChatListingPreview } from '../listing.api';
import { formatListingPrice } from '../presentation';

const marketIcon = require('../../../../assets/market-icon.png') as ImageSourcePropType;

const STATUS_LABELS: Record<Exclude<ChatListingPreview['status'], 'active'>, string> = {
  sold: 'Sold',
  reserved: 'Reserved',
  archived: 'No longer listed',
};

type ChatListingCardProps = {
  listing: ChatListingPreview;
  onPress: () => void;
};

// Pinned under a marketplace conversation's header, like Messenger's listing banner.
// Only active listings open, because Marketplace only loads active listings.
export function ChatListingCard({ listing, onPress }: ChatListingCardProps) {
  const isActive = listing.status === 'active';
  const price = formatListingPrice(listing.price);
  const statusLabel = listing.status === 'active' ? null : STATUS_LABELS[listing.status];

  return (
    <Pressable
      accessibilityHint={isActive ? 'Opens the listing in Marketplace' : undefined}
      accessibilityLabel={`${listing.title}, ${price}${statusLabel ? `, ${statusLabel}` : ''}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isActive }}
      disabled={!isActive}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {listing.image ? (
        <Image
          accessibilityIgnoresInvertColors
          importantForAccessibility="no"
          source={{ uri: listing.image }}
          style={styles.image}
        />
      ) : (
        <View importantForAccessibility="no-hide-descendants" style={[styles.image, styles.tile]}>
          <Image source={marketIcon} style={styles.tileIcon} />
        </View>
      )}
      <View style={styles.text}>
        <Text numberOfLines={1} style={styles.title}>
          {listing.title}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.price, !isActive && styles.priceInactive]}>{price}</Text>
          {statusLabel ? (
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>{statusLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {isActive ? <Text style={styles.chevron}>›</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.subtle,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeLabel: {
    ...Typography.badge,
    color: Colors.textDim,
  },
  card: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chevron: {
    ...Typography.sectionTitle,
    color: Colors.textDim,
  },
  image: {
    backgroundColor: Colors.subtle,
    borderRadius: Radius.md,
    height: 44,
    width: 44,
  },
  meta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  pressed: {
    opacity: 0.8,
  },
  price: {
    ...Typography.cardTitle,
    color: Colors.primary,
  },
  priceInactive: {
    color: Colors.textDim,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIcon: {
    height: 22,
    width: 22,
  },
  title: {
    ...Typography.cardTitle,
    color: Colors.text,
  },
});
