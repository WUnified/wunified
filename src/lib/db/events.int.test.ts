import { beforeAll, describe, expect, it } from '@jest/globals';

import { EventsRepository, type CreateEventInput } from './events';
import {
  SEED,
  createAnonClient,
  signInAs,
  uniqueSuffix,
  type TestClient,
} from '../../test/integration/clients';

function buildEventInput(overrides: Partial<CreateEventInput> = {}): CreateEventInput {
  return {
    title: `Integration event ${uniqueSuffix()}`,
    description: 'Created by an API integration test.',
    location: 'Rhatigan Student Center',
    startTime: '2099-03-01T10:00:00.000Z',
    endTime: '2099-03-01T11:00:00.000Z',
    ...overrides,
  };
}

describe('EventsRepository against the local stack', () => {
  let maya: TestClient;
  let jordan: TestClient;

  beforeAll(async () => {
    maya = await signInAs('maya');
    jordan = await signInAs('jordan');
  });

  describe('listEvents', () => {
    it('lets a signed-out visitor browse events by start time', async () => {
      const events = await new EventsRepository(createAnonClient()).listEvents();

      const startTimes = events.map((event) => event.startTime);
      expect(events.length).toBeGreaterThan(0);
      expect(startTimes).toEqual([...startTimes].sort());
    });
  });

  describe('createEvent', () => {
    it('creates an event everyone can see', async () => {
      const input = buildEventInput();

      const created = await new EventsRepository(maya).createEvent(input);

      const listed = await new EventsRepository(createAnonClient()).listEvents();
      expect(created.title).toBe(input.title);
      expect(listed.map((event) => event.id)).toContain(created.id);
    });

    it('rejects a signed-out user', async () => {
      await expect(
        new EventsRepository(createAnonClient()).createEvent(buildEventInput()),
      ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    });

    it('rejects an event that ends before it starts', async () => {
      await expect(
        new EventsRepository(maya).createEvent(
          buildEventInput({ endTime: '2099-02-01T10:00:00.000Z' }),
        ),
      ).rejects.toThrow('create event');
    });
  });

  describe('row-level security on events', () => {
    it('blocks creating an event on behalf of another user', async () => {
      const { error } = await maya.from('events').insert({
        created_by: SEED.users.jordan.id,
        title: 'Spoofed',
        description: 'Spoofed',
        location: 'Nowhere',
        start_time: '2099-03-01T10:00:00.000Z',
      });

      expect(error?.code).toBe('42501');
    });

    it('blocks a non-member from creating an event for a club', async () => {
      const samir = await signInAs('samir');

      const { error } = await samir.from('events').insert({
        created_by: SEED.users.samir.id,
        club_id: SEED.clubs.localTestClub,
        title: 'Not my club',
        description: 'Not my club',
        location: 'Nowhere',
        start_time: '2099-03-01T10:00:00.000Z',
      });

      expect(error?.code).toBe('42501');
    });

    it('lets an active member create an event for their club', async () => {
      const { error } = await jordan.from('events').insert({
        created_by: SEED.users.jordan.id,
        club_id: SEED.clubs.localTestClub,
        title: `Club event ${uniqueSuffix()}`,
        description: 'For members.',
        location: 'Heskett Center',
        start_time: '2099-03-01T10:00:00.000Z',
      });

      expect(error).toBeNull();
    });

    it("silently skips edits and deletes of another user's event", async () => {
      const event = await new EventsRepository(maya).createEvent(buildEventInput());

      const { data: updated } = await jordan
        .from('events')
        .update({ title: 'Hijacked' })
        .eq('id', event.id)
        .select('id');
      const { data: deleted } = await jordan
        .from('events')
        .delete()
        .eq('id', event.id)
        .select('id');

      expect(updated).toEqual([]);
      expect(deleted).toEqual([]);
    });
  });

  describe('RSVPs', () => {
    it('records going, and removes it from active RSVPs once cancelled', async () => {
      const event = await new EventsRepository(maya).createEvent(buildEventInput());
      const repository = new EventsRepository(jordan);

      await repository.setMyRsvp(event.id, true);
      const whileGoing = await repository.listMyRsvps();
      await repository.setMyRsvp(event.id, false);
      const afterCancelling = await repository.listMyRsvps();

      expect(whileGoing).toContainEqual({ eventId: event.id, status: 'going' });
      expect(afterCancelling.map((rsvp) => rsvp.eventId)).not.toContain(event.id);
    });

    it('lets a user RSVP again after cancelling', async () => {
      const event = await new EventsRepository(maya).createEvent(buildEventInput());
      const repository = new EventsRepository(jordan);
      await repository.setMyRsvp(event.id, true);
      await repository.setMyRsvp(event.id, false);

      await repository.setMyRsvp(event.id, true);

      expect(await repository.listMyRsvps()).toContainEqual({ eventId: event.id, status: 'going' });
    });

    it('requires signing in to read or change RSVPs', async () => {
      const repository = new EventsRepository(createAnonClient());

      await expect(repository.listMyRsvps()).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
      await expect(
        repository.setMyRsvp('80000000-0000-0000-0000-000000000001', true),
      ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    });

    it('blocks RSVPing on behalf of another user', async () => {
      const event = await new EventsRepository(maya).createEvent(buildEventInput());

      const { error } = await maya
        .from('event_rsvps')
        .insert({ event_id: event.id, user_id: SEED.users.jordan.id, status: 'going' });

      expect(error?.code).toBe('42501');
    });

    it("hides another user's RSVPs", async () => {
      const event = await new EventsRepository(maya).createEvent(buildEventInput());
      await new EventsRepository(jordan).setMyRsvp(event.id, true);

      const { data } = await maya
        .from('event_rsvps')
        .select('event_id')
        .eq('event_id', event.id)
        .eq('user_id', SEED.users.jordan.id);

      expect(data).toEqual([]);
    });
  });
});
