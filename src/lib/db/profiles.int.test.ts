import { beforeAll, describe, expect, it } from '@jest/globals';

import {
  fetchCurrentUserProfile,
  fetchProfileByUserId,
  updateCurrentUserProfile,
} from './profiles';
import {
  SEED,
  createAnonClient,
  createClientWithRejectedToken,
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
    it('rejects an email that is not WSU or allowlisted', async () => {
      const suffix = uniqueSuffix();
      const { error } = await createAnonClient().auth.signUp({
        email: `it-${suffix}@gmail.com`,
        password: SEED.password,
        options: { data: { username: `it_${suffix}` } },
      });

      expect(error?.message).toMatch(/wichita\.edu|database error saving new user/i);
    });

    // The seed allowlists @example.test and the local stack auto-confirms emails, so a
    // new test user is verified as soon as it signs up.
    it('creates a verified private profile and a public projection for a new user', async () => {
      const { client, userId } = await signUpNewUser();

      const profile = await fetchCurrentUserProfile(client);
      const { data: publicProfile } = await maya
        .from('public_profiles')
        .select('username, wsu_verified')
        .eq('user_id', userId)
        .single();

      expect(profile).toMatchObject({ user_id: userId, wsu_verified: true });
      expect(publicProfile).toEqual({ username: profile?.username, wsu_verified: true });
    });
  });

  describe('reading', () => {
    it("returns the signed-in user's own profile", async () => {
      await expect(fetchCurrentUserProfile(maya)).resolves.toMatchObject({
        user_id: SEED.users.maya.id,
        username: 'maya_t',
      });
    });

    it('reports a rejected token as a failure, not as a missing profile', async () => {
      await expect(fetchCurrentUserProfile(createClientWithRejectedToken())).rejects.toThrow(
        'Failed to load current user',
      );
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

    it('asks a signed-out visitor to sign in', async () => {
      await expect(
        updateCurrentUserProfile({ username: 'nobody' }, createAnonClient()),
      ).rejects.toThrow('You must be signed in to update your profile.');
    });

    it('rejects a username another user already has', async () => {
      const { client } = await signUpNewUser();

      await expect(updateCurrentUserProfile({ username: 'maya_t' }, client)).rejects.toThrow(
        'Failed to save profile',
      );
    });

    it('never lets a client change its own WSU verification', async () => {
      const { client, userId } = await signUpNewUser();

      const { error } = await client
        .from('profiles')
        .update({ wsu_verified: false })
        .eq('user_id', userId);

      expect(error).not.toBeNull();
      await expect(fetchCurrentUserProfile(client)).resolves.toMatchObject({
        wsu_verified: true,
      });
    });
  });
});
