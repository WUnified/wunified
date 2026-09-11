import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const LISTINGS = [
  //dummy data lives here
  {
    id: '1',
    title: 'Used Biology Textbook',
    price: '$45',
    category: 'Books',
    condition: 'Used',
    seller: 'Maya R.',
    avatar: 'M',
    area: 'WSU campus',
    negotiable: true,
    description:
      'Clean condition, no markings inside, and includes the workbook from the course. Pickup near the engineering building.',
  },
  {
    id: '2',
    title: 'AirPods Pro',
    price: '$120',
    category: 'Tech',
    condition: 'Like new',
    seller: 'Alex T.',
    avatar: 'A',
    area: 'Off campus',
    negotiable: false,
    description:
      'Only used for a few months, case included, battery health is excellent, and I can meet up near campus.',
  },
];

const CATEGORY_OPTIONS = ['Books', 'Tech', 'Furniture', 'Clothes', 'Misc'];
const CONDITION_OPTIONS = ['Any', 'New', 'Used', 'Like new'];
const SORT_OPTIONS = ['Newest', 'Cheapest', 'Nearest'];

export function MarketplaceScreen() {
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>('1');

  const toggleExpandedCard = (listingId: string) => {
    setExpandedId((currentId) => (currentId === listingId ? null : listingId));
  };

  const handleMessageSeller = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    router.push('/chat');
  };

  return (
    <View style={styles.page}>
      <View style={styles.screenContent}>
        <View style={styles.topBar}>
          <View style={styles.searchField}>
            <TextInput
              placeholder="Search"
              placeholderTextColor="#6b7280"
              style={styles.searchInput}
            />
            <Text style={styles.searchIcon}>⌕</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => setIsFilterOpen((open) => !open)}
          style={styles.filterRow}
        >
          <Text style={styles.filterText}>Filter</Text>
          <Text style={styles.filterChevron}>{isFilterOpen ? '−' : '+'}</Text>
        </Pressable>

        {isFilterOpen ? (
          <View style={styles.filterPanel}>
            <View style={styles.filterHeaderRow}>
              <Text style={styles.filterPanelTitle}>Customize</Text>
              <Text style={styles.clearFiltersText}>Clear filters</Text>
            </View>

            <Text style={styles.filterLabel}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORY_OPTIONS.map((category, index) => (
                <View
                  key={category}
                  style={[styles.chip, index === 0 ? styles.chipSelected : null]}
                >
                  <Text style={[styles.chipText, index === 0 ? styles.chipTextSelected : null]}>
                    {category}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.filterLabel}>Price range</Text>
            <View style={styles.rangeRow}>
              <View style={styles.rangeBox}>
                <Text style={styles.rangeValue}>$0</Text>
              </View>
              <Text style={styles.rangeDivider}>–</Text>
              <View style={styles.rangeBox}>
                <Text style={styles.rangeValue}>$200</Text>
              </View>
            </View>

            <Text style={styles.filterLabel}>Condition</Text>
            <View style={styles.segmentRow}>
              {CONDITION_OPTIONS.map((condition, index) => (
                <View
                  key={condition}
                  style={[styles.segment, index === 0 ? styles.segmentSelected : null]}
                >
                  <Text
                    style={[styles.segmentText, index === 0 ? styles.segmentTextSelected : null]}
                  >
                    {condition}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.filterLabel}>Sort by</Text>
            <View style={styles.sortRow}>
              {SORT_OPTIONS.map((option, index) => (
                <View
                  key={option}
                  style={[styles.sortOption, index === 0 ? styles.sortOptionSelected : null]}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      index === 0 ? styles.sortOptionTextSelected : null,
                    ]}
                  >
                    {option}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.filterLabel}>Campus</Text>
            <View style={styles.campusRow}>
              <View style={styles.campusOptionSelected}>
                <Text style={styles.campusOptionTextSelected}>WSU campus</Text>
              </View>
              <View style={styles.campusOption}>
                <Text style={styles.campusOptionText}>Off campus</Text>
              </View>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>Top Listings</Text>

        <ScrollView style={styles.listingList} showsVerticalScrollIndicator={false}>
          {LISTINGS.map((listing) => {
            const isExpanded = expandedId === listing.id;

            return (
              <Pressable
                key={listing.id}
                accessibilityRole="button"
                onPress={() => toggleExpandedCard(listing.id)}
                style={[styles.listingCard, isExpanded ? styles.listingCardExpanded : null]}
              >
                {isExpanded ? (
                  <>
                    <View style={styles.imageStack}>
                      <View style={styles.mainImage}>
                        <Text style={styles.imageGlyph}>◌</Text>
                      </View>

                      <View style={styles.photoStrip}>
                        <View style={styles.thumb} />
                        <View style={styles.thumb} />
                        <View style={styles.thumb} />
                      </View>
                    </View>

                    <View style={styles.listingHeaderRow}>
                      <View style={styles.headerTextWrap}>
                        <Text style={styles.listingName}>{listing.title}</Text>
                        <Text style={styles.listingPrice}>{listing.price}</Text>
                      </View>

                      <View style={styles.actionRow}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={(event) => {
                            event.stopPropagation();
                          }}
                          style={styles.favoriteButton}
                        >
                          <Text style={styles.favoriteIcon}>♡</Text>
                        </Pressable>

                        <Pressable
                          accessibilityRole="button"
                          onPress={handleMessageSeller}
                          style={styles.messageButton}
                        >
                          <Text style={styles.messageButtonIcon}>💬</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.tagRow}>
                      <View style={styles.tagPill}>
                        <Text style={styles.tagText}>{listing.category}</Text>
                      </View>
                      <View style={styles.tagPill}>
                        <Text style={styles.tagText}>{listing.condition}</Text>
                      </View>
                      <View style={styles.tagPill}>
                        <Text style={styles.tagText}>
                          {listing.negotiable ? 'Negotiable' : 'New'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.descriptionBox}>
                      <Text style={styles.descriptionText}>{listing.description}</Text>
                    </View>

                    <View style={styles.sellerRow}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{listing.avatar}</Text>
                      </View>

                      <View style={styles.sellerMeta}>
                        <Text style={styles.sellerName}>{listing.seller}</Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.compactImage}>
                      <Text style={styles.imageGlyph}>◌</Text>
                    </View>

                    <View style={styles.compactContent}>
                      <View style={styles.compactHeaderRow}>
                        <Text style={styles.compactTitle}>{listing.title}</Text>
                        <Text style={styles.compactPrice}>{listing.price}</Text>
                      </View>

                      <View style={styles.compactTagRow}>
                        <View style={styles.tagPill}>
                          <Text style={styles.tagText}>{listing.category}</Text>
                        </View>
                        <View style={styles.tagPill}>
                          <Text style={styles.tagText}>{listing.condition}</Text>
                        </View>
                      </View>
                    </View>
                  </>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable style={styles.addButton} accessibilityRole="button">
          <Text style={styles.addButtonText}>＋</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#e3e3e1',
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  screenContent: {
    backgroundColor: '#f1f1f1',
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 24,
    position: 'relative',
  },
  topBar: {
    marginBottom: 12,
  },
  searchField: {
    alignItems: 'center',
    backgroundColor: '#dfe1e5',
    borderColor: '#1f1f1f',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    height: 42,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  searchInput: {
    color: '#111827',
    flex: 1,
    fontSize: 18,
    padding: 0,
  },
  searchIcon: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
  },
  filterRow: {
    alignItems: 'center',
    backgroundColor: '#e9e9e9',
    borderColor: '#1f1f1f',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
  },
  filterChevron: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '700',
  },
  filterPanel: {
    backgroundColor: '#ececec',
    borderColor: '#1f1f1f',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  filterPanelTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  clearFiltersText: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '600',
  },
  filterLabel: {
    color: '#1f2937',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  chipText: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#1d4ed8',
  },
  rangeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  rangeBox: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rangeValue: {
    color: '#111827',
    fontSize: 12,
  },
  rangeDivider: {
    color: '#374151',
    fontSize: 18,
    fontWeight: '700',
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  segment: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  segmentSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  segmentText: {
    color: '#374151',
    fontSize: 10,
    fontWeight: '600',
  },
  segmentTextSelected: {
    color: '#1d4ed8',
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sortOption: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sortOptionSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  sortOptionText: {
    color: '#374151',
    fontSize: 10,
    fontWeight: '600',
  },
  sortOptionTextSelected: {
    color: '#1d4ed8',
  },
  campusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  campusOption: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  campusOptionSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  campusOptionText: {
    color: '#374151',
    fontSize: 11,
    textAlign: 'center',
  },
  campusOptionTextSelected: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionLabel: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  listingList: {
    flex: 1,
    marginBottom: 10,
  },
  listingCard: {
    backgroundColor: '#e8e8e8',
    borderColor: '#1f1f1f',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    padding: 12,
  },
  listingCardExpanded: {
    paddingBottom: 14,
  },
  imageStack: {
    gap: 8,
    marginBottom: 12,
  },
  mainImage: {
    alignItems: 'center',
    backgroundColor: '#d7d9db',
    borderColor: '#1f1f1f',
    borderRadius: 8,
    borderWidth: 1,
    height: 120,
    justifyContent: 'center',
    width: '100%',
  },
  photoStrip: {
    flexDirection: 'row',
    gap: 8,
  },
  thumb: {
    backgroundColor: '#d7d9db',
    borderColor: '#1f1f1f',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    height: 44,
  },
  imageGlyph: {
    color: '#6b7280',
    fontSize: 28,
  },
  listingHeaderRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  headerTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  listingName: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  listingPrice: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  favoriteButton: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderColor: '#1f1f1f',
    borderRadius: 20,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  favoriteIcon: {
    color: '#111827',
    fontSize: 16,
  },
  messageButton: {
    alignItems: 'center',
    backgroundColor: '#1d4ed8',
    borderColor: '#1e40af',
    borderRadius: 20,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  messageButtonIcon: {
    color: '#ffffff',
    fontSize: 16,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagPill: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    color: '#1d4ed8',
    fontSize: 10,
    fontWeight: '700',
  },
  descriptionBox: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  descriptionText: {
    color: '#374151',
    fontSize: 12,
    lineHeight: 18,
  },
  sellerRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#d1d5db',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    marginRight: 10,
    width: 32,
  },
  avatarText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  sellerMeta: {
    flex: 1,
  },
  sellerName: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  sellerLocation: {
    color: '#4b5563',
    fontSize: 11,
  },
  compactImage: {
    alignItems: 'center',
    backgroundColor: '#d7d9db',
    borderColor: '#1f1f1f',
    borderRadius: 8,
    borderWidth: 1,
    height: 70,
    justifyContent: 'center',
    marginRight: 12,
    width: 70,
  },
  compactContent: {
    flex: 1,
  },
  compactHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  compactTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  compactPrice: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  compactTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#ff5e4d',
    borderColor: '#1f1f1f',
    borderRadius: 28,
    borderWidth: 2,
    bottom: 18,
    elevation: 5,
    height: 52,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    width: 52,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 30,

    lineHeight: 30,
    marginTop: -2,
  },
});
