import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from './ChatScreen.styles';
import { IconButton } from '../../../components/IconButton';
import { Colors } from '../../../constants/colors';
import { useSession } from '../../auth';
import { ChannelItem } from '../components/ChannelItem';
import { ChatInboxRow } from '../components/ChatInboxRow';
import { ChatSearchBar } from '../components/ChatSearchBar';
import { useChatList } from '../hooks';
import {
  formatChatTimestamp,
  getChatAvatar,
  getChatDisplayName,
  getChatListingImage,
  getChatPreview,
  getChatRowName,
  groupInbox,
} from '../presentation';

const composeIcon = require('../../../../assets/compose-icon.png') as ImageSourcePropType;

export function ChatScreen() {
  const { session } = useSession();
  const currentUserId = session?.user.id ?? null;
  const { chats, loading, loaded, error, reload } = useChatList();
  const [query, setQuery] = useState('');
  const router = useRouter();

  // Returning from a conversation should reflect its new activity time and order.
  // The first focus is skipped because the hook already loads on mount, and the latest
  // reload is read through a ref so the focus callback stays stable.
  const reloadRef = useRef(reload);
  const hasFocusedRef = useRef(false);
  useEffect(() => {
    reloadRef.current = reload;
  });
  useFocusEffect(
    useCallback(() => {
      if (hasFocusedRef.current) void reloadRef.current();
      hasFocusedRef.current = true;
    }, []),
  );

  function openChat(chatId: string) {
    router.push({ pathname: '/conversation/[chatId]', params: { chatId } });
  }

  // Only the first load blocks the screen; later reloads keep showing the stale list
  // under the pull-to-refresh spinner.
  if (!loaded && loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!loaded && error) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <View style={styles.centered}>
          <Text accessibilityRole="alert" style={styles.errorText}>
            {error}
          </Text>
          <Pressable
            accessibilityLabel="Retry loading chats"
            accessibilityRole="button"
            onPress={() => void reload()}
            style={styles.retryButton}
          >
            <Text style={styles.retryLabel}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { channels, messages } = groupInbox(chats, query, currentUserId);
  const hasChats = chats.length > 0;
  const hasResults = channels.length > 0 || messages.length > 0;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            onRefresh={() => void reload()}
            refreshing={loaded && loading}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.header}>
          {/* Same width as the compose button, so the title stays centered. */}
          <View style={styles.headerSpacer} />
          <Text accessibilityRole="header" style={styles.title}>
            Chat
          </Text>
          <IconButton
            accessibilityLabel="New message"
            iconSource={composeIcon}
            onPress={() => router.push('/conversation/new')}
          />
        </View>

        {hasChats ? <ChatSearchBar onChangeText={setQuery} value={query} /> : null}
        {error ? (
          <Text accessibilityRole="alert" style={styles.errorText}>
            {error}
          </Text>
        ) : null}

        {!hasChats ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyBody}>
              Tap the compose button to message a classmate, or message a seller from Marketplace.
            </Text>
          </View>
        ) : null}

        {hasChats && !hasResults ? (
          <Text style={styles.emptyBody}>No chats match “{query.trim()}”.</Text>
        ) : null}

        {channels.length > 0 ? (
          <>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Channels
            </Text>
            <ScrollView contentContainerStyle={styles.channels} horizontal>
              {channels.map((chat) => (
                <ChannelItem
                  avatar={getChatAvatar(chat, currentUserId)}
                  key={chat.id}
                  name={getChatDisplayName(chat, currentUserId)}
                  onPress={() => openChat(chat.id)}
                />
              ))}
            </ScrollView>
          </>
        ) : null}

        {messages.length > 0 ? (
          <>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Messages
            </Text>
            <View style={styles.inbox}>
              {messages.map((chat) => (
                <ChatInboxRow
                  avatar={getChatAvatar(chat, currentUserId)}
                  key={chat.id}
                  name={getChatRowName(chat, currentUserId)}
                  onPress={() => openChat(chat.id)}
                  subtitle={getChatPreview(chat, currentUserId)}
                  timestamp={formatChatTimestamp(chat.lastMessage?.createdAt ?? chat.updatedAt)}
                  unreadCount={chat.unreadCount}
                  variant={chat.type === 'marketplace' ? 'marketplace' : 'person'}
                  imageUri={getChatListingImage(chat)}
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
