import { useEffect, useRef, useState } from 'react';

import { createCommunityComment, createCommunityPost, loadCommunityPosts } from './api';
import type {
  CommunityComment,
  CommunityPost,
  CreateCommunityCommentInput,
  CreateCommunityPostInput,
} from './types';

// Owns feed state and offset-page progression. Request IDs prevent an older
// reload from overwriting a newer page load; duplicate IDs are filtered when
// pages are appended because offset pages can overlap as new posts arrive.
export function useCommunityPosts() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextPageRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);
  const reloadRequestIdRef = useRef<number | null>(null);
  const loadMoreRequestIdRef = useRef<number | null>(null);
  const reloadingRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  async function reload() {
    const requestId = ++requestIdRef.current;
    reloadRequestIdRef.current = requestId;
    reloadingRef.current = true;
    nextPageRef.current = null;
    loadMoreRequestIdRef.current = null;
    loadingMoreRef.current = false;
    setLoading(true);
    setLoadingMore(false);
    setHasMore(false);
    setError(null);

    try {
      const result = await loadCommunityPosts({ page: 0 });
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setPosts(result.items);
      setHasMore(result.hasMore);
      nextPageRef.current = result.nextPage;
    } catch (loadError: unknown) {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setError(
          loadError instanceof Error ? loadError.message : 'Unable to load community posts.',
        );
      }
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) setLoading(false);
      if (reloadRequestIdRef.current === requestId) {
        reloadRequestIdRef.current = null;
        reloadingRef.current = false;
      }
    }
  }

  async function loadMore() {
    const page = nextPageRef.current;
    if (page === null || reloadingRef.current || loadingMoreRef.current) return;

    loadingMoreRef.current = true;
    const requestId = ++requestIdRef.current;
    loadMoreRequestIdRef.current = requestId;
    setLoadingMore(true);
    setError(null);

    try {
      const result = await loadCommunityPosts({ page });
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setPosts((current) => {
        const existingIds = new Set(current.map((post) => post.id));
        return [...current, ...result.items.filter((post) => !existingIds.has(post.id))];
      });
      setHasMore(result.hasMore);
      nextPageRef.current = result.nextPage;
    } catch (loadError: unknown) {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load more posts.');
      }
    } finally {
      if (loadMoreRequestIdRef.current === requestId) {
        loadingMoreRef.current = false;
        loadMoreRequestIdRef.current = null;
        if (mountedRef.current && requestId === requestIdRef.current) setLoadingMore(false);
      }
    }
  }

  useEffect(() => {
    let isActive = true;
    const requestId = ++requestIdRef.current;

    // Initial loading is isolated from the user-triggered reload callback so
    // effect cleanup can invalidate only the request it started.
    void loadCommunityPosts({ page: 0 })
      .then((result) => {
        if (!isActive || requestId !== requestIdRef.current) return;
        setPosts(result.items);
        setHasMore(result.hasMore);
        nextPageRef.current = result.nextPage;
      })
      .catch((loadError: unknown) => {
        if (isActive && requestId === requestIdRef.current) {
          setError(
            loadError instanceof Error ? loadError.message : 'Unable to load community posts.',
          );
        }
      })
      .finally(() => {
        if (isActive && requestId === requestIdRef.current) setLoading(false);
      });

    return () => {
      isActive = false;
      if (requestId === requestIdRef.current) requestIdRef.current += 1;
    };
  }, []);

  return { posts, loading, loadingMore, hasMore, error, reload, loadMore };
}

function useCommunityMutation<TInput, TResult>(operation: (input: TInput) => Promise<TResult>) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Mutations return null on failure so screens can keep their form values and
  // render the hook's error without catching errors at every call site.
  async function submit(input: TInput): Promise<TResult | null> {
    if (savingRef.current) return null;

    savingRef.current = true;
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const result = await operation(input);
      if (mountedRef.current) setSuccess(true);
      return result;
    } catch (mutationError: unknown) {
      if (mountedRef.current) {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : 'Unable to save community content.',
        );
      }
      return null;
    } finally {
      savingRef.current = false;
      if (mountedRef.current) setSaving(false);
    }
  }

  return { saving, success, error, submit };
}

export function useCreateCommunityPost() {
  return useCommunityMutation<CreateCommunityPostInput, CommunityPost>(createCommunityPost);
}

export function useCreateCommunityComment() {
  return useCommunityMutation<CreateCommunityCommentInput, CommunityComment>(
    createCommunityComment,
  );
}

export { useCommunityComments } from './comments.hooks';
