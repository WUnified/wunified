import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthSessionMissingError,
  AuthUnknownError,
  type AuthError,
  type SupabaseClient,
} from '@supabase/supabase-js';

import type { Database } from '../types/database';

// getUser() results for each kind of auth failure, as seen from the real auth service
// (knowledge/auth-session-management.md). Plain objects would not pass the auth-js
// type guards, so these must stay real error instances.
export const SIGNED_OUT_AUTH_ERRORS: [string, AuthError][] = [
  ['a missing session', new AuthSessionMissingError()],
  ['a dead refresh token', new AuthApiError('Invalid Refresh Token', 400, undefined)],
  ['an invalid token', new AuthApiError('invalid JWT', 403, 'bad_jwt')],
];

export const AUTH_SERVICE_FAILURES: [string, AuthError][] = [
  ['an outage', new AuthRetryableFetchError('Service unavailable', 503)],
  ['a GoTrue 500', new AuthApiError('Internal error', 500, undefined)],
  ['an unparseable response', new AuthUnknownError('Unexpected token', new Error('bad json'))],
];

// One representative case, for checking a repository is wired to isSignedOutAuthError.
// authErrors.test.ts proves the rule itself against the full lists above.
export const AUTH_SERVICE_FAILURE = new AuthApiError('Internal error', 500, undefined);

// These failures can't be produced on demand against the real stack, which is what makes
// faking the client acceptable here (see "No overlap" in knowledge/testing-strategy.md).
export function clientWithAuthError(error: AuthError): SupabaseClient<Database> {
  return {
    auth: { getUser: () => Promise.resolve({ data: { user: null }, error }) },
  } as unknown as SupabaseClient<Database>;
}
