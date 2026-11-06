import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { loadChatListing, type ChatListingPreview } from './listing.api';
import { useChatListing } from './listing.hooks';

jest.mock('./listing.api', () => ({ loadChatListing: jest.fn() }));

const load = jest.mocked(loadChatListing);

const listing = (id: string) => ({ id, title: `Listing ${id}` }) as unknown as ChatListingPreview;

function renderListing(initialId: string | null) {
  return renderHook(({ id }: { id: string | null }) => useChatListing(id), {
    initialProps: { id: initialId },
  });
}

describe('useChatListing', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('does nothing without a listing ID', () => {
    const { result } = renderListing(null);

    expect(load).not.toHaveBeenCalled();
    expect(result.current).toEqual({ listing: null, loading: false, error: null });
  });

  it('starts loading, then exposes the listing', async () => {
    load.mockResolvedValue(listing('a'));

    const { result } = renderListing('a');

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.listing).toEqual(listing('a'));
  });

  it('exposes a load failure', async () => {
    load.mockRejectedValue(new Error('offline'));

    const { result } = renderListing('a');

    await waitFor(() => expect(result.current.error).toBe('offline'));
    expect(result.current).toMatchObject({ listing: null, loading: false });
  });

  it("never shows the previous chat's listing while the next one loads", async () => {
    load.mockResolvedValueOnce(listing('a'));
    const { result, rerender } = renderListing('a');
    await waitFor(() => expect(result.current.listing).toEqual(listing('a')));
    load.mockReturnValueOnce(new Promise(() => undefined));

    rerender({ id: 'b' });

    expect(result.current).toEqual({ listing: null, loading: true, error: null });
  });

  it('ignores a slow response for a listing it has moved on from', async () => {
    let resolveFirst: (value: ChatListingPreview) => void = () => undefined;
    load.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFirst = resolve;
      }),
    );
    load.mockResolvedValueOnce(listing('b'));
    const { result, rerender } = renderListing('a');

    rerender({ id: 'b' });
    await waitFor(() => expect(result.current.listing).toEqual(listing('b')));
    await act(async () => {
      resolveFirst(listing('a'));
      await Promise.resolve();
    });

    expect(result.current.listing).toEqual(listing('b'));
  });
});
