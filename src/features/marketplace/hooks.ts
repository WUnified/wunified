import { useEffect, useRef, useState } from 'react';

import { archiveListing, createListing, loadListings, markListingSold } from './api';
import type { CreateMarketplaceListingInput, MarketplaceListing } from './types';
import type { ImageUploadProgress } from '../../lib/db';

// Owns the marketplace read lifecycle, including retry state and cleanup when
// navigation removes the screen before the request completes.
export function useMarketplaceListings() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
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
    setRefreshError(null);
    setRefreshing(false);
    await loadForRequest(requestId);
  }

  // Pull-to-refresh keeps the current listings on screen; a failure is reported
  // separately so a flaky network doesn't replace a usable feed with an error state.
  async function refresh() {
    const requestId = ++requestIdRef.current;
    setRefreshing(true);
    setRefreshError(null);
    try {
      const nextListings = await loadListings();
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setListings(nextListings);
      setError(null);
    } catch (refreshFailure: unknown) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setRefreshError(
        refreshFailure instanceof Error
          ? refreshFailure.message
          : 'Unable to refresh marketplace listings.',
      );
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setRefreshing(false);
        // A newer initial load may have been superseded; never leave the spinner stuck.
        setLoading(false);
      }
    }
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

  return { listings, loading, error, refreshing, refreshError, reload, refresh };
}

// Mutations expose saving and success separately from list loading so a future
// screen can submit a listing without disrupting the existing feed state.
export function useCreateMarketplaceListing() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);

  async function submit(
    input: CreateMarketplaceListingInput,
    onImageUploadProgress?: (progress: ImageUploadProgress) => void,
  ): Promise<MarketplaceListing | null> {
    if (savingRef.current) return null;

    savingRef.current = true;
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const listing = await createListing(input, onImageUploadProgress);
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

export type SellerListingAction = 'sold' | 'archived';

// Seller-only mutation; callers should reload the feed afterwards because
// sold/archived listings drop out of the active list.
export function useUpdateListingStatus() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);

  async function update(
    listingId: string,
    action: SellerListingAction,
  ): Promise<MarketplaceListing | null> {
    if (savingRef.current) return null;

    savingRef.current = true;
    setSaving(true);
    setError(null);

    try {
      return action === 'sold' ? await markListingSold(listingId) : await archiveListing(listingId);
    } catch (updateError: unknown) {
      setError(
        updateError instanceof Error ? updateError.message : 'Unable to update the listing.',
      );
      return null;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function clearError() {
    setError(null);
  }

  return { saving, error, update, clearError };
}
