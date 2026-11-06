import { StyleSheet, Text, View } from 'react-native';

import { ChatMediaImage } from './ChatMediaImage';
import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import type { ChatMediaItem } from '../types';

type MessageBubbleProps = {
  content: string | null;
  isDeleted: boolean;
  isMine: boolean;
  media?: readonly ChatMediaItem[] | null;
  onOpenMedia?: (url: string) => void;
  senderName?: string;
  timestamp: string;
};

// One photo shows large; several share a two-column grid.
const SINGLE_PHOTO_SIZE = 220;
const GRID_PHOTO_SIZE = 120;

export function MessageBubble({
  content,
  isDeleted,
  isMine,
  media,
  onOpenMedia,
  senderName,
  timestamp,
}: MessageBubbleProps) {
  const body = isDeleted ? 'Message deleted' : (content?.trim() ?? '');
  // Deleted messages arrive with media cleared, but guard here too.
  const photos = isDeleted ? [] : (media ?? []);
  const photoSize = photos.length === 1 ? SINGLE_PHOTO_SIZE : GRID_PHOTO_SIZE;
  const photoSummary = photos.length
    ? `${photos.length === 1 ? 'a photo' : `${photos.length} photos`}${body ? ', ' : ''}`
    : '';

  return (
    <View
      accessible
      accessibilityLabel={`${isMine ? 'You' : (senderName ?? 'Them')}: ${photoSummary}${body}, ${timestamp}`}
      style={[styles.container, isMine ? styles.mine : styles.theirs]}
    >
      {senderName && !isMine ? <Text style={styles.sender}>{senderName}</Text> : null}
      {photos.length > 0 ? (
        <View style={[styles.photos, isMine && styles.photosMine]}>
          {photos.map((photo, index) => (
            <ChatMediaImage
              accessibilityLabel={`Photo ${index + 1} of ${photos.length}`}
              key={photo.path}
              onOpen={(url) => onOpenMedia?.(url)}
              path={photo.path}
              size={photoSize}
            />
          ))}
        </View>
      ) : null}
      {body ? (
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
      ) : null}
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
  photos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    // Two grid photos plus the gap.
    maxWidth: GRID_PHOTO_SIZE * 2 + 4,
  },
  photosMine: {
    justifyContent: 'flex-end',
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
