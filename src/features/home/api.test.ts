import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { createCommunityComment, createCommunityPost, loadCommunityPosts } from './api';
import type { CommunityComment, CommunityPost } from './types';
import { boardPostsRepository } from '../../lib/db';

jest.mock('../../lib/db', () => ({
  boardPostsRepository: {
    listPosts: jest.fn(),
    listComments: jest.fn(),
    createPost: jest.fn(),
    createComment: jest.fn(),
  },
}));

const repository = jest.mocked(boardPostsRepository);

const post: CommunityPost = {
  id: 'post-1',
  authorId: 'user-1',
  title: 'Campus swap',
  body: 'Anyone interested?',
  images: [],
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-01T12:00:00.000Z',
  author: {
    userId: 'user-1',
    username: 'shockers',
    displayName: 'Shocker',
    avatar: null,
    wsuVerified: true,
  },
};

const comment: CommunityComment = {
  id: 'comment-1',
  postId: 'post-1',
  authorId: 'user-2',
  body: 'I am interested.',
  createdAt: '2026-10-01T12:30:00.000Z',
  updatedAt: '2026-10-01T12:30:00.000Z',
  author: null,
};

describe('community API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a post without accepting author identity from the feature input', async () => {
    repository.createPost.mockResolvedValue(post);

    await expect(
      createCommunityPost({ title: 'Campus swap', body: 'Anyone interested?' }),
    ).resolves.toBe(post);
    expect(repository.createPost.mock.calls).toEqual([
      [{ title: 'Campus swap', body: 'Anyone interested?' }],
    ]);
  });

  it('maps the comment post ID to the database contract', async () => {
    repository.createComment.mockResolvedValue(comment);

    await expect(
      createCommunityComment({ postId: 'post-1', body: 'I am interested.' }),
    ).resolves.toBe(comment);
    expect(repository.createComment.mock.calls).toEqual([
      [{ post_id: 'post-1', body: 'I am interested.' }],
    ]);
  });

  it('adds feature context to query errors', async () => {
    repository.listPosts.mockRejectedValue(new Error('network unavailable'));

    await expect(loadCommunityPosts()).rejects.toThrow(
      'Failed to load community posts: network unavailable',
    );
  });
});
