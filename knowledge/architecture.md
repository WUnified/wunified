# WUnified Architecture

## Purpose
This document explains the WUnified app architecture, the current repository layout, and
the intended data flow from UI to Supabase. It describes both **where the code is today**
and **the boundaries we're building toward**, so both are called out explicitly below.

## Product & Scope
WUnified is a **campus marketplace** for WSU students that also serves as a **social
hub**: student-to-student buying and selling, a campus social feed, an event calendar,
and community chat boards. Marketplace and Social are the primary surfaces; events and
boards support the social side.

**Out of scope:** academic tooling — class schedule, finances, timesheets, degree
planning, and any myWSU integration. The app deliberately does not go in that direction.
Earlier docs and some current screens describe an "all-in-one hub" with an academic
dashboard; that plan is retired (see *Legacy* below).

## Stack Summary
- Client: Expo SDK 54 + React Native 0.81 + React 19 + TypeScript (strict)
- Navigation: Expo Router v6 (file-based routing under `app/`), bottom tabs for the
  signed-in area
- Backend platform (planned): Supabase (Auth, PostgREST, Storage, Edge Functions)
- Database (planned): PostgreSQL with Row-Level Security (RLS)

Why this stack:
- Expo + React Native give a small team fast iteration on a mobile-first marketplace and
  social app.
- TypeScript moves correctness checks to compile time.
- Supabase bundles auth, API, storage, and database in one managed platform, which keeps
  backend overhead low for a 4-person team.
- PostgreSQL + RLS enforces secure per-user access control at the data layer, so a
  client bug can't leak another student's data.

## Current Phase
The app shell is in place — Expo Router navigation, a Supabase-backed auth gate
(login / signup / session handling), and one placeholder screen per tab. Feature
screens have no real content yet.

- `src/lib/supabase.ts` and `src/lib/env.ts` are wired — the client is created from
  `EXPO_PUBLIC_SUPABASE_*` env vars, with an in-app "setup needed" screen when they're
  missing.
- `src/features/auth/` holds the working auth flow (`SessionProvider`, `useSession`,
  `useSignOut`, and the login/signup screens).
- `src/features/{marketplace,community,chat,profile}/` are scaffolded: a placeholder
  screen plus empty `api.ts` / `hooks.ts` / `types.ts` stubs.
- `src/lib/db/` exists as a documented boundary stub — no per-domain modules yet.

The "data flow" and "security" sections below are the **contract for when Supabase
queries are wired**, not a description of running code.

## Repository Layout

| Path | Responsibility |
|---|---|
| `app/` | Expo Router routing layer. Thin route files (~3–10 lines) + `_layout.tsx` navigators. No screen logic. |
| `app/_layout.tsx` | Root: mounts `SafeAreaProvider` + `SessionProvider`; renders the Supabase-not-configured and session-loading states, else a `<Stack>`. |
| `app/(auth)/` | `login` + `signup` routes and a `_layout.tsx` that redirects to `(tabs)` when a session exists. |
| `app/(tabs)/` | `index` (Marketplace), `community`, `chat`, `profile` routes and a `_layout.tsx` that redirects to `(auth)/login` when there is no session. |
| `src/features/<feature>/` | One product area: `screens/` (composition, layout, screen-level state), plus `api.ts`, `hooks.ts`, `types.ts`, optional `constants.ts` / `utils.ts` / `index.ts`. `auth/` also has `SessionProvider.tsx`. |
| `src/components/` | Reusable presentational UI shared across features. Props in, callbacks out. No data fetching or navigation state. |
| `src/constants/` | `colors.ts` design tokens. |
| `src/types/` | Shared cross-feature types. `database.ts` is generated from the live schema (`supabase gen types typescript`). |
| `src/lib/` | Shared infrastructure boundaries: `supabase.ts` (client), `env.ts` (config), `db/` (all queries — stub today). |
| `supabase/` | Local Supabase config and SQL migrations. |

### Legacy (do not build on, slated for removal)
- **Pre-pivot "all-in-one hub" pieces** — the `Services` tab and `ServicesScreen`, the
  `ServiceItem` type, and the academic/administrative data in `src/constants/mockData.ts`
  (`academicServices`, `adminServices`, and the academic items in `HomeScreen`'s
  "Quick Access" row). These belong to the retired academic-dashboard direction.

New code must not depend on any of the above.

Why this layout:
- Screens stay thin and readable — each one is essentially an outline of a page.
- Reusable UI is isolated from screen logic, so components can be composed freely.
- Feature logic is co-located per domain, which keeps ownership clear.
- Shared infrastructure (`src/lib/`) is separated from business logic.

## Key Modules
- `app/_layout.tsx` — root layout; mounts providers and the auth/config gate.
- `app/(auth)/_layout.tsx`, `app/(tabs)/_layout.tsx` — the session redirects and the
  bottom-tab navigator.
- `src/features/auth/SessionProvider.tsx` — the one place the Supabase session is loaded
  and subscribed to; exposes `{ session, isLoading, error }` via `useSession`.
- `src/constants/colors.ts` — the single source of color tokens; screens/components must
  not hard-code hex.
- `src/lib/supabase.ts` — the one place the Supabase client is created (`isSupabaseConfigured`
  guards a missing-env state).
- `src/lib/env.ts` — the one place environment config is read and validated.
- `src/lib/db/` — the data-access boundary. Exists as `index.ts` with a documented
  contract; per-domain modules (e.g. `src/lib/db/listings.ts`) get added as Supabase lands.

## Data Access Boundary (`src/lib/db/`)
**All** database queries and DB-access helpers live under `src/lib/db/`. Feature modules
call `src/lib/db` functions; they do not import the Supabase client or query tables
directly. UI never touches persistence. The folder exists now as a stub — fill it in one
domain module at a time.

> Older notes (and some skills) say `shared/db/`. That refers to this same boundary —
> the agreed location is `src/lib/db/` because `src/lib/` already exists.

Why:
- One auditable place for query logic and RLS-sensitive access patterns.
- No duplicated query code across features.
- Tests mock `src/lib/db` instead of the network.
- Portable if the backend implementation changes later.

## Data Flow (UI → feature → src/lib/db → Supabase)
Intended request path once the backend is live:

1. A screen in `src/features/<feature>/screens/` (mounted by a route in `app/`) triggers
   a user action.
2. A feature hook in `src/features/<feature>/hooks.ts` validates input and prepares
   parameters, exposing loading / success / error state.
3. The hook calls a `src/features/<feature>/api.ts` function.
4. `api.ts` calls a typed helper in `src/lib/db/` and maps low-level errors to
   feature-readable messages.
5. `src/lib/db/` runs the Supabase client operation.
6. Supabase enforces auth/session and PostgreSQL RLS policies.
7. The result or error flows back up to screen state and renders.

Why this flow:
- Keeps components focused on rendering.
- Creates one auditable data-access path.
- Preserves separation between view, domain, and persistence layers.

## Security and Reliability Rules
- Never expose the Supabase service role key in client code, bundles, logs, or committed
  env files. Server-side only.
- Handle Supabase auth errors explicitly in auth and feature flows —
  see [auth-session-management.md](auth-session-management.md).
- Surface actionable errors; never swallow exceptions —
  see [error-handling-patterns.md](error-handling-patterns.md).
- Enforce TypeScript strict mode for all app code; no raw `any`.
- Require RLS policies on every PostgreSQL table before it is used —
  see [rls-patterns.md](rls-patterns.md).

Why these rules exist:
- Prevent credential leakage and privilege escalation.
- Make auth failures visible and actionable instead of silent.
- Keep type safety consistent across contributors and AI models.
- Protect student data even if a client-side check is bypassed.

## Open Work
Known gaps between this document and the code, roughly in priority order:

- **Build the feature screens.** `marketplace`, `community`, `chat`, and `profile` are
  placeholder screens over empty `api.ts` / `hooks.ts` / `types.ts` stubs.
- Start filling `src/lib/db/` with per-domain modules, then wire the feature `api.ts`
  files to them.
- Reconcile the live Supabase schema with `src/types/database.ts` and add committed
  migrations under `supabase/migrations/` (the remote schema is currently untracked).
- Add a test runner — the test/review skills assume one exists.
- Refresh `knowledge/guides/` (how-to-add-a-screen / feature-module / component) for the
  Expo Router + feature-first layout.

## Change Management
When architecture changes:
- Update this document.
- Update [`/AGENTS.md`](../AGENTS.md) and its copy `.github/copilot-instructions.md` if a
  convention changes.
- Add migration notes when changing data-access boundaries or auth behavior.
- If the change was a major AI-assisted one, add an entry to
  [`/ai/AI_LOG.md`](../ai/AI_LOG.md).
