import { useEffect, useRef, useState } from 'react';

import { createListing, loadListings } from './api';
import type { CreateMarketplaceListingInput, MarketplaceListing } from './types';

// Owns the marketplace read lifecycle, including retry state and cleanup when
// navigation removes the screen before the request completes.
export function useMarketplaceListings() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  async function loadForRequest(requestId: number) {
    try {
      const nextListings = await loadListings();
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setListings(nextListings);
      setError(null);
    } catch (loadError: unknown) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setError(
        loadError instanceof Error ? loadError.message : 'Unable to load marketplace listings.',
      );
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }

  async function reload() {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    await loadForRequest(requestId);
  }

  useEffect(() => {
    mountedRef.current = true;
    const requestId = ++requestIdRef.current;
    void loadForRequest(requestId);

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
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
  const savingRef = useRef(false);

  async function submit(input: CreateMarketplaceListingInput): Promise<MarketplaceListing | null> {
    if (savingRef.current) return null;

    savingRef.current = true;
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
      savingRef.current = false;
      setSaving(false);
    }
  }

  function clearError() {
    setError(null);
    setSuccess(false);
  }

  return { saving, success, error, submit, clearError };
}
