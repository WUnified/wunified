import { useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';

import { Colors } from '../../../constants/colors';
import { storageRepository } from '../../../lib/db';
import { useCommunityComments, useCreateCommunityComment } from '../hooks';
import type { CommunityComment, CommunityPost } from '../types';
import { styles } from './CommunityBoardPostCard.styles';

interface CommunityBoardPostCardProps {
  post: CommunityPost;
}

export function CommunityBoardPostCard({ post }: CommunityBoardPostCardProps) {
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [createdComments, setCreatedComments] = useState<CommunityComment[]>([]);
  const commentsFeed = useCommunityComments(commentsVisible ? post.id : null);
  const createComment = useCreateCommunityComment();
  const visibleComments = mergeComments(
    commentsFeed.comments,
    createdComments.filter((comment) => comment.postId === post.id),
  );
  const authorName = post.author?.displayName || post.author?.username || 'Community member';
  const authorMeta = [
    post.author?.username ? `@${post.author.username}` : null,
    formatPostTime(post.createdAt),
  ]
    .filter(Boolean)
    .join(' · ');
  const initials = authorName.charAt(0).toUpperCase();

  async function handleCreateComment() {
    const body = commentBody.trim();
    if (!body) return;

    const createdComment = await createComment.submit({ postId: post.id, body });
    if (!createdComment) return;

    setCommentBody('');
    setCreatedComments((current) =>
      current.some((comment) => comment.id === createdComment.id)
        ? current
        : [...current, createdComment],
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.authorRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{initials}</Text>
          {post.author?.avatar ? (
            <Image
              source={{
                uri: storageRepository.resolvePublicUrl('avatars', post.author.avatar) ?? undefined,
              }}
              style={styles.avatarImage}
            />
          ) : null}
        </View>
        <View style={styles.authorDetails}>
          <View style={styles.authorNameRow}>
            <Text numberOfLines={1} style={styles.authorName}>
              {authorName}
            </Text>
            {post.author?.wsuVerified ? <Text style={styles.verified}>✓</Text> : null}
          </View>
          <Text style={styles.postTime}>{authorMeta}</Text>
        </View>
      </View>

      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.body}>{post.body}</Text>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={commentsVisible ? 'Hide comments' : 'Show comments'}
          accessibilityRole="button"
          onPress={() => setCommentsVisible((visible) => !visible)}
          style={({ pressed }) => [styles.commentAction, pressed && styles.pressed]}
        >
          <Text style={styles.commentIcon}>◯</Text>
          <Text style={styles.commentActionText}>Comments</Text>
        </Pressable>
      </View>

      {commentsVisible ? (
        <View style={styles.commentsSection}>
          {commentsFeed.loading ? (
            <Text style={styles.commentState}>Loading comments…</Text>
          ) : commentsFeed.error ? (
            <View>
              <Text style={styles.commentError}>{commentsFeed.error}</Text>
              <Pressable accessibilityRole="button" onPress={() => void commentsFeed.reload()}>
                <Text style={styles.commentLink}>Try again</Text>
              </Pressable>
            </View>
          ) : visibleComments.length ? (
            visibleComments.map((comment) => <CommentRow comment={comment} key={comment.id} />)
          ) : (
            <Text style={styles.commentState}>No comments yet.</Text>
          )}
          {commentsFeed.hasMore ? (
            <Pressable
              accessibilityRole="button"
              disabled={commentsFeed.loadingMore}
              onPress={() => void commentsFeed.loadMore()}
            >
              <Text style={styles.commentLink}>
                {commentsFeed.loadingMore ? 'Loading…' : 'Load more comments'}
              </Text>
            </Pressable>
          ) : null}

          <View style={styles.commentComposer}>
            <TextInput
              accessibilityLabel="Write a comment"
              editable={!createComment.saving}
              onChangeText={setCommentBody}
              onSubmitEditing={() => void handleCreateComment()}
              placeholder="Write a comment…"
              placeholderTextColor={Colors.textDim}
              returnKeyType="send"
              style={styles.commentInput}
              value={commentBody}
            />
            <Pressable
              accessibilityLabel="Send comment"
              accessibilityRole="button"
              disabled={createComment.saving || !commentBody.trim()}
              onPress={() => void handleCreateComment()}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Text style={styles.commentLink}>{createComment.saving ? 'Sending…' : 'Send'}</Text>
            </Pressable>
          </View>
          {createComment.error ? (
            <Text accessibilityRole="alert" style={styles.commentError}>
              {createComment.error}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function mergeComments(
  loadedComments: CommunityComment[],
  createdComments: CommunityComment[],
): CommunityComment[] {
  const seenIds = new Set<string>();
  return [...loadedComments, ...createdComments].filter((comment) => {
    if (seenIds.has(comment.id)) return false;
    seenIds.add(comment.id);
    return true;
  });
}

function CommentRow({ comment }: { comment: CommunityComment }) {
  const author = comment.author?.displayName || comment.author?.username || 'Community member';

  return (
    <View style={styles.commentRow}>
      <Text style={styles.commentAuthor}>{author}</Text>
      <Text style={styles.commentBody}>{comment.body}</Text>
    </View>
  );
}

function formatPostTime(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return '';

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(timestamp);
}
