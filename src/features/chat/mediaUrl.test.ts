import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { loadChatMediaUrl } from './api';
import {
  CHAT_MEDIA_URL_CACHE_MS,
  clearChatMediaUrlCache,
  getCachedChatMediaUrl,
  resolveChatMediaUrl,
} from './mediaUrl';

jest.mock('./api', () => ({ loadChatMediaUrl: jest.fn() }));

const load = jest.mocked(loadChatMediaUrl);

describe('resolveChatMediaUrl', () => {
  beforeEach(() => {
    clearChatMediaUrlCache();
    load.mockReset();
    load.mockImplementation((path: string) => Promise.resolve(`https://signed.test/${path}`));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shares one request between photos loading at the same time', async () => {
    const [first, second] = await Promise.all([
      resolveChatMediaUrl('chat/u1/a.jpg'),
      resolveChatMediaUrl('chat/u1/a.jpg'),
    ]);
    expect(first).toBe('https://signed.test/chat/u1/a.jpg');
    expect(second).toBe(first);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('reuses a cached link, then fetches a fresh one after the cache window', async () => {
    jest.useFakeTimers({ now: 1_000_000 });
    await resolveChatMediaUrl('chat/u1/a.jpg');
    await resolveChatMediaUrl('chat/u1/a.jpg');
    expect(load).toHaveBeenCalledTimes(1);

    const later = Date.now() + CHAT_MEDIA_URL_CACHE_MS + 1;
    expect(getCachedChatMediaUrl('chat/u1/a.jpg', later)).toBeNull();
    await resolveChatMediaUrl('chat/u1/a.jpg', later);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('does not cache a failure, so the next attempt retries', async () => {
    load.mockRejectedValueOnce(new Error('offline'));
    await expect(resolveChatMediaUrl('chat/u1/b.jpg')).rejects.toThrow('offline');
    await expect(resolveChatMediaUrl('chat/u1/b.jpg')).resolves.toBe(
      'https://signed.test/chat/u1/b.jpg',
    );
    expect(load).toHaveBeenCalledTimes(2);
  });
});
