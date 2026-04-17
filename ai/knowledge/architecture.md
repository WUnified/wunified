# WUnified Architecture

## Purpose
This document explains the WUnified app architecture, the current repository layout, and the intended data flow from UI to Supabase using a shared database access layer.

## Stack Summary
- Client: Expo + React Native + TypeScript
- Backend platform: Supabase (Auth, PostgREST, Storage, Edge Functions)
- Database: PostgreSQL with Row-Level Security (RLS)

Why this stack was chosen:
- Expo and React Native provide fast iteration for a mobile-first student app.
- TypeScript reduces runtime bugs by moving correctness checks to compile time.
- Supabase provides managed auth, API, storage, and database in one platform, reducing platform overhead for a small team.
- PostgreSQL + RLS enforces secure multi-tenant access control at the data layer.

## Repository Layout
Current project layout:

- `app/`
- `app/auth/`
- `app/tabs/`
- `src/features/chat/`
- `src/lib/`
- `assets/`
- `supabase/`
- `.github/`

### Layer Responsibilities
- `app/`: Route and screen entry points. Should focus on composition, navigation, and UI state.
- `src/features/<feature>/`: Feature-specific domain logic (API wrappers, hooks, types, view models).
- `src/lib/`: Shared client infrastructure and cross-feature helpers.
- `supabase/`: Supabase local configuration and backend-related setup.

Why this layout was chosen:
- Keeps route files thin and easy to reason about.
- Co-locates feature logic to improve maintainability and ownership.
- Isolates shared infrastructure from business logic.

## Key Modules
Current modules:
- `src/lib/env.ts` (environment/config boundary)
- `src/lib/supabase.ts` (Supabase client boundary)
- `src/features/chat/api.ts` (chat data operations)
- `src/features/chat/hooks.ts` (chat UI state hooks)
- `src/features/chat/types.ts` (chat types/contracts)

Target shared DB boundary (required convention):
- `shared/db/` should own all database query functions and DB access helpers.
- Feature modules should call `shared/db` functions instead of querying tables directly.

Why this decision was made:
- Centralizes query logic and security assumptions.
- Makes RLS-sensitive access patterns easier to audit and test.
- Prevents duplicated query code across feature modules.

## Data Flow (UI -> shared/db -> Supabase)
Intended request path:

1. UI route/screen in `app/` triggers user action.
2. Feature hook/function in `src/features/<feature>/` validates input and prepares use-case parameters.
3. Feature layer calls `shared/db` function for data retrieval or mutation.
4. `shared/db` executes Supabase client operation using typed query helpers.
5. Supabase enforces auth/session and PostgreSQL RLS policies.
6. Result/error is mapped back through feature layer to UI state.

Why this flow was chosen:
- Keeps UI components simple and focused on rendering.
- Creates one auditable data access path.
- Preserves separation of concerns between view, domain, and persistence layers.
- Improves portability if the backend implementation changes later.

## Security and Reliability Rules
- Never expose Supabase service role key in client code or public env files.
- Handle Supabase auth errors explicitly in feature/auth flows.
- Enforce TypeScript strict mode for app and shared code.
- Require RLS policies on all PostgreSQL tables before use in app features.

Why these rules exist:
- Prevent credential leakage and privilege escalation.
- Ensure auth failures are visible and actionable.
- Maintain consistent type safety across contributors and AI models.
- Protect user data even if client-side checks are bypassed.

## Implementation Notes
Current state indicates scaffolded files in some feature and lib modules. As implementation expands:
- Add `shared/db` with typed query modules per domain (for example `shared/db/chat.ts`).
- Keep Supabase client initialization in one place and inject/use it through db helpers.
- Keep route files in `app/` free of direct persistence calls.

## Change Management
When architecture changes:
- Update this document.
- Update `.github/copilot-instructions.md` if conventions change.
- Add migration notes when changing data access boundaries or auth behavior.
