import { useEffect, useState } from 'react';

import { loadChatMediaUrl } from './api';

// Chat photos are private, so each is shown through a signed link that lasts an hour
// (SIGNED_URL_TTL_SECONDS in storage.ts). Links are cached for 50 minutes so a re-render
// or scroll reuses one instead of asking the server again, while still refreshing it
// well before it expires.
export const CHAT_MEDIA_URL_CACHE_MS = 50 * 60 * 1000;

const cache = new Map<string, { url: string; expiresAt: number }>();
// Several bubbles can show the same photo at once; they share one request.
const inFlight = new Map<string, Promise<string>>();

export function getCachedChatMediaUrl(path: string, now = Date.now()): string | null {
  const entry = cache.get(path);
  return entry && entry.expiresAt > now ? entry.url : null;
}

export function resolveChatMediaUrl(path: string, now = Date.now()): Promise<string> {
  const cached = getCachedChatMediaUrl(path, now);
  if (cached) return Promise.resolve(cached);

  const pending = inFlight.get(path);
  if (pending) return pending;

  const request = loadChatMediaUrl(path)
    .then((url) => {
      cache.set(path, { url, expiresAt: Date.now() + CHAT_MEDIA_URL_CACHE_MS });
      return url;
    })
    .finally(() => inFlight.delete(path));
  inFlight.set(path, request);
  return request;
}

// Test-only: the cache is module-level, so tests reset it between cases.
export function clearChatMediaUrlCache(): void {
  cache.clear();
  inFlight.clear();
}

type MediaUrlState = { path: string; url: string | null; failed: boolean };

export function useChatMediaUrl(path: string) {
  const [state, setState] = useState<MediaUrlState>({ path: '', url: null, failed: false });
  const cached = getCachedChatMediaUrl(path);

  useEffect(() => {
    if (getCachedChatMediaUrl(path)) return;
    let active = true;
    resolveChatMediaUrl(path)
      .then((url) => {
        if (active) setState({ path, url, failed: false });
      })
      .catch(() => {
        if (active) setState({ path, url: null, failed: true });
      });
    return () => {
      active = false;
    };
  }, [path]);

  const current = state.path === path;
  const url = cached ?? (current ? state.url : null);
  const failed = !cached && current && state.failed;
  return { url, loading: !url && !failed, failed };
}
