import { describe, expect, it } from '@jest/globals';

import { WSU_SIGNUP_REJECTED, getSignupErrorMessage, isWsuEmail } from './wsuEmail';

describe('isWsuEmail', () => {
  it('accepts WSU addresses regardless of case and spacing', () => {
    expect(isWsuEmail(' Shocker@Wichita.EDU ')).toBe(true);
    expect(isWsuEmail('student@shockers.wichita.edu')).toBe(true);
  });

  it('rejects other domains, including look-alikes', () => {
    expect(isWsuEmail('student@gmail.com')).toBe(false);
    expect(isWsuEmail('student@notwichita.edu')).toBe(false);
    expect(isWsuEmail('wichita.edu@gmail.com')).toBe(false);
    expect(isWsuEmail('student@other.wichita.edu')).toBe(false);
  });
});

describe('getSignupErrorMessage', () => {
  it('explains a generic database rejection for a non-WSU email', () => {
    expect(getSignupErrorMessage('Database error saving new user', 'me@gmail.com')).toBe(
      WSU_SIGNUP_REJECTED,
    );
  });

  it('passes other errors through unchanged', () => {
    expect(getSignupErrorMessage('User already registered', 'me@wichita.edu')).toBe(
      'User already registered',
    );
    expect(getSignupErrorMessage(WSU_SIGNUP_REJECTED, 'me@gmail.com')).toBe(WSU_SIGNUP_REJECTED);
  });
});
