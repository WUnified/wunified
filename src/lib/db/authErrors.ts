import { isAuthApiError, isAuthSessionMissingError } from '@supabase/supabase-js';

// Matched by code rather than status: a 401 or 403 can also come from a gateway (a bad
// API key, say), which says nothing about the user's session.
const SIGNED_OUT_ERROR_CODES = [
  'bad_jwt',
  'user_not_found',
  'session_expired',
  'refresh_token_not_found',
  'refresh_token_already_used',
];

// GoTrue v2.151 (our local stack) returns a dead refresh token as a 400 with no code.
const DEAD_REFRESH_TOKEN_MESSAGE = /^invalid refresh token/i;

/**
 * An allowlist, not a denylist: an unrecognized failure must not tell a signed-in user
 * to sign in again when the auth service is what's broken.
 */
export function isSignedOutAuthError(error: unknown): boolean {
  if (isAuthSessionMissingError(error)) return true;
  if (!isAuthApiError(error)) return false;
  if (error.code && SIGNED_OUT_ERROR_CODES.includes(error.code)) return true;
  return error.status === 400 && DEAD_REFRESH_TOKEN_MESSAGE.test(error.message);
}
