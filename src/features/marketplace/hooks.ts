import { useEffect, useState } from 'react';

import { createListing, loadListings } from './api';
import type { CreateMarketplaceListingInput, MarketplaceListing } from './types';

// Owns the marketplace read lifecycle, including retry state and cleanup when
// navigation removes the screen before the request completes.
export function useMarketplaceListings() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);

    try {
      setListings(await loadListings());
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error ? loadError.message : 'Unable to load marketplace listings.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    void loadListings()
      .then((nextListings) => {
        if (isMounted) {
          setListings(nextListings);
          setError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (isMounted) {
          setError(
            loadError instanceof Error ? loadError.message : 'Unable to load marketplace listings.',
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { listings, loading, error, reload };
}

// Mutations expose saving and success separately from list loading so a future
// screen can submit a listing without disrupting the existing feed state.
export function useCreateMarketplaceListing() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(input: CreateMarketplaceListingInput): Promise<MarketplaceListing | null> {
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const listing = await createListing(input);
      setSuccess(true);
      return listing;
    } catch (createError: unknown) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'Unable to create marketplace listing.',
      );
      return null;
    } finally {
      setSaving(false);
    }
  }

  return { saving, success, error, submit };
}
