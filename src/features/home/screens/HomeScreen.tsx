import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../../constants/colors';

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
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 32,
  },
  eyebrow: {
    color: Colors.textDim,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 10,
  },
  title: {
    color: Colors.text,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 39,
    maxWidth: 330,
  },
  intro: {
    color: Colors.textDim,
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
    fontSize: 19,
    fontWeight: '800',
  },
  sectionNote: {
    color: Colors.textMuted,
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
    fontSize: 11,
    fontWeight: '900',
  },
  actionArrow: {
    color: Colors.onPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  communityArrow: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  marketplaceTitle: {
    color: Colors.onPrimary,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 18,
  },
  communityTitle: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 18,
  },
  marketplaceDescription: {
    color: Colors.onPrimary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
    maxWidth: 300,
  },
  communityDescription: {
    color: Colors.textDim,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
    maxWidth: 300,
  },
  marketplaceLink: {
    color: Colors.onPrimary,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 16,
  },
  communityLink: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 16,
  },
  pressed: {
    opacity: 0.82,
  },
});
