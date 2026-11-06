# Auth & Session Management

## Purpose
This document defines how to initialize, manage, and consume Supabase Auth + session state in WUnified, ensuring consistent error handling and security.

> **Status:** Supabase Auth **is wired.** `src/lib/supabase.ts` creates the client
> (guarded by `isSupabaseConfigured`), and `src/features/auth/` holds the live
> implementation: `SessionProvider.tsx` (mounted in `app/_layout.tsx`) loads the session
> and subscribes to changes; `useSession()` / `useSignOut()` in `hooks.ts` expose it;
> `screens/{LoginScreen,SignupScreen}.tsx` are the auth UI. The patterns below are the
> reference for extending it (protected calls, error handling, refresh, tests).
>
> **Import paths:** the `@/lib/supabase` alias in the examples is not configured yet.
> Use a relative import until an alias is added to `tsconfig.json`.

## Session Initialization

Initialize the Supabase Auth session once, above every protected route. In this app that
lives in `src/features/auth/SessionProvider.tsx`, mounted by `app/_layout.tsx`; the
group `_layout.tsx` files redirect on session state. The sketch below shows the shape
(the real provider also guards on `isSupabaseConfigured`):

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          setAuthError(`Failed to load session: ${error.message}`);
          console.error('Session load error:', error);
        } else {
          setSession(session);
        }
      })
      .finally(() => setLoading(false));

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;
  if (authError) return <ErrorScreen message={authError} />;

  return session ? <AuthenticatedApp /> : <LoginScreen />;
}
```

Why this pattern:
- Initializes session once at app start.
- Listens for auth changes (login/logout/token refresh).
- Explicitly handles session load errors.
- Routes are rendered conditionally based on session state.

## Accessing Current Session

**In features/components:**

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data: { user }, error }) => {
        if (error) {
          console.error('Failed to fetch current user:', error);
        }
        setUser(user ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
```

Or subscribe to session state in a context/provider pattern for global access.

## Error Handling: Required Patterns

Your instructions require **explicit error handling** for all auth flows. Do not silently swallow auth errors.

### Pattern 1: Login with Explicit Error Handling
```typescript
export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Explicit error, do not swallow
      console.error('Login failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    // Catch unexpected errors
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Unexpected login error:', message);
    return { success: false, error: message };
  }
}
```

### Pattern 2: Auth-Protected API Call
```typescript
export async function fetchUserProfile() {
  const { data: { user }, error: userError } = 
    await supabase.auth.getUser();

  if (userError || !user) {
    // User not authenticated, explicit error
    throw new Error('Not authenticated');
  }

  // Now call db function with auth context
  const profile = await getUserProfile(user.id);
  return profile;
}
```

### Pattern 3: Handle Auth Errors in Hooks
```typescript
export function useChatMessages(channelId: string) {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMessages(channelId)
      .catch((err) => {
        // Check if error is auth-related
        if (err.message === 'Not authenticated') {
          // Trigger logout or redirect to login
          setError('Session expired. Please log in again.');
          // Handle redirect
        } else {
          setError(err.message);
        }
      });
  }, [channelId]);

  return { messages, error };
}
```

## Session Refresh

Supabase automatically refreshes tokens, but you should ensure refresh happens before tokens expire:

```typescript
// In your app's background task or toast service
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed');
      }
      if (event === 'SIGNED_OUT') {
        // Clear local cache, redirect to login
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

## Logout

```typescript
export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Logout error:', error);
    // Even on error, clear local session state
  }

  // Clear any local cache
  // Navigate to login screen
}
```

## Testing Auth Flows

See [`testing-strategy.md`](testing-strategy.md) for the full rules. Auth behaviour is
tested at two layers:

- **API integration** (`src/lib/db/*.int.test.ts`) — the real signed-in and
  signed-out paths. `signInAs('maya')` and `createAnonClient()` from
  `src/test/integration/clients.ts` give real sessions, so these tests catch how GoTrue
  actually reports a missing session:

  ```ts
  it('rejects a signed-out user', async () => {
    await expect(
      new ListingsRepository(createAnonClient()).create(buildListingInput()),
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });
  ```

- **Unit** — screens and hooks that react to auth errors, with the feature `api.ts` or
  `src/lib/db` mocked (`jest.spyOn(...).mockRejectedValue(...)`), never the Supabase
  client itself. The one exception is `clientWithAuthError` in `src/test/authFailures.ts`,
  for auth failures that can't be produced on demand against the real stack.

**Gotcha:** with no session, `supabase.auth.getUser()` returns
`{ user: null, error: AuthSessionMissingError }` — an error, not just a null user. A
session can also end in other ways, and an auth failure doesn't always mean signed out:

| `getUser()` result | Meaning |
|---|---|
| `AuthSessionMissingError` | Signed out |
| `AuthApiError` with code `bad_jwt`, `user_not_found`, or `session_expired` | Signed out: bad token or deleted user |
| `AuthApiError` with code `refresh_token_not_found` or `refresh_token_already_used`, or a 400 "Invalid Refresh Token" with no code | Signed out: dead refresh token |
| Any other `AuthApiError` (a 500, 429, or a gateway's 401), `AuthUnknownError`, `AuthRetryableFetchError` | **Not** signed out: report a failure |

Every `src/lib/db` module that calls `getUser()` uses `isSignedOutAuthError` from
`src/lib/db/authErrors.ts` for this; new ones must too. It's an allowlist, so an
unrecognized failure never tells a signed-in user to sign in again, and a real sign-out
never looks like a server failure. It matches codes rather than statuses because a
gateway can return a 401 or 403 that says nothing about the session. Test it with the
cases in `src/test/authFailures.ts`.

The exception is `fetchCurrentUserProfile`, which returns `null` only for
`AuthSessionMissingError` and throws otherwise, so a rejected token shows a load error
rather than "Profile not found".

**Known gap:** after a rejected token (`bad_jwt`, `user_not_found`), the session stays
stored and no `SIGNED_OUT` event fires, so `SessionProvider` doesn't redirect to login.
The user sees "You must be signed in" with no way to act on it. A dead refresh token
doesn't have this problem: auth-js clears the session itself.

## Key Rules
1. **Always handle auth errors explicitly** — Do not ignore `error` return values.
2. **Never store tokens in localStorage** — Supabase manages tokens securely by default.
3. **Use `getUser()` to verify session, not `getSession()`** — `getUser()` validates the token.
4. **Redirect on auth failure** — Don't silently fail; guide users back to login.
5. **Test error paths** — Mock auth errors and verify handling.

## Common Mistakes to Avoid
- ❌ Ignoring `error` values from auth calls.
- ❌ Assuming `getSession()` always has a valid user.
- ❌ Storing sensitive data (tokens, passwords) in state.
- ❌ Not handling token refresh failures.
- ❌ Forgetting to unsubscribe from auth listeners (memory leaks).
