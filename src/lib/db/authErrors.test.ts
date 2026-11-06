import { describe, expect, it } from '@jest/globals';
import { AuthApiError } from '@supabase/supabase-js';

import { isSignedOutAuthError } from './authErrors';
import { AUTH_SERVICE_FAILURES, SIGNED_OUT_AUTH_ERRORS } from '../../test/authFailures';

describe('isSignedOutAuthError', () => {
  it.each([
    ...SIGNED_OUT_AUTH_ERRORS,
    ['a deleted user', new AuthApiError('User does not exist', 403, 'user_not_found')],
    ['a coded dead refresh token', new AuthApiError('Not found', 400, 'refresh_token_not_found')],
  ])('treats %s as signed out', (_name, error) => {
    expect(isSignedOutAuthError(error)).toBe(true);
  });

  it.each([
    ...AUTH_SERVICE_FAILURES,
    ['a gateway rejecting the API key', new AuthApiError('Invalid API key', 401, undefined)],
    ['a 403 with no session code', new AuthApiError('Forbidden', 403, undefined)],
    ['an unrelated 400', new AuthApiError('Bad request', 400, undefined)],
    ['rate limiting', new AuthApiError('Too many requests', 429, 'over_request_rate_limit')],
    ['a non-auth error', new Error('Something else')],
  ])('does not treat %s as signed out', (_name, error) => {
    expect(isSignedOutAuthError(error)).toBe(false);
  });
});
