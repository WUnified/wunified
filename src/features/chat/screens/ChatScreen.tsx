import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from './ChatScreen.styles';
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
  getChatSubtitle,
  groupInbox,
} from '../presentation';

export function ChatScreen() {
  const { session } = useSession();
  const currentUserId = session?.user.id ?? null;
  const { chats, loading, loaded, error, reload } = useChatList();
  const [query, setQuery] = useState('');

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
        <Text accessibilityRole="header" style={styles.title}>
          Chat
        </Text>

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
              Message a seller from Marketplace to start your first chat.
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
                  name={getChatDisplayName(chat, currentUserId)}
                  subtitle={getChatSubtitle(chat, currentUserId)}
                  timestamp={formatChatTimestamp(chat.updatedAt)}
                  variant={chat.type === 'marketplace' ? 'marketplace' : 'person'}
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
