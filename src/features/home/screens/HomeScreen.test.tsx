import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import {
  useCommunityComments,
  useCommunityPosts,
  useCreateCommunityComment,
  useCreateCommunityPost,
} from '../hooks';
import type {
  CommunityComment,
  CommunityPost,
  CreateCommunityCommentInput,
  CreateCommunityPostInput,
} from '../types';
import { HomeScreen } from './HomeScreen';

jest.mock('../hooks', () => ({
  useCommunityComments: jest.fn(),
  useCommunityPosts: jest.fn(),
  useCreateCommunityComment: jest.fn(),
  useCreateCommunityPost: jest.fn(),
}));

const loadMore = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
const reload = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
const submitPost = jest
  .fn<(input: CreateCommunityPostInput) => Promise<CommunityPost | null>>()
  .mockResolvedValue(null);
const post: CommunityPost = {
  id: 'post-1',
  authorId: 'user-1',
  title: 'Campus market this weekend',
  body: 'Come see what is happening around campus.',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-01T12:00:00.000Z',
  author: {
    userId: 'user-1',
    username: 'shockers',
    displayName: 'Shocker Student',
    avatar: null,
    wsuVerified: true,
  },
};

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useCommunityPosts).mockReturnValue({
      posts: [post],
      loading: false,
      loadingMore: false,
      hasMore: false,
      error: null,
      reload,
      loadMore,
    });
    jest.mocked(useCommunityComments).mockReturnValue({
      comments: [],
      loading: false,
      loadingMore: false,
      hasMore: false,
      error: null,
      reload: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      loadMore: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    });
    jest.mocked(useCreateCommunityComment).mockReturnValue({
      saving: false,
      success: false,
      error: null,
      submit: jest
        .fn<(input: CreateCommunityCommentInput) => Promise<CommunityComment | null>>()
        .mockResolvedValue(null),
    });
    jest.mocked(useCreateCommunityPost).mockReturnValue({
      saving: false,
      success: false,
      error: null,
      submit: submitPost.mockResolvedValue(post),
    });
  });

  it('renders the live community board feed', () => {
    render(<HomeScreen />);

    expect(screen.getByText('WUnified')).toBeTruthy();
    expect(screen.getByText(post.title)).toBeTruthy();
    expect(screen.getByText(post.body)).toBeTruthy();
    expect(screen.getByText('Shocker Student')).toBeTruthy();
  });

  it('shows loading and empty states without inventing board content', () => {
    jest.mocked(useCommunityPosts).mockReturnValue({
      posts: [],
      loading: true,
      loadingMore: false,
      hasMore: false,
      error: null,
      reload,
      loadMore,
    });

    const { rerender } = render(<HomeScreen />);
    expect(screen.getByText('Loading the community board…')).toBeTruthy();

    jest.mocked(useCommunityPosts).mockReturnValue({
      posts: [],
      loading: false,
      loadingMore: false,
      hasMore: false,
      error: null,
      reload,
      loadMore,
    });
    rerender(<HomeScreen />);

    expect(screen.getByText('The board is quiet for now')).toBeTruthy();
    fireEvent.press(screen.getByText('Create a post'));
    expect(screen.getByLabelText('Post title')).toBeTruthy();
  });

  it('requires both a title and message before submitting a post', () => {
    render(<HomeScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Create a post' }));
    fireEvent.changeText(screen.getByLabelText('Post message'), 'A board update');
    fireEvent.press(screen.getByRole('button', { name: 'Post' }));

    expect(screen.getByText('Add a title and message before posting.')).toBeTruthy();
    expect(submitPost).not.toHaveBeenCalled();
  });

  it('validates and publishes a new board post, then refreshes the feed', async () => {
    render(<HomeScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Create a post' }));
    fireEvent.changeText(screen.getByLabelText('Post title'), '  Campus meetup  ');
    fireEvent.changeText(screen.getByLabelText('Post message'), '  Meet by the RSC.  ');
    fireEvent.press(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() => {
      expect(submitPost).toHaveBeenCalledWith({
        title: 'Campus meetup',
        body: 'Meet by the RSC.',
      });
    });
    expect(reload).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('Post title')).toBeNull();
  });

  it('shows a feed error and retries the failed request', () => {
    jest.mocked(useCommunityPosts).mockReturnValue({
      posts: [],
      loading: false,
      loadingMore: false,
      hasMore: false,
      error: 'Network unavailable',
      reload,
      loadMore,
    });

    render(<HomeScreen />);

    expect(screen.getByText('Network unavailable')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
