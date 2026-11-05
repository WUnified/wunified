import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { useCommunityComments, useCreateCommunityComment } from '../hooks';
import type { CommunityComment, CommunityPost, CreateCommunityCommentInput } from '../types';
import { CommunityBoardPostCard } from './CommunityBoardPostCard';

jest.mock('../hooks', () => ({
  useCommunityComments: jest.fn(),
  useCreateCommunityComment: jest.fn(),
}));

const reloadComments = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
const loadMoreComments = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
const submitComment = jest
  .fn<(input: CreateCommunityCommentInput) => Promise<CommunityComment | null>>()
  .mockResolvedValue(null);
const post: CommunityPost = {
  id: 'post-1',
  authorId: 'user-1',
  title: 'Campus market this weekend',
  body: 'Come see what is happening around campus.',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-01T12:00:00.000Z',
  author: null,
};
const comment: CommunityComment = {
  id: 'comment-1',
  postId: 'post-1',
  authorId: 'user-2',
  body: 'I will be there!',
  createdAt: '2026-10-01T12:30:00.000Z',
  updatedAt: '2026-10-01T12:30:00.000Z',
  author: null,
};
const createdComment: CommunityComment = {
  id: 'comment-2',
  postId: 'post-1',
  authorId: 'user-1',
  body: 'See you there.',
  createdAt: '2026-10-01T12:45:00.000Z',
  updatedAt: '2026-10-01T12:45:00.000Z',
  author: null,
};
let feedComments = [comment];

describe('CommunityBoardPostCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    feedComments = [comment];
    jest.mocked(useCommunityComments).mockImplementation((postId) => ({
      comments: postId ? feedComments : [],
      loading: false,
      loadingMore: false,
      hasMore: true,
      error: null,
      reload: reloadComments,
      loadMore: loadMoreComments,
    }));
    jest.mocked(useCreateCommunityComment).mockReturnValue({
      saving: false,
      success: false,
      error: null,
      submit: submitComment.mockResolvedValue(createdComment),
    });
  });

  it('keeps new comments visible without resetting pagination and deduplicates later pages', async () => {
    const { rerender } = render(<CommunityBoardPostCard post={post} />);

    fireEvent.press(screen.getByRole('button', { name: 'Show comments' }));
    expect(await screen.findByText('I will be there!')).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('Write a comment'), '  See you there.  ');
    fireEvent.press(screen.getByRole('button', { name: 'Send comment' }));

    await waitFor(() => {
      expect(submitComment).toHaveBeenCalledWith({
        postId: post.id,
        body: 'See you there.',
      });
    });
    expect(await screen.findByText('See you there.')).toBeTruthy();
    expect(reloadComments).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Load more comments' })).toBeTruthy();

    feedComments = [comment, createdComment];
    rerender(<CommunityBoardPostCard post={post} />);
    expect(screen.getAllByText('See you there.')).toHaveLength(1);

    fireEvent.press(screen.getByRole('button', { name: 'Load more comments' }));
    expect(loadMoreComments).toHaveBeenCalledTimes(1);
  });
});
