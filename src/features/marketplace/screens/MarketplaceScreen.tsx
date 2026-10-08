import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Colors } from '../../../constants/colors';
import { Fonts, Typography } from '../../../constants/typography';

type Category = 'Furniture' | 'Tech' | 'Clothing' | 'Books' | 'Sports';
type CategoryFilter = 'All' | Category;
type SortMode = 'Recommended' | 'Price: low to high';

interface Listing {
  id: string;
  title: string;
  price: number;
  category: Category;
  seller: string;
  sellerInitials: string;
  condition: string;
  description: string;
  image: string;
  trending: boolean;
}

const CATEGORIES: CategoryFilter[] = ['All', 'Furniture', 'Tech', 'Clothing', 'Books', 'Sports'];
const SORT_MODES: SortMode[] = ['Recommended', 'Price: low to high'];
const LISTINGS: Listing[] = [
  {
    id: 'chair',
    title: 'Minimalist Lounge Chair',
    price: 149,
    category: 'Furniture',
    seller: 'Marcus T.',
    sellerInitials: 'MT',
    condition: 'Like new',
    description: 'A comfortable lounge chair in excellent condition. Easy pickup near campus.',
    image:
      'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=700&q=85',
    trending: true,
  },
  {
    id: 'camera',
    title: 'Retro Film Camera',
    price: 85,
    category: 'Tech',
    seller: 'Sonia P.',
    sellerInitials: 'SP',
    condition: 'Good',
    description: 'Classic 35mm film camera, tested and ready for its next photographer.',
    image:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=85',
    trending: true,
  },
  {
    id: 'keyboard',
    title: 'Mechanical Keyboard',
    price: 120,
    category: 'Tech',
    seller: 'Devin K.',
    sellerInitials: 'DK',
    condition: 'Like new',
    description: 'Compact mechanical keyboard with tactile switches and a USB-C cable.',
    image:
      'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=700&q=85',
    trending: true,
  },
  {
    id: 'bag',
    title: 'Canvas Messenger Bag',
    price: 45,
    category: 'Clothing',
    seller: 'Clara M.',
    sellerInitials: 'CM',
    condition: 'Good',
    description: 'Roomy canvas messenger bag with adjustable strap and plenty of life left.',
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=85',
    trending: false,
  },
  {
    id: 'textbook',
    title: 'Biology Textbook',
    price: 38,
    category: 'Books',
    seller: 'Maya R.',
    sellerInitials: 'MR',
    condition: 'Used',
    description: 'Clean copy with a few notes in the margins. Can meet on campus.',
    image:
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=700&q=85',
    trending: false,
  },
  {
    id: 'sneakers',
    title: 'Everyday Sneakers',
    price: 55,
    category: 'Sports',
    seller: 'Jordan L.',
    sellerInitials: 'JL',
    condition: 'Good',
    description: 'Comfortable everyday sneakers, lightly worn and freshly cleaned.',
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=85',
    trending: false,
  },
];

const formatPrice = (price: number) => `$${price}`;

export function MarketplaceScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [sortMode, setSortMode] = useState<SortMode>('Recommended');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleListings = LISTINGS.filter((listing) => {
    const matchesCategory = activeCategory === 'All' || listing.category === activeCategory;
    const matchesQuery =
      !normalizedQuery ||
      `${listing.title} ${listing.category} ${listing.seller}`
        .toLowerCase()
        .includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });

  if (sortMode === 'Price: low to high') {
    visibleListings.sort((first, second) => first.price - second.price);
  }

  const toggleFavorite = (listingId: string) => {
    setFavoriteIds((currentIds) =>
      currentIds.includes(listingId)
        ? currentIds.filter((currentId) => currentId !== listingId)
        : [...currentIds, listingId],
    );
  };

  const openCreateListingNotice = () => {
    Alert.alert('Listing creation', 'Posting a listing will be available soon.');
  };

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.toolbar}>
          <Pressable
            accessibilityLabel="Create listing"
            accessibilityRole="button"
            onPress={openCreateListingNotice}
            style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
          >
            <Image
              source={require('../../../../assets/plus-icon.png') as ImageSourcePropType}
              style={styles.filterImage}
            />
          </Pressable>

          <View style={styles.searchField}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              accessibilityLabel="Search listings"
              onChangeText={setSearchQuery}
              placeholder="Search listings..."
              placeholderTextColor={Colors.textMuted}
              returnKeyType="search"
              style={styles.searchInput}
              value={searchQuery}
            />
          </View>

          <Pressable
            accessibilityLabel="Sort listings"
            accessibilityRole="button"
            onPress={() => setIsSortOpen(true)}
            style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}
          >
            <Image
              source={require('../../../../assets/filter-icon.png') as ImageSourcePropType}
              style={styles.filterImage}
            />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.categoryContent}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          {CATEGORIES.map((category) => {
            const isActive = category === activeCategory;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                key={category}
                onPress={() => setActiveCategory(category)}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              >
                <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.trendingSectionTitle}>Trending</Text>
          <Text style={styles.sectionAside}>Around campus</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.trendingContent}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.trendingScroll}
        >
          {LISTINGS.filter((listing) => listing.trending).map((listing) => (
            <Pressable
              accessibilityRole="button"
              key={listing.id}
              onPress={() => setSelectedListing(listing)}
              style={({ pressed }) => [styles.trendingCard, pressed && styles.pressed]}
            >
              <Image
                accessibilityLabel={listing.title}
                source={{ uri: listing.image }}
                style={styles.trendingImage}
              />
              <Text numberOfLines={1} style={styles.trendingTitle}>
                {listing.title}
              </Text>
              <Text style={styles.trendingPrice}>{formatPrice(listing.price)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Just for you</Text>
          <Text style={styles.sectionAside}>{visibleListings.length} finds</Text>
        </View>

        {visibleListings.length > 0 ? (
          <View style={styles.listingGrid}>
            {visibleListings.map((listing) => {
              const isFavorite = favoriteIds.includes(listing.id);

              return (
                <View key={listing.id} style={styles.listingCard}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setSelectedListing(listing)}
                    style={({ pressed }) => [styles.listingMain, pressed && styles.pressed]}
                  >
                    <Image
                      accessibilityLabel={listing.title}
                      source={{ uri: listing.image }}
                      style={styles.listingImage}
                    />
                    <View style={styles.listingDetails}>
                      <Text numberOfLines={1} style={styles.listingTitle}>
                        {listing.title}
                      </Text>
                      <Text style={styles.listingPrice}>{formatPrice(listing.price)}</Text>
                      <View style={styles.sellerRow}>
                        <View style={styles.sellerAvatar}>
                          <Text style={styles.sellerInitials}>{listing.sellerInitials}</Text>
                        </View>
                        <Text numberOfLines={1} style={styles.sellerName}>
                          {listing.seller}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isFavorite }}
                    onPress={() => toggleFavorite(listing.id)}
                    style={({ pressed }) => [styles.favoriteButton, pressed && styles.pressed]}
                  >
                    <Text style={[styles.favoriteIcon, isFavorite && styles.favoriteIconActive]}>
                      {isFavorite ? '♥' : '♡'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No listings found</Text>
            <Text style={styles.emptyDescription}>
              Try another search or choose a different category.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsSortOpen(false)}
        transparent
        visible={isSortOpen}
      >
        <Pressable onPress={() => setIsSortOpen(false)} style={styles.modalBackdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.sortSheet}>
            <Text style={styles.sheetTitle}>Sort listings</Text>
            {SORT_MODES.map((mode) => {
              const isSelected = sortMode === mode;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={mode}
                  onPress={() => {
                    setSortMode(mode);
                    setIsSortOpen(false);
                  }}
                  style={styles.sortOption}
                >
                  <Text
                    style={[styles.sortOptionLabel, isSelected && styles.sortOptionLabelActive]}
                  >
                    {mode}
                  </Text>
                  <Text style={styles.sortCheck}>{isSelected ? '✓' : ''}</Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setSelectedListing(null)}
        transparent
        visible={selectedListing !== null}
      >
        <Pressable onPress={() => setSelectedListing(null)} style={styles.modalBackdrop}>
          {selectedListing ? (
            <Pressable onPress={(event) => event.stopPropagation()} style={styles.detailSheet}>
              <Image
                accessibilityLabel={selectedListing.title}
                source={{ uri: selectedListing.image }}
                style={styles.detailImage}
              />
              <View style={styles.detailContent}>
                <Text style={styles.detailCategory}>{selectedListing.category.toUpperCase()}</Text>
                <Text style={styles.detailTitle}>{selectedListing.title}</Text>
                <Text style={styles.detailPrice}>{formatPrice(selectedListing.price)}</Text>
                <Text style={styles.detailDescription}>{selectedListing.description}</Text>
                <View style={styles.detailSellerRow}>
                  <View style={styles.sellerAvatar}>
                    <Text style={styles.sellerInitials}>{selectedListing.sellerInitials}</Text>
                  </View>
                  <View>
                    <Text style={styles.detailSellerName}>{selectedListing.seller}</Text>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setSelectedListing(null);
                    router.push('/chat');
                  }}
                  style={({ pressed }) => [styles.messageButton, pressed && styles.pressed]}
                >
                  <Text style={styles.messageButtonLabel}>Message seller</Text>
                </Pressable>
              </View>
            </Pressable>
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  content: {
    paddingBottom: 28,
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  createButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 50,
  },
  searchField: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: 44,
    paddingHorizontal: 13,
  },
  searchIcon: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 24,
    lineHeight: 28,
    marginRight: 8,
  },
  searchInput: {
    color: Colors.text,
    fontFamily: Fonts.body,
    flex: 1,
    fontSize: 14,
    minWidth: 0,
    padding: 0,
  },
  filterButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 50,
  },
  filterImage: {
    height: 24,
    width: 24,
  },
  categoryScroll: {
    flexGrow: 0,
    marginBottom: 22,
    marginHorizontal: -16,
  },
  categoryContent: {
    gap: 8,
    paddingHorizontal: 16,
  },
  categoryChip: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryLabel: {
    ...Typography.label,
    color: Colors.text,
  },
  categoryLabelActive: {
    color: Colors.onPrimary,
  },
  sectionHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
    fontSize: 18,
  },
  trendingSectionTitle: {
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
    fontSize: 18,
  },
  sectionAside: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  trendingScroll: {
    flexGrow: 0,
    marginBottom: 24,
    marginHorizontal: -16,
  },
  trendingContent: {
    gap: 12,
    paddingHorizontal: 16,
  },
  trendingCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    width: 112,
  },
  trendingImage: {
    backgroundColor: Colors.border,
    height: 76,
    width: '100%',
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
  },
  listingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  listingCard: {
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
  listingImage: {
    backgroundColor: Colors.border,
    height: 132,
    width: '100%',
  },
  listingDetails: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 9,
  },
  listingTitle: {
    ...Typography.listingTitle,
    color: Colors.text,
    fontSize: 13,
  },
  listingPrice: {
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
    right: 8,
    top: 8,
    width: 32,
  },
  favoriteIcon: {
    color: Colors.primary,
    fontSize: 21,
    lineHeight: 25,
  },
  favoriteIconActive: {
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  emptyTitle: {
    color: Colors.text,
    fontFamily: Fonts.heading,
    fontSize: 16,
  },
  emptyDescription: {
    ...Typography.body,
    color: Colors.textDim,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    textAlign: 'center',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sortSheet: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  sheetTitle: {
    color: Colors.text,
    fontFamily: Fonts.heading,
    fontSize: 18,
    marginBottom: 12,
  },
  sortOption: {
    alignItems: 'center',
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  sortOptionLabel: {
    color: Colors.textDim,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  sortOptionLabelActive: {
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  sortCheck: {
    color: Colors.primary,
    fontFamily: Fonts.bold,
    fontSize: 18,
  },
  detailSheet: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  detailImage: {
    backgroundColor: Colors.border,
    height: 240,
    width: '100%',
  },
  detailContent: {
    padding: 20,
  },
  detailCategory: {
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
    fontSize: 11,
  },
  detailTitle: {
    color: Colors.text,
    fontFamily: Fonts.headingHeavy,
    fontSize: 23,
    marginTop: 7,
  },
  detailPrice: {
    color: Colors.text,
    fontFamily: Fonts.heading,
    fontSize: 19,
    marginTop: 5,
  },
  detailDescription: {
    ...Typography.body,
    color: Colors.textDim,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 14,
  },
  detailSellerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  detailSellerName: {
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  messageButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 46,
  },
  messageButtonLabel: {
    ...Typography.button,
    color: Colors.onPrimary,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.8,
  },
});
