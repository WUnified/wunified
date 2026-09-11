import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import { getMissingSupabaseEnvNames, getSupabaseEnv } from './env';

// env.ts reads the two public keys off `process.env` on every call, so the tests
// mutate `process.env` in place (never reassign it) and restore the originals.
const KEYS = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'] as const;

// `process.env` is untyped (`any`) in this project; a narrow view keeps the
// save/restore reads type-safe.
const nodeEnv = process.env as Record<string, string | undefined>;

const URL = 'https://project-ref.supabase.co';
const ANON_KEY = 'anon-key-123';

describe('supabase env helpers', () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of KEYS) {
      saved[key] = nodeEnv[key];
      delete nodeEnv[key];
    }
  });

  afterEach(() => {
    for (const key of KEYS) {
      if (saved[key] === undefined) {
        delete nodeEnv[key];
      } else {
        nodeEnv[key] = saved[key];
      }
    }
  });

  describe('getSupabaseEnv', () => {
    it('returns null when both variables are missing', () => {
      expect(getSupabaseEnv()).toBeNull();
    });

    it('returns null when only the URL is set', () => {
      nodeEnv.EXPO_PUBLIC_SUPABASE_URL = URL;
      expect(getSupabaseEnv()).toBeNull();
    });

    it('returns null when only the anon key is set', () => {
      nodeEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY = ANON_KEY;
      expect(getSupabaseEnv()).toBeNull();
    });

    it('returns the typed config when both are set', () => {
      nodeEnv.EXPO_PUBLIC_SUPABASE_URL = URL;
      nodeEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY = ANON_KEY;
      expect(getSupabaseEnv()).toEqual({
        supabaseUrl: URL,
        supabaseAnonKey: ANON_KEY,
      });
    });
  });

  describe('getMissingSupabaseEnvNames', () => {
    it('lists both names when nothing is set', () => {
      expect(getMissingSupabaseEnvNames()).toEqual([
        'EXPO_PUBLIC_SUPABASE_URL',
        'EXPO_PUBLIC_SUPABASE_ANON_KEY',
      ]);
    });

    it('lists only the missing name', () => {
      nodeEnv.EXPO_PUBLIC_SUPABASE_URL = URL;
      expect(getMissingSupabaseEnvNames()).toEqual(['EXPO_PUBLIC_SUPABASE_ANON_KEY']);
    });

    it('is empty when both are set', () => {
      nodeEnv.EXPO_PUBLIC_SUPABASE_URL = URL;
      nodeEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY = ANON_KEY;
      expect(getMissingSupabaseEnvNames()).toEqual([]);
    });
  });
});
