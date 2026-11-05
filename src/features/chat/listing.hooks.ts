import { useEffect, useState } from 'react';

import { loadChatListing } from './listing.api';
import type { ChatListingPreview } from './listing.api';

type ListingState = {
  listingId: string | null;
  listing: ChatListingPreview | null;
  loading: boolean;
  error: string | null;
};

// Loads the listing a marketplace chat is about. Results are tagged with the listing ID
// they belong to, so switching chats never shows the previous chat's listing.
export function useChatListing(listingId: string | null) {
  const [state, setState] = useState<ListingState>({
    listingId: null,
    listing: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!listingId) return;
    let active = true;
    // No reset here: until a result tagged with this ID arrives, the hook already reports
    // loading, because the stored result belongs to a different listing.
    loadChatListing(listingId)
      .then((listing) => {
        if (active) setState({ listingId, listing, loading: false, error: null });
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setState({
          listingId,
          listing: null,
          loading: false,
          error: caught instanceof Error ? caught.message : 'Unable to load the listing.',
        });
      });
    return () => {
      active = false;
    };
  }, [listingId]);

  const current = listingId !== null && state.listingId === listingId;
  return {
    listing: current ? state.listing : null,
    loading: listingId !== null && (!current || state.loading),
    error: current ? state.error : null,
  };
}
