import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '../../../components/IconButton';
import { Colors } from '../../../constants/colors';
import { getTabBarContentClearance } from '../../../constants/tabBar';
import { Fonts } from '../../../constants/typography';

export function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: getTabBarContentClearance(insets.bottom) },
      ]}
      style={styles.page}
    >
      <View style={styles.header}>
        <Text style={styles.wordmark}>WUNIFIED</Text>
        <Text style={styles.eyebrow}>WICHITA STATE UNIVERSITY</Text>
        <Text style={styles.title}>Your campus, connected.</Text>
        <Text style={styles.intro}>
          Find your next great deal and stay in the loop with the Shocker community.
        </Text>
      </View>

    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateTitle}>The board is quiet for now</Text>
        <Text style={styles.stateMessage}>Start a conversation with the WSU community.</Text>
        <Pressable accessibilityRole="button" onPress={() => setComposerVisible(true)}>
          <Text style={styles.actionText}>Create a post</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Create a post"
          iconSource={plusIcon}
          onPress={() => setComposerVisible(true)}
        />
        <View style={styles.logoViewport}>
          <Image
            accessibilityLabel="WUnified"
            resizeMode="contain"
            source={wunifiedLogo}
            style={styles.logoImage}
          />
        </View>
        <Pressable
          accessibilityLabel="Open notifications"
          accessibilityRole="button"
          onPress={() => setNotificationsVisible(true)}
          style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}
        >
          <Image resizeMode="contain" source={bellIcon} style={styles.notificationIcon} />
          <View style={styles.notificationBadge} />
        </Pressable>
      </View>

      {error && posts.length > 0 ? (
        <View style={styles.feedError}>
          <Text style={styles.feedErrorText}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => void reload()}>
            <Text style={styles.actionText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.feedContent}
        data={posts}
        keyExtractor={(post) => post.id}
        onEndReached={() => {
          if (hasMore && !loadingMore) void loadMore();
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            onRefresh={() => void reload()}
            refreshing={loading && posts.length > 0}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            <HomeDashboardSections
              events={HOME_DASHBOARD_MOCK_EVENTS}
              notifications={HOME_DASHBOARD_MOCK_NOTIFICATIONS}
              notificationsVisible={notificationsVisible}
              onCloseNotifications={() => setNotificationsVisible(false)}
              onOpenNotifications={() => setNotificationsVisible(true)}
              organizationActivity={HOME_DASHBOARD_MOCK_ORGANIZATION_ACTIVITY}
            />
            <View style={styles.feedHeading}>
              <Text style={styles.feedTitle}>Community board</Text>
              <Text style={styles.feedSubtitle}>What’s happening around WSU</Text>
            </View>
          </View>
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={Colors.primary} style={styles.loadingMore} />
          ) : undefined
        }
        renderItem={({ item }: { item: CommunityPost }) => <CommunityBoardPostCard post={item} />}
      />

      <CreateCommunityPostModal
        error={createPost.error}
        onClose={() => setComposerVisible(false)}
        onSubmit={handleCreatePost}
        saving={createPost.saving}
        visible={composerVisible}
      />
    </SafeAreaView>
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
