import { describe, expect, it } from '@jest/globals';

import { EMPTY_EVENT_FORM, toCreateEventInput, validateEventForm } from './eventForm';
import type { EventFormValues } from './eventForm';

const validValues: EventFormValues = {
  ...EMPTY_EVENT_FORM,
  title: '  Campus meetup ',
  description: '  Bring a friend ',
  location: '  Student center ',
  startDate: '2099-03-01',
  startTime: '10:30',
  endDate: '2099-03-01',
  endTime: '12:00',
};

describe('event form validation', () => {
  it('requires event details and a valid start date and time', () => {
    expect(validateEventForm(EMPTY_EVENT_FORM)).toMatchObject({
      title: 'Enter an event title.',
      description: 'Enter an event description.',
      location: 'Enter an event location.',
      startDate: 'Enter a valid start date and time.',
    });
  });

  it('converts valid local date/time fields and trims text values', () => {
    expect(toCreateEventInput(validValues)).toMatchObject({
      title: 'Campus meetup',
      description: 'Bring a friend',
      location: 'Student center',
      endTime: expect.any(String),
    });
  });

  it('rejects invalid calendar dates, incomplete optional end times, and reversed ranges', () => {
    expect(validateEventForm({ ...validValues, startDate: '2099-02-30' }).startDate).toBe(
      'Enter a valid start date and time.',
    );
    expect(validateEventForm({ ...validValues, endDate: '', endTime: '12:00' }).endTime).toContain(
      'both end date and time',
    );
    expect(
      validateEventForm({ ...validValues, endDate: '2099-02-28', endTime: '12:00' }).endTime,
    ).toContain('after the start');
  });
});
