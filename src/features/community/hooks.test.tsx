import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  createCommunityComment,
  createCommunityPost,
  loadCommunityComments,
  loadCommunityPosts,
} from './api';
import { useCommunityComments, useCommunityPosts, useCreateCommunityPost } from './hooks';
import type { CommunityComment, CommunityPage, CommunityPost } from './types';

jest.mock('./api', () => ({
  createCommunityComment: jest.fn(),
  createCommunityPost: jest.fn(),
  loadCommunityComments: jest.fn(),
  loadCommunityPosts: jest.fn(),
}));

const loadPosts = jest.mocked(loadCommunityPosts);
const loadComments = jest.mocked(loadCommunityComments);
const createPost = jest.mocked(createCommunityPost);

const post = (id: string): CommunityPost => ({
  id,
  authorId: 'user-1',
  title: `Post ${id}`,
  body: `Body ${id}`,
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-01T12:00:00.000Z',
  author: null,
});

const comment = (id: string, postId: string): CommunityComment => ({
  id,
  postId,
  authorId: 'user-1',
  body: `Comment ${id}`,
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-01T12:00:00.000Z',
  author: null,
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function page<T>(items: T[], nextPage: number | null): CommunityPage<T> {
  return { items, hasMore: nextPage !== null, nextPage };
}

describe('community hooks concurrency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not start feed pagination while a reload owns the feed', async () => {
    loadPosts.mockResolvedValueOnce(page([post('initial')], 1));
    const refresh = deferred<CommunityPage<CommunityPost>>();
    loadPosts.mockReturnValueOnce(refresh.promise);

    const { result } = renderHook(() => useCommunityPosts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      void result.current.reload();
    });
    await act(async () => result.current.loadMore());

    expect(loadPosts).toHaveBeenCalledTimes(2);
    expect(result.current.loading).toBe(true);

    await act(async () => {
      refresh.resolve(page([post('refreshed')], 2));
      await refresh.promise;
    });

    expect(result.current.posts).toEqual([post('refreshed')]);
    expect(result.current.loading).toBe(false);
  });

  it('does not let stale feed pagination release a newer page request', async () => {
    loadPosts.mockResolvedValueOnce(page([post('initial')], 1));
    const stalePage = deferred<CommunityPage<CommunityPost>>();
    const refresh = deferred<CommunityPage<CommunityPost>>();
    const currentPage = deferred<CommunityPage<CommunityPost>>();
    loadPosts
      .mockReturnValueOnce(stalePage.promise)
      .mockReturnValueOnce(refresh.promise)
      .mockReturnValueOnce(currentPage.promise);

    const { result } = renderHook(() => useCommunityPosts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      void result.current.loadMore();
      void result.current.reload();
    });
    await act(async () => {
      refresh.resolve(page([post('refreshed')], 2));
      await refresh.promise;
    });

    act(() => {
      void result.current.loadMore();
    });
    expect(result.current.loadingMore).toBe(true);

    await act(async () => {
      stalePage.resolve(page([post('stale')], 2));
      await stalePage.promise;
    });
    await act(async () => result.current.loadMore());

    expect(loadPosts).toHaveBeenCalledTimes(4);
    expect(result.current.loadingMore).toBe(true);

    await act(async () => {
      currentPage.resolve(page([post('current')], null));
      await currentPage.promise;
    });

    expect(result.current.posts).toEqual([post('refreshed'), post('current')]);
    expect(result.current.loadingMore).toBe(false);
  });

  it('keeps the active comment page locked when an old post request finishes', async () => {
    const stalePage = deferred<CommunityPage<CommunityComment>>();
    const currentPage = deferred<CommunityPage<CommunityComment>>();
    loadComments.mockResolvedValue(page([], null));
    loadComments
      .mockResolvedValueOnce(page([comment('first', 'post-1')], 1))
      .mockReturnValueOnce(stalePage.promise)
      .mockResolvedValueOnce(page([comment('second', 'post-2')], 1))
      .mockReturnValueOnce(currentPage.promise);

    const { result, rerender } = renderHook(
      ({ postId }: { postId: string | null }) => useCommunityComments(postId),
      { initialProps: { postId: 'post-1' } },
    );
    await waitFor(() => expect(result.current.comments).toEqual([comment('first', 'post-1')]));

    act(() => {
      void result.current.loadMore();
    });
    rerender({ postId: 'post-2' });
    await waitFor(() => expect(result.current.comments).toEqual([comment('second', 'post-2')]));

    act(() => {
      void result.current.loadMore();
    });
    expect(result.current.loadingMore).toBe(true);

    await act(async () => {
      stalePage.resolve(page([comment('stale', 'post-1')], null));
      await stalePage.promise;
    });
    await act(async () => result.current.loadMore());

    expect(loadComments).toHaveBeenCalledTimes(4);
    expect(result.current.loadingMore).toBe(true);

    rerender({ postId: null });
    expect(result.current.comments).toEqual([]);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.loadingMore).toBe(false);

    rerender({ postId: 'post-2' });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.comments).toEqual([]);
    expect(result.current.loadingMore).toBe(false);

    await act(async () => {
      currentPage.resolve(page([comment('stale', 'post-2')], null));
      await currentPage.promise;
    });
    expect(result.current.comments).toEqual([]);
    expect(result.current.loadingMore).toBe(false);
  });

  it('ignores duplicate mutation submissions while the first save is pending', async () => {
    const pendingCreate = deferred<CommunityPost>();
    createPost.mockReturnValueOnce(pendingCreate.promise);
    const input = { title: 'Campus swap', body: 'Anyone interested?' };
    const { result } = renderHook(() => useCreateCommunityPost());
    let firstSubmit: Promise<CommunityPost | null>;

    act(() => {
      firstSubmit = result.current.submit(input);
    });
    await expect(result.current.submit(input)).resolves.toBeNull();

    expect(createCommunityComment).not.toHaveBeenCalled();
    expect(createPost).toHaveBeenCalledTimes(1);
    expect(result.current.saving).toBe(true);

    await act(async () => {
      pendingCreate.resolve(post('created'));
      await firstSubmit;
    });

    expect(result.current.success).toBe(true);
    expect(result.current.saving).toBe(false);
  });
});
