import { StyleSheet, Text, View } from 'react-native';

import { MessageBubble } from './MessageBubble';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { formatMessageTime } from '../presentation';
import type { ConversationItem } from '../presentation';

type ConversationListItemProps = {
  currentUserId: string | null;
  item: ConversationItem;
  onOpenMedia: (url: string) => void;
  // Group and club chats name each burst's sender; direct chats do not need to.
  senderNameFor?: (senderId: string) => string | undefined;
};

export function ConversationListItem({
  currentUserId,
  item,
  onOpenMedia,
  senderNameFor,
}: ConversationListItemProps) {
  if (item.kind === 'day') {
    return (
      <Text accessibilityRole="header" style={styles.day}>
        {item.label}
      </Text>
    );
  }

  const { message, startsGroup, endsGroup } = item;
  return (
    // Tight spacing inside a burst, more between bursts, so bursts read as one thought.
    <View style={{ paddingBottom: endsGroup ? 8 : 2, paddingTop: startsGroup ? 8 : 2 }}>
      <MessageBubble
        content={message.content}
        isDeleted={message.isDeleted}
        isMine={message.senderId === currentUserId}
        media={message.media}
        onOpenMedia={onOpenMedia}
        senderName={startsGroup ? senderNameFor?.(message.senderId) : undefined}
        timestamp={endsGroup ? formatMessageTime(message.createdAt) : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  day: {
    ...Typography.caption,
    color: Colors.textDim,
    paddingVertical: 12,
    textAlign: 'center',
  },
});
