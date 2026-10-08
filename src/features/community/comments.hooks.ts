import { useEffect, useRef, useState } from 'react';

import { loadCommunityComments } from './api';
import type { CommunityComment } from './types';

// Comment pages are fetched only for the expanded post, not bundled into the
// feed. Keying results by post ID prevents a previous thread flashing while a
// newly selected post is loading.
export function useCommunityComments(postId: string | null) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [commentsForPostId, setCommentsForPostId] = useState<string | null>(null);
  const [errorForPostId, setErrorForPostId] = useState<string | null>(null);
  const [loadingMoreForPostId, setLoadingMoreForPostId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextPageRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);
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
    if (!postId) return;
    // A newer reload or post selection invalidates this response.
    const requestId = ++requestIdRef.current;
    setCommentsForPostId(null);
    setErrorForPostId(null);
    setLoadingMoreForPostId(null);
    loadingMoreRef.current = false;
    setError(null);

    try {
      const result = await loadCommunityComments(postId, { page: 0 });
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setComments(result.items);
      setCommentsForPostId(postId);
      setHasMore(result.hasMore);
      nextPageRef.current = result.nextPage;
    } catch (loadError: unknown) {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load comments.');
        setErrorForPostId(postId);
      }
    }
  }

  async function loadMore() {
    if (
      !postId ||
      commentsForPostId !== postId ||
      nextPageRef.current === null ||
      loadingMoreRef.current
    ) {
      return;
    }

    const requestId = ++requestIdRef.current;
    const page = nextPageRef.current;
    loadingMoreRef.current = true;
    setLoadingMoreForPostId(postId);
    setError(null);

    try {
      const result = await loadCommunityComments(postId, { page });
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setComments((current) => {
        const existingIds = new Set(current.map((comment) => comment.id));
        return [...current, ...result.items.filter((comment) => !existingIds.has(comment.id))];
      });
      setCommentsForPostId(postId);
      setHasMore(result.hasMore);
      nextPageRef.current = result.nextPage;
    } catch (loadError: unknown) {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load more comments.');
        setErrorForPostId(postId);
      }
    } finally {
      loadingMoreRef.current = false;
      if (mountedRef.current && requestId === requestIdRef.current) setLoadingMoreForPostId(null);
    }
  }

  useEffect(() => {
    if (!postId) {
      nextPageRef.current = null;
      return;
    }

    // Ignore responses from a thread that was collapsed or replaced mid-request.
    let isActive = true;
    const requestId = ++requestIdRef.current;
    nextPageRef.current = null;
    loadingMoreRef.current = false;

    void loadCommunityComments(postId, { page: 0 })
      .then((result) => {
        if (!isActive || requestId !== requestIdRef.current) return;
        setComments(result.items);
        setCommentsForPostId(postId);
        setError(null);
        setErrorForPostId(null);
        setHasMore(result.hasMore);
        nextPageRef.current = result.nextPage;
      })
      .catch((loadError: unknown) => {
        if (isActive && requestId === requestIdRef.current) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load comments.');
          setErrorForPostId(postId);
        }
      });

    return () => {
      isActive = false;
      if (requestId === requestIdRef.current) requestIdRef.current += 1;
    };
  }, [postId]);

  return {
    comments: commentsForPostId === postId ? comments : [],
    loading: Boolean(postId && commentsForPostId !== postId && errorForPostId !== postId),
    loadingMore: loadingMoreForPostId === postId,
    hasMore: commentsForPostId === postId && hasMore,
    error: errorForPostId === postId ? error : null,
    reload,
    loadMore,
  };
}
