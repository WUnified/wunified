# Auth & Session Management

## Purpose
This document defines how to initialize, manage, and consume Supabase Auth + session state in WUnified, ensuring consistent error handling and security.

## Session Initialization

Initialize the Supabase Auth session early in your app, before rendering protected routes.

**In `App.tsx` or root layout:**

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

Mock the Supabase auth module:

```typescript
import { vi } from 'vitest';
import { supabase } from '@/lib/supabase';

describe('Login', () => {
  it('returns success on valid credentials', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: { id: '123', email: 'test@example.com' } as any },
      error: null,
    });

    const result = await loginWithEmail('test@example.com', 'password');
    expect(result.success).toBe(true);
  });

  it('returns error on invalid credentials', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Invalid credentials'),
    });

    const result = await loginWithEmail('test@example.com', 'wrong');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

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
