import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../../constants/colors';
import { Fonts } from '../../../constants/typography';

export function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>WUNIFIED</Text>
        <Text style={styles.eyebrow}>WICHITA STATE UNIVERSITY</Text>
        <Text style={styles.title}>Your campus, connected.</Text>
        <Text style={styles.intro}>
          Find your next great deal and stay in the loop with the Shocker community.
        </Text>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Explore WUnified</Text>
        <Text style={styles.sectionNote}>Made for the WSU community</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/(tabs)/index')}
        style={({ pressed }) => [styles.marketplaceAction, pressed && styles.pressed]}
      >
        <View style={styles.actionTopline}>
          <Text style={styles.actionCategory}>BUY & SELL</Text>
          <Text style={styles.actionArrow}>↗</Text>
        </View>
        <Text style={styles.marketplaceTitle}>Marketplace</Text>
        <Text style={styles.marketplaceDescription}>
          Discover student finds or pass something useful along.
        </Text>
        <Text style={styles.marketplaceLink}>Browse listings</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/(tabs)/community')}
        style={({ pressed }) => [styles.communityAction, pressed && styles.pressed]}
      >
        <View style={styles.actionTopline}>
          <Text style={styles.actionCategory}>CAMPUS LIFE</Text>
          <Text style={styles.communityArrow}>↗</Text>
        </View>
        <Text style={styles.communityTitle}>Community</Text>
        <Text style={styles.communityDescription}>
          Catch up on conversations happening around campus.
        </Text>
        <Text style={styles.communityLink}>Visit the boards</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 36,
  },
  wordmark: {
    color: Colors.primary,
    fontFamily: Fonts.headingHeavy,
    fontSize: 16,
    letterSpacing: 1,
    marginBottom: 32,
  },
  eyebrow: {
    color: Colors.textDim,
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    marginBottom: 10,
  },
  title: {
    color: Colors.text,
    fontFamily: Fonts.headingHeavy,
    fontSize: 34,
    lineHeight: 39,
    maxWidth: 330,
  },
  intro: {
    color: Colors.textDim,
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
    maxWidth: 390,
  },
  sectionHeading: {
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    marginBottom: 16,
    paddingTop: 18,
  },
  sectionTitle: {
    color: Colors.text,
    fontFamily: Fonts.heading,
    fontSize: 19,
  },
  sectionNote: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 13,
    marginTop: 4,
  },
  marketplaceAction: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    marginBottom: 14,
    minHeight: 190,
    padding: 20,
  },
  communityAction: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 190,
    padding: 20,
  },
  actionTopline: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCategory: {
    color: Colors.onPrimary,
    fontFamily: Fonts.semiBold,
    fontSize: 11,
  },
  actionArrow: {
    color: Colors.onPrimary,
    fontFamily: Fonts.bold,
    fontSize: 22,
  },
  communityArrow: {
    color: Colors.primary,
    fontFamily: Fonts.bold,
    fontSize: 22,
  },
  marketplaceTitle: {
    color: Colors.onPrimary,
    fontFamily: Fonts.headingHeavy,
    fontSize: 26,
    marginTop: 18,
  },
  communityTitle: {
    color: Colors.text,
    fontFamily: Fonts.headingHeavy,
    fontSize: 26,
    marginTop: 18,
  },
  marketplaceDescription: {
    color: Colors.onPrimary,
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
    maxWidth: 300,
  },
  communityDescription: {
    color: Colors.textDim,
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
    maxWidth: 300,
  },
  marketplaceLink: {
    color: Colors.onPrimary,
    fontFamily: Fonts.heading,
    fontSize: 13,
    marginTop: 16,
  },
  communityLink: {
    color: Colors.primary,
    fontFamily: Fonts.heading,
    fontSize: 13,
    marginTop: 16,
  },
  pressed: {
    opacity: 0.82,
  },
});
