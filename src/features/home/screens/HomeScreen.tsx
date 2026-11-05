import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '../../../components/IconButton';
import { Colors } from '../../../constants/colors';
import { CommunityBoardPostCard } from '../components/CommunityBoardPostCard';
import { CreateCommunityPostModal } from '../components/CreateCommunityPostModal';
import { useCommunityPosts, useCreateCommunityPost } from '../hooks';
import type { CommunityPost } from '../types';
import { styles } from './HomeScreen.styles';

const plusIcon = require('../../../../assets/plus-icon.png') as ImageSourcePropType;

export function HomeScreen() {
  const { posts, loading, loadingMore, hasMore, error, reload, loadMore } = useCommunityPosts();
  const createPost = useCreateCommunityPost();
  const [composerVisible, setComposerVisible] = useState(false);

  async function handleCreatePost(input: { title: string; body: string }) {
    const createdPost = await createPost.submit(input);
    if (!createdPost) return false;
    setComposerVisible(false);
    void reload();
    return true;
  }

  function renderEmptyState() {
    if (loading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.stateMessage}>Loading the community board…</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stateContainer}>
          <Text style={styles.stateMessage}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => void reload()}>
            <Text style={styles.actionText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

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
        <Text style={styles.wordmark}>WUnified</Text>
        <View style={styles.headerSpacer} />
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
