import { beforeAll, describe, expect, it } from '@jest/globals';

import {
  fetchCurrentUserProfile,
  fetchProfileByUserId,
  updateCurrentUserProfile,
} from './profiles';
import {
  SEED,
  createAnonClient,
  signInAs,
  signUpNewUser,
  uniqueSuffix,
  type TestClient,
} from '../../test/integration/clients';

describe('profiles against the local stack', () => {
  let maya: TestClient;

  beforeAll(async () => {
    maya = await signInAs('maya');
  });

  describe('signup', () => {
    it('creates a private profile and a public projection for a new user', async () => {
      const { client, userId } = await signUpNewUser();

      const profile = await fetchCurrentUserProfile(client);
      const { data: publicProfile } = await maya
        .from('public_profiles')
        .select('username, wsu_verified')
        .eq('user_id', userId)
        .single();

      expect(profile).toMatchObject({ user_id: userId, wsu_verified: false });
      expect(publicProfile).toEqual({ username: profile?.username, wsu_verified: false });
    });
  });

  describe('reading', () => {
    it("returns the signed-in user's own profile", async () => {
      await expect(fetchCurrentUserProfile(maya)).resolves.toMatchObject({
        user_id: SEED.users.maya.id,
        username: 'maya_t',
      });
    });

    it('returns null for a signed-out visitor', async () => {
      await expect(fetchCurrentUserProfile(createAnonClient())).resolves.toBeNull();
    });

    it('reads your own private profile by user ID', async () => {
      await expect(fetchProfileByUserId(SEED.users.maya.id, maya)).resolves.toMatchObject({
        user_id: SEED.users.maya.id,
        username: 'maya_t',
      });
    });

    it("hides another user's private profile", async () => {
      await expect(fetchProfileByUserId(SEED.users.jordan.id, maya)).resolves.toBeNull();
    });
  });

  describe('updating', () => {
    it('saves username and display name and syncs the public projection', async () => {
      const { client, userId } = await signUpNewUser();
      const username = `renamed_${uniqueSuffix()}`;

      const saved = await updateCurrentUserProfile(
        { username, display_name: 'Renamed User' },
        client,
      );
      const { data: publicProfile } = await maya
        .from('public_profiles')
        .select('username, display_name')
        .eq('user_id', userId)
        .single();

      expect(saved).toMatchObject({ username, display_name: 'Renamed User' });
      expect(publicProfile).toEqual({ username, display_name: 'Renamed User' });
    });

    it('rejects a username another user already has', async () => {
      const { client } = await signUpNewUser();

      await expect(updateCurrentUserProfile({ username: 'maya_t' }, client)).rejects.toThrow(
        'Failed to save profile',
      );
    });

    it('never lets a client mark itself WSU-verified', async () => {
      const { client, userId } = await signUpNewUser();

      const { error } = await client
        .from('profiles')
        .update({ wsu_verified: true })
        .eq('user_id', userId);

      expect(error).not.toBeNull();
      await expect(fetchCurrentUserProfile(client)).resolves.toMatchObject({
        wsu_verified: false,
      });
    });
  });
});
