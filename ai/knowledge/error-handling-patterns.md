# Error Handling Patterns

## Purpose
This document defines how to handle errors consistently across WUnified, ensuring that errors are surfaced, actionable, and never silently swallowed.

Your instructions require: "Fail safely: surface actionable errors and do not swallow exceptions silently."

This guide enforces that rule.

## Error Classification

Categorize errors into four types:

1. **Auth/Permission Errors** — User not authenticated, no access to resource.
2. **Validation Errors** — Invalid input, constraint violation (e.g., email format).
3. **Data/Database Errors** — Query failed, RLS policy blocked access, network error.
4. **Unexpected/Programming Errors** — Code flow violation, type mismatch, null pointer.

## Error Handling Pyramid

```
┌─────────────────────────────────────────┐
│ 4. Unexpected Programming Errors        │ (MUST log, inform user, escalate)
├─────────────────────────────────────────┤
│ 3. Data/Database Errors                 │ (MUST log, show user-friendly message)
├─────────────────────────────────────────┤
│ 2. Validation Errors                    │ (Show validation message, don't log)
├─────────────────────────────────────────┤
│ 1. Auth/Permission Errors               │ (Redirect to login, don't log details)
└─────────────────────────────────────────┘
```

## Pattern 1: API Layer (src/lib/db)

Catch all errors, map them to feature-friendly errors, and log if unexpected.

```typescript
export async function fetchChatMessages(
  channelId: string
): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (error) {
      // Log the raw error for debugging
      console.error('[DB Error] fetchChatMessages:', error);

      // Map to feature-friendly error
      if (error.code === 'PGRST116') {
        // Likely RLS policy blocked access
        throw new Error('You do not have access to this channel.');
      }
      throw new Error(`Failed to load messages: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    // Re-throw with context
    if (err instanceof Error) {
      throw err; // Already mapped
    }
    throw new Error(`Unexpected error loading messages: ${String(err)}`);
  }
}
```

## Pattern 2: Feature Layer (src/features/*)

Call db functions and handle/propagate errors.

```typescript
import { fetchChatMessages } from '../../lib/db/chat';

export async function loadChatMessages(
  channelId: string
): Promise<{ messages: ChatMessage[]; error: string | null }> {
  try {
    const messages = await fetchChatMessages(channelId);
    return { messages, error: null };
  } catch (err) {
    const error =
      err instanceof Error ? err.message : 'Unknown error loading messages';

    if (error.includes('not have access')) {
      // Auth/permission error — don't log details
      return { messages: [], error };
    }

    // Data/unexpected error — log for debugging
    console.error('[Feature Error] loadChatMessages:', err);
    return { messages: [], error };
  }
}
```

## Pattern 3: Hook Layer (src/features/*/hooks.ts)

Always update state with error messages; never swallow.

```typescript
export function useChatMessages(channelId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!channelId) {
      setError('Channel ID is missing');
      return;
    }

    setLoading(true);
    setError(null); // Clear previous errors

    loadChatMessages(channelId)
      .then(({ messages, error }) => {
        setMessages(messages);
        if (error) {
          setError(error); // Always surface errors
        }
      })
      .catch((err) => {
        // Unexpected error (should not reach here if api.ts is correct)
        const message =
          err instanceof Error ? err.message : 'Unknown error';
        console.error('[Hook Error] useChatMessages:', message);
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [channelId]);

  return { messages, loading, error };
}
```

## Pattern 4: Route/Component Layer (app/*)

Consume hooks and render error UI; never ignore errors.

```typescript
export default function ChatScreen() {
  const { messages, loading, error } = useChatMessages('channel-123');

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    // Always render error message
    return (
      <ErrorBanner
        message={error}
        action="Try again"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!messages.length) {
    return <EmptyState />;
  }

  return <ChatList messages={messages} />;
}
```

## Pattern 5: Async Operations with Cleanup

For operations that clean up or have side effects, always handle all error paths.

```typescript
export async function sendMessage(text: string, channelId: string) {
  const { data: { user }, error: userError } =
    await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  if (!text.trim()) {
    throw new Error('Message cannot be empty');
  }

  try {
    const { error } = await supabase
      .from('messages')
      .insert({
        channel_id: channelId,
        sender_id: user.id,
        text: text.trim(),
      });

    if (error) {
      console.error('[DB Error] sendMessage:', error);
      throw new Error('Failed to send message. Try again.');
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error sending message';
    console.error('[API Error] sendMessage:', message);
    throw new Error(message);
  }
}
```

## Pattern 6: Type Guards for Safer Error Handling

Use type guards to avoid runtime errors.

```typescript
function isAuthError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes('authenticate') ||
      error.message.includes('not have access'))
  );
}

function isValidationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes('empty') ||
      error.message.includes('invalid'))
  );
}

export function useMutation(fn: () => Promise<void>) {
  const [error, setError] = useState<string | null>(null);

  const mutate = async () => {
    try {
      await fn();
      setError(null);
    } catch (err) {
      if (isAuthError(err)) {
        // Handle auth error → redirect
        setError('Please log in again');
      } else if (isValidationError(err)) {
        // Handle validation error → show message
        setError(err instanceof Error ? err.message : 'Invalid input');
      } else {
        // Handle unknown error
        console.error('Unexpected error:', err);
        setError('Something went wrong. Please try again.');
      }
    }
  };

  return { mutate, error };
}
```

## Integration with RLS

When RLS blocks access, surface the error explicitly.

```typescript
export async function fetchUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // RLS typically returns PGRST116 or similar
      if (error.code === 'PGRST116') {
        throw new Error('You do not have permission to view this profile.');
      }
      throw new Error(`Failed to load profile: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('[DB Error] fetchUserProfile:', err);
    throw err;
  }
}
```

## Error Logging Policy

**Log ALWAYS:**
- Unexpected/programming errors
- Database errors (for debugging)
- Network errors

**Do NOT log:**
- Validation errors (user input issue)
- Auth/permission errors (expected, don't leak user details)

**Log Format:**
```typescript
console.error('[<Layer> Error] <Function>:', {
  message: err.message,
  code: err.code,
  context: { userId, channelId }, // Sanitize: no passwords, tokens
});
```

## Testing Error Paths

Always test happy path AND error path.

```typescript
describe('sendMessage', () => {
  it('sends message on success', async () => {
    // mock success
  });

  it('throws error if not authenticated', async () => {
    // mock getUser to return error
    expect(() => sendMessage('text', 'ch')).rejects.toThrow(
      'Not authenticated'
    );
  });

  it('throws validation error if message is empty', async () => {
    // mock getUser success
    expect(() => sendMessage('', 'ch')).rejects.toThrow('cannot be empty');
  });

  it('throws error if database insert fails', async () => {
    // mock getUser success
    // mock insert to return error
    expect(() => sendMessage('text', 'ch')).rejects.toThrow(
      'Failed to send message'
    );
  });
});
```

## Key Rules
1. **Never swallow errors** — Always catch and handle or re-throw.
2. **Surface errors to the user** — Render error UI in components.
3. **Log server/unexpected errors** — But not auth/validation errors.
4. **Map raw errors to feature messages** — Users don't need to see database codes.
5. **Test error paths** — Every error condition should have a test.
6. **Check auth before data operations** — Fail fast on permission issues.
