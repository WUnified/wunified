# Feature Module Structure

## Purpose
This document defines the standard structure for feature modules in WUnified, so new features follow consistent patterns and AI knows where to place code.

## Feature Folder Layout
Every feature lives in `src/features/<feature-name>/` with this structure:

```
src/features/chat/
├── types.ts          # Type definitions and API contracts
├── api.ts            # Supabase queries and mutations (via src/lib/db)
├── hooks.ts          # Custom React hooks for feature state
├── constants.ts      # Feature-specific constants (optional)
├── utils.ts          # Helper functions (optional)
└── index.ts          # Barrel export (optional but recommended)
```

## File Responsibilities

### types.ts
- Defines all TypeScript types and interfaces for the feature.
- Includes Supabase row types, API request/response contracts, and UI state shapes.
- Exported and imported by other files in the feature.
- Example:
  ```typescript
  export interface ChatMessage {
    id: string;
    sender_id: string;
    text: string;
    created_at: string;
  }

  export interface ChatState {
    messages: ChatMessage[];
    loading: boolean;
    error: string | null;
  }
  ```

### api.ts
- **Does not** directly call Supabase client.
- **Calls** `src/lib/db/` functions for all data operations.
- Transforms responses to feature types.
- Handles API-level error mapping (convert DB errors to feature-readable errors).
- Example:
  ```typescript
  import { fetchChatMessages } from '../../lib/db/chat';
  import type { ChatMessage } from './types';

  export async function loadMessages(
    channelId: string
  ): Promise<ChatMessage[]> {
    try {
      return await fetchChatMessages(channelId);
    } catch (err) {
      throw new Error(`Failed to load chat messages: ${err.message}`);
    }
  }
  ```

Why this pattern:
- Centralizes DB access through `src/lib/db/` (per required convention).
- Isolates feature-specific error handling from raw DB errors.
- Makes testing easier (mock `src/lib/db` instead of Supabase).

### hooks.ts
- Implements React hooks for feature state and side effects.
- Use `useFoo` naming for all custom hooks.
- Hooks should:
  - Call `api.ts` functions for data operations.
  - Manage loading/error/success states.
  - Handle cleanup (e.g., unsubscribe from real-time listeners).
- Example:
  ```typescript
  import { useState, useEffect } from 'react';
  import { loadMessages } from './api';
  import type { ChatMessage } from './types';

  export function useChatMessages(channelId: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      setLoading(true);
      loadMessages(channelId)
        .then(setMessages)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, [channelId]);

    return { messages, loading, error };
  }
  ```

### constants.ts (Optional)
- Feature-specific constants (not app-wide).
- Example:
  ```typescript
  export const MAX_MESSAGE_LENGTH = 5000;
  export const TYPING_INDICATOR_TIMEOUT_MS = 3000;
  ```

### utils.ts (Optional)
- Pure utility functions for the feature.
- Example: date formatting, message filtering, sorting.

### index.ts (Barrel Export, Recommended)
- Exports public types, hooks, and functions.
- Simplifies imports for consumers.
- Example:
  ```typescript
  export * from './types';
  export { useChatMessages } from './hooks';
  export { sendMessage, loadMessages } from './api';
  ```
- Consumers can then do: `import { useChatMessages, ChatMessage } from '@/features/chat'`

## Usage in Routes

Routes in `app/` should:
1. Import hooks and types from the feature.
2. Delegate persistence to the feature's `api.ts`.
3. Focus on composition, navigation, and rendering.

Example route:
```typescript
import { useChatMessages } from '@/features/chat';

export default function ChatScreen() {
  const { messages, loading, error } = useChatMessages('channel-1');

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return <ChatList messages={messages} />;
}
```

## Rules

1. **No direct Supabase calls in features** — Always go through `src/lib/db/`.
2. **Types first** — Define types before implementing logic.
3. **Error handling in api.ts** — Map low-level errors to feature-friendly messages.
4. **One concern per file** — If a file grows beyond ~200 lines, split it.
5. **Test types and hooks** — Unit test hooks and type correctness.

## When to Create a Sub-Feature

For complex features (e.g., `chat` with threads, reactions, search), consider sub-folders:

```
src/features/chat/
├── types.ts
├── api.ts
├── hooks.ts
├── threads/
│   ├── types.ts
│   ├── api.ts
│   └── hooks.ts
├── reactions/
│   ├── types.ts
│   ├── api.ts
│   └── hooks.ts
```

Each sub-feature follows the same pattern and has its own barrel export.

## Example Checklist for New Feature

- [ ] Created `src/features/<name>/` folder.
- [ ] Defined types in `types.ts`.
- [ ] Implemented api.ts calling `src/lib/db/` (no direct Supabase).
- [ ] Implemented hooks using api.ts functions.
- [ ] Added barrel export in `index.ts`.
- [ ] Imported feature into routes as needed.
- [ ] Added tests for types and hooks.
