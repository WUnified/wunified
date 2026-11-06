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
import { useMessageAttachments } from '../attachments.hooks';
import { ChatAvatar } from '../components/ChatAvatar';
import { ChatListingCard } from '../components/ChatListingCard';
import { ChatMediaViewer } from '../components/ChatMediaViewer';
import { ConversationListItem } from '../components/ConversationListItem';
import { MessageComposer } from '../components/MessageComposer';
import {
  useChatList,
  useChatMessages,
  useMarkChatRead,
  useSendChatMessage,
  useSendChatMessageWithImages,
} from '../hooks';
import { useChatListing } from '../listing.hooks';
import { useMessagePolling } from '../messagePolling.hooks';
import {
  buildConversationItems,
  getChatAvatar,
  getChatDisplayName,
  getChatSubtitle,
  getUserAvatarUrl,
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
  // A failed or missing listing just hides the card; the conversation still works.
  const { listing } = useChatListing(chat?.type === 'marketplace' ? chat.listingId : null);
  const { messages, loading, loadingOlder, hasMore, error, liveConnected, reload, loadOlder } =
    useChatMessages(chatId);
  const sendMessage = useSendChatMessage();
  const sendWithPhotos = useSendChatMessageWithImages();
  const markRead = useMarkChatRead();
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState<ChatMessage[]>([]);
  const photos = useMessageAttachments();
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const sending = sendMessage.saving || sendWithPhotos.saving;

  // Newest page from the polling fallback, which runs only while Realtime isn't
  // connected. mergeMessages keeps the last copy of each ID, so the fresher source goes
  // last: polled copies while polling, live copies once Realtime is up. Polled messages
  // are kept either way in case one arrived just before the connection came up.
  const [polled, setPolled] = useState<ChatMessage[]>([]);
  useMessagePolling(chatId, setPolled, !liveConnected);
  const allMessages = mergeMessages(
    liveConnected ? [...polled, ...messages] : [...messages, ...polled],
    sent,
  );
  // Mark the newest message read, including replies that arrived while the chat was open.
  const latestLoadedId = allMessages.at(-1)?.id ?? null;

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
    if (!content && photos.attachments.length === 0) return;
    const message =
      photos.attachments.length > 0
        ? await sendWithPhotos.submit({
            message: { chatId, content: content || null },
            images: photos.toUploads(),
          })
        : await sendMessage.submit({ chatId, content });
    // On failure the draft and photos stay so the user can retry without redoing them.
    if (message) {
      setSent((current) => [...current, message]);
      setDraft('');
      photos.clear();
    }
  }

  const sendError = photos.error ?? sendWithPhotos.error ?? sendMessage.error;

  const title = chat ? getChatDisplayName(chat, currentUserId) : 'Chat';
  const showSenders = chat?.type === 'group' || chat?.type === 'club';
  const senders = new Map(
    chat?.participants.map((participant) => [
      participant.userId,
      { name: participant.displayName, avatarUri: getUserAvatarUrl(participant.avatar) },
    ]),
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
      {listing ? (
        <ChatListingCard
          listing={listing}
          onPress={() => router.navigate({ pathname: '/', params: { listingId: listing.id } })}
        />
      ) : null}

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
            data={buildConversationItems(allMessages).reverse()}
            inverted
            keyExtractor={(item) => item.key}
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
              <ConversationListItem
                currentUserId={currentUserId}
                item={item}
                onOpenMedia={setViewerUrl}
                senderFor={showSenders ? (id) => senders.get(id) : undefined}
              />
            )}
          />
        )}

        {sendError ? (
          <Text accessibilityRole="alert" style={styles.sendError}>
            {sendError}
          </Text>
        ) : null}
        <MessageComposer
          attachments={photos.attachments}
          canAddPhoto={photos.canAdd}
          onAddPhoto={() => void photos.add()}
          onChangeText={setDraft}
          onRemoveAttachment={photos.remove}
          onSend={() => void handleSend()}
          sending={sending}
          value={draft}
        />
      </KeyboardAvoidingView>
      <ChatMediaViewer onClose={() => setViewerUrl(null)} url={viewerUrl} />
    </SafeAreaView>
  );
}
