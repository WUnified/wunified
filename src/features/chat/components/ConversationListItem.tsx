import { StyleSheet, Text, View } from 'react-native';

import { ChatAvatar } from './ChatAvatar';
import { MessageBubble } from './MessageBubble';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { formatMessageTime } from '../presentation';
import type { ConversationItem } from '../presentation';

export type MessageSender = { name: string; avatarUri: string | null };

type ConversationListItemProps = {
  currentUserId: string | null;
  item: ConversationItem;
  onOpenMedia: (url: string) => void;
  // Group and club chats show each burst's sender (name and photo); direct chats don't
  // need to, since there is only one other person.
  senderFor?: (senderId: string) => MessageSender | undefined;
};

const SENDER_AVATAR_SIZE = 28;
// The time sits under the last bubble of a burst (caption line height plus the bubble's
// gap), so the photo is raised by that much to line up with the bubble itself.
const TIMESTAMP_OFFSET = 22;

export function ConversationListItem({
  currentUserId,
  item,
  onOpenMedia,
  senderFor,
}: ConversationListItemProps) {
  if (item.kind === 'day') {
    return (
      <Text accessibilityRole="header" style={styles.day}>
        {item.label}
      </Text>
    );
  }

  const { message, startsGroup, endsGroup } = item;
  const isMine = message.senderId === currentUserId;
  const sender = senderFor?.(message.senderId);
  const bubble = (
    <MessageBubble
      content={message.content}
      isDeleted={message.isDeleted}
      isMine={isMine}
      media={message.media}
      onOpenMedia={onOpenMedia}
      senderName={startsGroup ? sender?.name : undefined}
      timestamp={endsGroup ? formatMessageTime(message.createdAt) : undefined}
    />
  );

  return (
    // Tight spacing inside a burst, more between bursts, so bursts read as one thought.
    <View style={{ paddingBottom: endsGroup ? 8 : 2, paddingTop: startsGroup ? 8 : 2 }}>
      {sender && !isMine ? (
        // Like Messenger: the photo marks the end of someone's burst, and the empty slot
        // keeps the rest of their bubbles aligned with it.
        <View style={styles.theirRow}>
          <View style={[styles.avatarSlot, endsGroup && { marginBottom: TIMESTAMP_OFFSET }]}>
            {endsGroup ? (
              <ChatAvatar name={sender.name} size={SENDER_AVATAR_SIZE} uri={sender.avatarUri} />
            ) : null}
          </View>
          <View style={styles.bubbleColumn}>{bubble}</View>
        </View>
      ) : (
        bubble
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarSlot: {
    width: SENDER_AVATAR_SIZE,
  },
  bubbleColumn: {
    flex: 1,
  },
  day: {
    ...Typography.caption,
    color: Colors.textDim,
    paddingVertical: 12,
    textAlign: 'center',
  },
  theirRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
});
