import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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

import { IconButton } from '../../../components/IconButton';
import { Colors } from '../../../constants/colors';
import { Fonts, Typography } from '../../../constants/typography';
import { CreateListingForm } from '../components/CreateListingForm';
import { MarketplaceListingCard } from '../components/MarketplaceListingCard';
import { useCreateMarketplaceListing, useMarketplaceListings } from '../hooks';
import {
  getFirstListingImage,
  getMarketplaceCategoryLabel,
  toMarketplaceCardListing,
} from '../presentation';
import { MARKETPLACE_CATEGORIES } from '../types';
import type {
  CreateMarketplaceListingInput,
  MarketplaceCategory,
  MarketplaceListing,
} from '../types';

type CategoryFilter = 'All' | MarketplaceCategory;
type SortMode = 'Recommended' | 'Price: low to high';
const CATEGORIES: CategoryFilter[] = ['All', ...MARKETPLACE_CATEGORIES];
const SORT_MODES: SortMode[] = ['Recommended', 'Price: low to high'];

const formatPrice = (price: number) => `$${price}`;

export function MarketplaceScreen() {
  const router = useRouter();
  const { listings, loading, error, reload } = useMarketplaceListings();
  const {
    saving: isCreatingListing,
    error: createListingError,
    submit: submitListing,
    clearError: clearCreateListingError,
  } = useCreateMarketplaceListing();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [sortMode, setSortMode] = useState<SortMode>('Recommended');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isCreateListingOpen, setIsCreateListingOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchingListings = listings.filter((listing) => {
    const matchesCategory = activeCategory === 'All' || listing.category === activeCategory;
    const matchesQuery =
      !normalizedQuery ||
      `${listing.title} ${getMarketplaceCategoryLabel(listing.category)} ${listing.seller.displayName} ${listing.seller.username}`
        .toLowerCase()
        .includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });

  const visibleListings = [...matchingListings];
  if (sortMode === 'Price: low to high') {
    visibleListings.sort((first, second) => first.price - second.price);
  }
  const recentlyListed = [...matchingListings]
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    .slice(0, 3);

  const toggleFavorite = (listingId: string) => {
    setFavoriteIds((currentIds) =>
      currentIds.includes(listingId)
        ? currentIds.filter((currentId) => currentId !== listingId)
        : [...currentIds, listingId],
    );
  };

  const openCreateListingForm = () => {
    clearCreateListingError();
    setIsCreateListingOpen(true);
  };

  const closeCreateListingForm = () => {
    if (!isCreatingListing) {
      setIsCreateListingOpen(false);
    }
  };

  const openBasketNotice = () => {
    Alert.alert('Shopping basket', 'Your basket is empty.');
  };

  const handleCreateListing = async (input: CreateMarketplaceListingInput) => {
    const createdListing = await submitListing(input);
    if (!createdListing) {
      return false;
    }

    await reload();
    setIsCreateListingOpen(false);
    return true;
  };

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.toolbar}>
          <IconButton
            accessibilityLabel="Create listing"
            onPress={openCreateListingForm}
            iconSource={require('../../../../assets/plus-icon.png') as ImageSourcePropType}
          />

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

          <IconButton
            accessibilityLabel="Shopping basket"
            onPress={openBasketNotice}
            iconSource={
              require('../../../../assets/shopping-basket-icon.png') as ImageSourcePropType
            }
          />
        </View>

        <View style={styles.categoryRow}>
          <IconButton
            accessibilityLabel="Sort listings"
            onPress={() => setIsSortOpen(true)}
            iconSource={require('../../../../assets/filter-icon.png') as ImageSourcePropType}
          />

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
                    {category === 'All' ? 'All' : getMarketplaceCategoryLabel(category)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.statusState}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.statusText}>Loading listings…</Text>
          </View>
        ) : error ? (
          <View style={styles.statusState}>
            <Text accessibilityRole="alert" style={styles.errorText}>
              {error}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void reload()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            >
              <Text style={styles.retryLabel}>Try again</Text>
            </Pressable>
          </View>
        ) : visibleListings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No listings found</Text>
            <Text style={styles.emptyDescription}>
              {listings.length === 0
                ? 'Be the first to post a listing.'
                : 'Try another search or choose a different category.'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.trendingSectionTitle}>Recently listed</Text>
              <Text style={styles.sectionAside}>Latest from campus</Text>
            </View>

            <ScrollView
              contentContainerStyle={styles.trendingContent}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.trendingScroll}
            >
              {recentlyListed.map((listing) => (
                <MarketplaceListingCard
                  key={listing.id}
                  listing={toMarketplaceCardListing(listing)}
                  onPress={() => setSelectedListing(listing)}
                  variant="trending"
                />
              ))}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All listings</Text>
              <Text style={styles.sectionAside}>{visibleListings.length} listings</Text>
            </View>

            <View style={styles.listingGrid}>
              {visibleListings.map((listing) => (
                <MarketplaceListingCard
                  isFavorite={favoriteIds.includes(listing.id)}
                  key={listing.id}
                  listing={toMarketplaceCardListing(listing)}
                  onPress={() => setSelectedListing(listing)}
                  onToggleFavorite={() => toggleFavorite(listing.id)}
                  variant="grid"
                />
              ))}
            </View>
          </>
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
              {getFirstListingImage(selectedListing.images) ? (
                <Image
                  accessibilityLabel={selectedListing.title}
                  source={{ uri: getFirstListingImage(selectedListing.images) ?? undefined }}
                  style={styles.detailImage}
                />
              ) : (
                <View style={styles.detailImagePlaceholder}>
                  <Text style={styles.detailImagePlaceholderText}>No photo available</Text>
                </View>
              )}
              <View style={styles.detailContent}>
                <Text style={styles.detailCategory}>
                  {getMarketplaceCategoryLabel(selectedListing.category).toUpperCase()}
                </Text>
                <Text style={styles.detailTitle}>{selectedListing.title}</Text>
                <Text style={styles.detailPrice}>{formatPrice(selectedListing.price)}</Text>
                {selectedListing.condition ? (
                  <Text style={styles.detailCondition}>Condition: {selectedListing.condition}</Text>
                ) : null}
                <Text style={styles.detailDescription}>{selectedListing.description}</Text>
                <View style={styles.detailSellerRow}>
                  <View style={styles.sellerAvatar}>
                    <Text style={styles.sellerInitials}>
                      {toMarketplaceCardListing(selectedListing).sellerInitials}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.detailSellerName}>
                      {toMarketplaceCardListing(selectedListing).seller}
                    </Text>
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

      <Modal
        animationType="slide"
        onRequestClose={closeCreateListingForm}
        transparent
        visible={isCreateListingOpen}
      >
        {isCreateListingOpen ? (
          <Pressable onPress={closeCreateListingForm} style={styles.modalBackdrop}>
            <Pressable onPress={(event) => event.stopPropagation()} style={styles.createSheet}>
              <CreateListingForm
                error={createListingError}
                onCancel={closeCreateListingForm}
                onSubmit={handleCreateListing}
                saving={isCreatingListing}
              />
            </Pressable>
          </Pressable>
        ) : null}
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
  categoryScroll: {
    flex: 1,
  },
  categoryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 22,
  },
  categoryContent: {
    gap: 8,
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
  listingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
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
  detailImagePlaceholder: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    height: 180,
    justifyContent: 'center',
    width: '100%',
  },
  detailImagePlaceholderText: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 13,
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
  detailCondition: {
    color: Colors.textDim,
    fontFamily: Fonts.body,
    fontSize: 13,
    marginTop: 7,
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
  createSheet: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    maxHeight: '92%',
  },
  statusState: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    marginTop: 6,
    padding: 24,
  },
  statusText: {
    color: Colors.textDim,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  errorText: {
    color: Colors.danger,
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 18,
  },
  retryLabel: {
    color: Colors.onPrimary,
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.8,
  },
});
