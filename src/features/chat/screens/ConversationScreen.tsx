import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from './ConversationScreen.styles';
import { IconButton } from '../../../components/IconButton';
import { Colors } from '../../../constants/colors';
import { useSession } from '../../auth';
import { ChatAvatar } from '../components/ChatAvatar';
import { MessageBubble } from '../components/MessageBubble';
import { MessageComposer } from '../components/MessageComposer';
import { useChatList, useChatMessages, useMarkChatRead, useSendChatMessage } from '../hooks';
import {
  formatChatTimestamp,
  getChatAvatar,
  getChatDisplayName,
  getChatSubtitle,
  mergeMessages,
} from '../presentation';
import type { ChatMessage } from '../types';

const backIcon = require('../../../../assets/back-icon.png') as ImageSourcePropType;

type ConversationScreenProps = {
  chatId: string;
};

export function ConversationScreen({ chatId }: ConversationScreenProps) {
  const router = useRouter();
  const { session } = useSession();
  const currentUserId = session?.user.id ?? null;
  // The list hook is the only source of chat details (title, participants) today.
  const { chats } = useChatList();
  const chat = chats.find((candidate) => candidate.id === chatId) ?? null;
  const { messages, loading, loadingOlder, hasMore, error, reload, loadOlder } =
    useChatMessages(chatId);
  const sendMessage = useSendChatMessage();
  const markRead = useMarkChatRead();
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState<ChatMessage[]>([]);

  const allMessages = mergeMessages(messages, sent);
  const latestLoadedId = messages.at(-1)?.id ?? null;

  // The mutation hooks return new objects every render, so the latest submit is read
  // through a ref instead of re-running the effect on every render.
  const markReadRef = useRef(markRead.submit);
  useEffect(() => {
    markReadRef.current = markRead.submit;
  });
  useEffect(() => {
    if (latestLoadedId) {
      void markReadRef.current({ chatId, messageId: latestLoadedId });
    }
  }, [chatId, latestLoadedId]);

  // A conversation opened from a link or notification has no screen underneath it,
  // so fall back to the inbox instead of leaving Back doing nothing.
  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/chat');
    }
  }

  async function handleSend() {
    const content = draft.trim();
    if (!content) return;
    const message = await sendMessage.submit({ chatId, content });
    // On failure the draft stays so the user can retry without retyping.
    if (message) {
      setSent((current) => [...current, message]);
      setDraft('');
    }
  }

  const title = chat ? getChatDisplayName(chat, currentUserId) : 'Chat';
  const showSenderNames = chat?.type === 'group' || chat?.type === 'club';
  const senderNames = new Map(
    chat?.participants.map((participant) => [participant.userId, participant.displayName]),
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <IconButton accessibilityLabel="Back" iconSource={backIcon} onPress={goBack} />
        <ChatAvatar name={title} size={36} uri={chat ? getChatAvatar(chat, currentUserId) : null} />
        <View style={styles.headerText}>
          <Text accessibilityRole="header" numberOfLines={1} style={styles.headerTitle}>
            {title}
          </Text>
          {chat ? (
            <Text numberOfLines={1} style={styles.headerSubtitle}>
              {getChatSubtitle(chat, currentUserId)}
            </Text>
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.body}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : error && allMessages.length === 0 ? (
          <View style={styles.centered}>
            <Text accessibilityRole="alert" style={styles.errorText}>
              {error}
            </Text>
            <Pressable
              accessibilityLabel="Retry loading messages"
              accessibilityRole="button"
              onPress={() => void reload()}
              style={styles.retryButton}
            >
              <Text style={styles.retryLabel}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          // Inverted so the newest message sits above the composer and older pages load
          // as the user scrolls up.
          <FlatList
            contentContainerStyle={styles.messages}
            data={[...allMessages].reverse()}
            inverted
            keyExtractor={(message) => message.id}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {chat?.type === 'marketplace'
                  ? 'Ask the seller about this listing.'
                  : 'No messages yet. Say hello!'}
              </Text>
            }
            ListFooterComponent={
              loadingOlder ? <ActivityIndicator color={Colors.primary} /> : undefined
            }
            onEndReached={hasMore ? () => void loadOlder() : undefined}
            renderItem={({ item }) => (
              <MessageBubble
                content={item.content}
                isDeleted={item.isDeleted}
                isMine={item.senderId === currentUserId}
                senderName={showSenderNames ? senderNames.get(item.senderId) : undefined}
                timestamp={formatChatTimestamp(item.createdAt)}
              />
            )}
          />
        )}

        {sendMessage.error ? (
          <Text accessibilityRole="alert" style={styles.sendError}>
            {sendMessage.error}
          </Text>
        ) : null}
        <MessageComposer
          onChangeText={setDraft}
          onSend={() => void handleSend()}
          sending={sendMessage.saving}
          value={draft}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
