import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { createClub, loadClub, loadClubs } from './api';
import { useClub, useClubs, useCreateClub } from './hooks';
import type { Club, ClubPageResult } from './types';

jest.mock('./api', () => ({
  approveJoinRequest: jest.fn(),
  changeMemberRole: jest.fn(),
  changeMemberStatus: jest.fn(),
  createClub: jest.fn(),
  deleteClub: jest.fn(),
  leaveClub: jest.fn(),
  loadClub: jest.fn(),
  loadClubMembers: jest.fn(),
  loadClubs: jest.fn(),
  loadMyMemberships: jest.fn(),
  rejectJoinRequest: jest.fn(),
  removeClubMember: jest.fn(),
  requestToJoinClub: jest.fn(),
  updateClub: jest.fn(),
}));

const listClubs = jest.mocked(loadClubs);
const getClub = jest.mocked(loadClub);
const create = jest.mocked(createClub);

const club = (id: string): Club => ({
  id,
  name: `Club ${id}`,
  description: null,
  createdBy: 'u1',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-01T12:00:00.000Z',
});

function page<T>(items: T[], nextPage: number | null): ClubPageResult<T> {
  return { items, hasMore: nextPage !== null, nextPage };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe('useClubs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the first page and appends the next without duplicates', async () => {
    listClubs.mockResolvedValueOnce(page([club('a'), club('b')], 1));
    listClubs.mockResolvedValueOnce(page([club('b'), club('c')], null));

    const { result } = renderHook(() => useClubs({ pageSize: 2 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.items.map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(result.current.hasMore).toBe(false);
    expect(listClubs.mock.calls[1][0]).toMatchObject({ page: 1, pageSize: 2 });
  });

  it('restarts at page 0 when the search term changes and ignores the stale response', async () => {
    const stale = deferred<ClubPageResult<Club>>();
    listClubs.mockReturnValueOnce(stale.promise);
    listClubs.mockResolvedValueOnce(page([club('chess')], null));

    const { result, rerender } = renderHook(({ query }: { query: string }) => useClubs({ query }), {
      initialProps: { query: 'a' },
    });
    rerender({ query: 'chess' });

    await waitFor(() => expect(result.current.items.map((item) => item.id)).toEqual(['chess']));

    await act(async () => {
      stale.resolve(page([club('stale')], null));
      await stale.promise;
    });

    expect(result.current.items.map((item) => item.id)).toEqual(['chess']);
    expect(listClubs.mock.calls.map(([options]) => options?.query)).toEqual(['a', 'chess']);
  });

  it('does not load more while a request is in flight', async () => {
    listClubs.mockResolvedValueOnce(page([club('a')], 1));
    const more = deferred<ClubPageResult<Club>>();
    listClubs.mockReturnValueOnce(more.promise);

    const { result } = renderHook(() => useClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      void result.current.loadMore();
      void result.current.loadMore();
    });

    expect(listClubs).toHaveBeenCalledTimes(2);
    await act(async () => {
      more.resolve(page([club('b')], null));
      await more.promise;
    });
    await waitFor(() => expect(result.current.loadingMore).toBe(false));
  });

  it('exposes load errors and recovers on reload', async () => {
    listClubs.mockRejectedValueOnce(new Error('Failed to load clubs: offline'));
    listClubs.mockResolvedValueOnce(page([club('a')], null));

    const { result } = renderHook(() => useClubs());
    await waitFor(() => expect(result.current.error).toBe('Failed to load clubs: offline'));

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.items).toHaveLength(1);
  });

  it('does not update state after unmount', async () => {
    const pending = deferred<ClubPageResult<Club>>();
    listClubs.mockReturnValueOnce(pending.promise);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const { unmount } = renderHook(() => useClubs());
    unmount();
    await act(async () => {
      pending.resolve(page([club('a')], null));
      await pending.promise;
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('useClub', () => {
  it('reloads when the club ID changes', async () => {
    getClub.mockResolvedValueOnce(club('a'));
    getClub.mockResolvedValueOnce(club('b'));

    const { result, rerender } = renderHook(({ id }: { id: string }) => useClub(id), {
      initialProps: { id: 'a' },
    });
    await waitFor(() => expect(result.current.data?.id).toBe('a'));

    rerender({ id: 'b' });
    await waitFor(() => expect(result.current.data?.id).toBe('b'));
  });
});

describe('useCreateClub', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null and exposes the error when creation fails', async () => {
    create.mockRejectedValue(new Error('Failed to create club: denied'));
    const { result } = renderHook(() => useCreateClub());

    let created: Club | null = club('x');
    await act(async () => {
      created = await result.current.submit({ name: 'Chess' });
    });

    expect(created).toBeNull();
    expect(result.current.error).toBe('Failed to create club: denied');
    expect(result.current.success).toBe(false);
  });

  it('ignores a second submit while one is in flight', async () => {
    const pending = deferred<Club>();
    create.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useCreateClub());

    let second: Club | null = club('x');
    act(() => {
      void result.current.submit({ name: 'Chess' });
    });
    await act(async () => {
      second = await result.current.submit({ name: 'Chess again' });
    });

    expect(second).toBeNull();
    expect(create).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve(club('a'));
      await pending.promise;
    });
    expect(result.current.success).toBe(true);
  });
});
