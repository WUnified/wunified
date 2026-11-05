import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

type MessageBubbleProps = {
  content: string | null;
  isDeleted: boolean;
  isMine: boolean;
  senderName?: string;
  timestamp: string;
};

export function MessageBubble({
  content,
  isDeleted,
  isMine,
  senderName,
  timestamp,
}: MessageBubbleProps) {
  const body = isDeleted ? 'Message deleted' : (content ?? '');

  return (
    <View
      accessible
      accessibilityLabel={`${isMine ? 'You' : (senderName ?? 'Them')}: ${body}, ${timestamp}`}
      style={[styles.container, isMine ? styles.mine : styles.theirs]}
    >
      {senderName && !isMine ? <Text style={styles.sender}>{senderName}</Text> : null}
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text
          style={[
            styles.body,
            isMine ? styles.bodyMine : styles.bodyTheirs,
            isDeleted && styles.bodyDeleted,
          ]}
        >
          {body}
        </Text>
      </View>
      <Text style={styles.timestamp}>{timestamp}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    ...Typography.body,
  },
  bodyDeleted: {
    color: Colors.textDim,
    fontStyle: 'italic',
  },
  bodyMine: {
    color: Colors.onPrimary,
  },
  bodyTheirs: {
    color: Colors.text,
  },
  bubble: {
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  // A squared corner on the sender's side shows who a bubble belongs to.
  bubbleMine: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Radius.sm / 2,
  },
  bubbleTheirs: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: Radius.sm / 2,
  },
  container: {
    gap: 4,
    maxWidth: '80%',
  },
  mine: {
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
  },
  sender: {
    ...Typography.caption,
    color: Colors.textDim,
  },
  theirs: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
  },
  timestamp: {
    ...Typography.caption,
    color: Colors.textDim,
  },
});
