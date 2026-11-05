import { useCallback, useEffect, useRef, useState } from 'react';

import { createCommunityEvent, loadCommunityEvents, setCommunityEventRsvp } from './events.api';
import type { CommunityEvent } from './events.types';
import type { CreateEventInput } from '../../lib/db';

interface CommunityEventsState {
  userId: string | null;
  events: CommunityEvent[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

const EMPTY_EVENTS: CommunityEvent[] = [];

export function useCommunityEvents(userId: string | null) {
  const [state, setState] = useState<CommunityEventsState>({
    userId: null,
    events: EMPTY_EVENTS,
    loading: true,
    loaded: false,
    error: null,
  });
  const [savingEventIds, setSavingEventIds] = useState<string[]>([]);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const dataVersionRef = useRef(0);
  const userGenerationRef = useRef(0);
  const previousUserIdRef = useRef(userId);
  const savingEventIdsRef = useRef(new Set<string>());
  const mountedRef = useRef(true);
  const stateMatchesUser = state.userId === userId;

  useEffect(() => {
    if (previousUserIdRef.current === userId) return;

    previousUserIdRef.current = userId;
    userGenerationRef.current += 1;
    savingEventIdsRef.current.clear();
    setSavingEventIds([]);
    setRsvpError(null);
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    if (!userId) {
      savingEventIdsRef.current.clear();
      setSavingEventIds([]);
      setRsvpError(null);
      setState({
        userId: null,
        events: EMPTY_EVENTS,
        loading: false,
        loaded: true,
        error: null,
      });
      return;
    }

    const dataVersion = dataVersionRef.current;
    setState((current) => ({
      userId,
      events: current.userId === userId ? current.events : EMPTY_EVENTS,
      loading: true,
      loaded: current.userId === userId && current.loaded,
      error: null,
    }));

    try {
      const events = await loadCommunityEvents();
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      if (dataVersion === dataVersionRef.current) {
        setState({ userId, events, loading: false, loaded: true, error: null });
      } else {
        setState((current) => ({
          ...current,
          loading: false,
          loaded: true,
        }));
      }
    } catch (caught: unknown) {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setState((current) => ({
          userId,
          events: current.userId === userId ? current.events : EMPTY_EVENTS,
          loading: false,
          loaded: current.userId === userId && current.loaded,
          error: caught instanceof Error ? caught.message : 'Unable to load events.',
        }));
      }
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateRsvp = useCallback(
    async (eventId: string, isGoing: boolean) => {
      if (!userId || savingEventIdsRef.current.has(eventId)) return;

      const userGeneration = userGenerationRef.current;
      savingEventIdsRef.current.add(eventId);
      setSavingEventIds((current) => [...current, eventId]);
      setRsvpError(null);
      try {
        await setCommunityEventRsvp(eventId, isGoing);
        if (!mountedRef.current || userGeneration !== userGenerationRef.current) return;
        dataVersionRef.current += 1;
        setState((current) => {
          if (current.userId !== userId) return current;
          return {
            ...current,
            events: current.events.map((event) =>
              event.id === eventId ? { ...event, rsvpStatus: isGoing ? 'going' : null } : event,
            ),
          };
        });
      } catch (caught: unknown) {
        if (mountedRef.current) {
          setRsvpError(
            caught instanceof Error ? caught.message : 'Unable to update your event RSVP.',
          );
        }
      } finally {
        if (userGeneration === userGenerationRef.current) {
          savingEventIdsRef.current.delete(eventId);
        }
        if (mountedRef.current && userGeneration === userGenerationRef.current) {
          setSavingEventIds((current) => current.filter((savingId) => savingId !== eventId));
        }
      }
    },
    [userId],
  );

  return {
    events: stateMatchesUser ? state.events : EMPTY_EVENTS,
    loading: !stateMatchesUser || state.loading,
    loaded: stateMatchesUser && state.loaded,
    error: stateMatchesUser ? state.error : null,
    reload,
    updateRsvp,
    savingEventIds,
    rsvpError,
  };
}

export function useCreateCommunityEvent(reloadEvents: () => Promise<void>) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const submit = useCallback(
    async (input: CreateEventInput): Promise<boolean> => {
      if (savingRef.current) return false;

      savingRef.current = true;
      setSaving(true);
      setError(null);
      try {
        await createCommunityEvent(input);
        if (!mountedRef.current) return false;
        await reloadEvents();
        return true;
      } catch (caught: unknown) {
        if (mountedRef.current) {
          setError(caught instanceof Error ? caught.message : 'Unable to create event.');
        }
        return false;
      } finally {
        savingRef.current = false;
        if (mountedRef.current) setSaving(false);
      }
    },
    [reloadEvents],
  );

  const clearError = useCallback(() => setError(null), []);

  return { saving, error, submit, clearError };
}
