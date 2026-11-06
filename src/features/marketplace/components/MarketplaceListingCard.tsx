import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ListingCardPhotos } from './ListingCardPhotos';
import { Colors } from '../../../constants/colors';
import { Fonts, Typography } from '../../../constants/typography';

export interface MarketplaceCardListing {
  id: string;
  title: string;
  price: number;
  seller: string;
  sellerInitials: string;
  images: readonly string[];
}

interface MarketplaceListingCardBaseProps {
  listing: MarketplaceCardListing;
  onPress: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

type MarketplaceListingCardProps = MarketplaceListingCardBaseProps & {
  variant: 'grid' | 'trending';
};

const formatPrice = (price: number) => `$${price}`;

export function MarketplaceListingCard(props: MarketplaceListingCardProps) {
  const { listing, onPress } = props;
  const isGridCard = props.variant === 'grid';

  return (
    <View style={isGridCard ? styles.gridCard : styles.trendingCard}>
      <ListingCardPhotos
        images={listing.images}
        key={`${listing.id}:${JSON.stringify(listing.images)}`}
        onPress={onPress}
        title={listing.title}
        variant={props.variant}
      />
      <Pressable
        accessibilityLabel={`View ${listing.title}`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.listingMain, pressed && styles.pressed]}
      >
        {isGridCard ? (
          <View style={styles.gridDetails}>
            <Text numberOfLines={1} style={styles.gridTitle}>
              {listing.title}
            </Text>
            <Text style={styles.gridPrice}>{formatPrice(listing.price)}</Text>
            <View style={styles.sellerRow}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerInitials}>{listing.sellerInitials}</Text>
              </View>
              <Text numberOfLines={1} style={styles.sellerName}>
                {listing.seller}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <Text numberOfLines={1} style={styles.trendingTitle}>
              {listing.title}
            </Text>
            <Text style={styles.trendingPrice}>{formatPrice(listing.price)}</Text>
          </>
        )}
      </Pressable>
      <Pressable
        accessibilityLabel={props.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        accessibilityRole="button"
        accessibilityState={{ selected: props.isFavorite }}
        onPress={props.onToggleFavorite}
        style={({ pressed }) => [styles.favoriteButton, pressed && styles.pressed]}
      >
        <Text style={styles.favoriteIcon}>{props.isFavorite ? '♥' : '♡'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  trendingCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    width: 112,
  },
  gridCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 2,
    overflow: 'hidden',
    position: 'relative',
    width: '48%',
  },
  listingMain: {
    flex: 1,
  },
  trendingTitle: {
    color: Colors.text,
    fontFamily: Fonts.listing,
    fontSize: 12,
    marginHorizontal: 8,
    marginTop: 7,
  },
  trendingPrice: {
    color: Colors.text,
    fontFamily: Fonts.bold,
    fontSize: 13,
    marginHorizontal: 8,
    marginBottom: 9,
    marginTop: 3,
    marginRight: 40,
    minHeight: 32,
  },
  gridDetails: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 9,
  },
  gridTitle: {
    ...Typography.listingTitle,
    color: Colors.text,
    fontSize: 13,
  },
  gridPrice: {
    ...Typography.price,
    color: Colors.text,
    fontSize: 15,
    marginTop: 5,
  },
  sellerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    marginTop: 9,
    paddingRight: 36,
  },
  sellerAvatar: {
    alignItems: 'center',
    backgroundColor: Colors.border,
    borderColor: Colors.textMuted,
    borderRadius: 11,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  sellerInitials: {
    color: Colors.text,
    fontFamily: Fonts.bold,
    fontSize: 8,
  },
  sellerName: {
    color: Colors.textDim,
    fontFamily: Fonts.body,
    flex: 1,
    fontSize: 10,
  },
  favoriteButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 32,
  },
  favoriteIcon: {
    color: Colors.primary,
    fontSize: 21,
    lineHeight: 25,
  },
  pressed: {
    opacity: 0.8,
  },
});
