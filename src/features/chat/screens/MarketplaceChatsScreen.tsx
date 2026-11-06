import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from './MarketplaceChatsScreen.styles';
import { IconButton } from '../../../components/IconButton';
import { Colors } from '../../../constants/colors';
import { useSession } from '../../auth';
import { ChatInboxRow } from '../components/ChatInboxRow';
import { useChatList } from '../hooks';
import {
  formatChatTimestamp,
  getChatListingImage,
  getChatPreview,
  getChatRowName,
} from '../presentation';

const backIcon = require('../../../../assets/back-icon.png') as ImageSourcePropType;

// Messenger-style folder: every buyer and seller conversation, kept out of the main
// inbox so personal messages and club channels stay uncluttered.
export function MarketplaceChatsScreen() {
  const router = useRouter();
  const { session } = useSession();
  const currentUserId = session?.user.id ?? null;
  // Filtered by type in the query, so this loads only marketplace chats.
  const { chats, loading, loaded, error, reload } = useChatList({ type: 'marketplace' });

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/chat');
  }

  function renderEmpty() {
    if (loading) return <ActivityIndicator color={Colors.primary} style={styles.state} />;
    if (error) {
      return (
        <View style={styles.state}>
          <Text accessibilityRole="alert" style={styles.errorText}>
            {error}
          </Text>
          <Pressable
            accessibilityLabel="Retry loading marketplace chats"
            accessibilityRole="button"
            onPress={() => void reload()}
            style={styles.retryButton}
          >
            <Text style={styles.retryLabel}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.state}>
        <Text style={styles.emptyTitle}>No marketplace chats yet</Text>
        <Text style={styles.emptyBody}>
          Tap “Message seller” on a listing to ask about it. Buyers who message you about your
          listings show up here too.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <IconButton accessibilityLabel="Back" iconSource={backIcon} onPress={goBack} />
        <Text accessibilityRole="header" style={styles.title}>
          Marketplace
        </Text>
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={chats}
        keyExtractor={(chat) => chat.id}
        ListEmptyComponent={renderEmpty()}
        refreshControl={
          <RefreshControl
            onRefresh={() => void reload()}
            refreshing={loaded && loading}
            tintColor={Colors.primary}
          />
        }
        renderItem={({ item }) => (
          <ChatInboxRow
            avatar={null}
            imageUri={getChatListingImage(item)}
            name={getChatRowName(item, currentUserId)}
            onPress={() =>
              router.push({ pathname: '/conversation/[chatId]', params: { chatId: item.id } })
            }
            subtitle={getChatPreview(item, currentUserId)}
            timestamp={formatChatTimestamp(item.lastMessage?.createdAt ?? item.updatedAt)}
            unreadCount={item.unreadCount}
            variant="marketplace"
          />
        )}
      />
    </SafeAreaView>
  );
}
