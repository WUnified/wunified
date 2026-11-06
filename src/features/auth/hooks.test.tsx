import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react-native';

import { useSession, useSignOut } from './hooks';

const mockSignOut = jest.fn<() => Promise<void>>();

jest.mock('../../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: { auth: { signOut: () => mockSignOut() } },
}));

describe('useSession', () => {
  it('fails loudly when used outside a SessionProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useSession())).toThrow(
      'useSession must be used within a SessionProvider',
    );

    consoleError.mockRestore();
  });
});

describe('useSignOut', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockSignOut.mockReset();
  });

  it('signs out through Supabase', () => {
    mockSignOut.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSignOut());

    result.current();

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('logs a failed sign-out rather than leaving it unhandled', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('offline');
    mockSignOut.mockRejectedValue(failure);
    const { result } = renderHook(() => useSignOut());

    result.current();
    await Promise.resolve();
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalledWith('Logout error:', failure);
  });
});
