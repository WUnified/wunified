import { describe, expect, it } from '@jest/globals';

import { mapProfile } from './api';
import type { Profile } from '../../lib/db';

const dbRow: Profile = {
  user_id: 'user-1',
  username: 'shocker',
  display_name: 'Shocker',
  avatar: null,
  wsu_verified: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z',
};

describe('mapProfile', () => {
  it('returns null for a null row', () => {
    expect(mapProfile(null)).toBeNull();
  });

  it('maps every column onto the feature record', () => {
    expect(mapProfile(dbRow)).toEqual({
      user_id: 'user-1',
      username: 'shocker',
      display_name: 'Shocker',
      avatar: null,
      wsu_verified: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
    });
  });

  it('preserves a non-null avatar', () => {
    expect(mapProfile({ ...dbRow, avatar: 'https://cdn.example/a.png' })?.avatar).toBe(
      'https://cdn.example/a.png',
    );
  });

  it('does not return the same object reference as the input', () => {
    expect(mapProfile(dbRow)).not.toBe(dbRow);
  });
});
