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
- Client: Expo SDK 57 + React Native 0.86 + React 19 + TypeScript (strict)
- Navigation: Expo Router (file-based routing under `app/`, versioned with the SDK), bottom
  tabs for the signed-in area
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
(login / signup / session handling), and one placeholder screen per tab. Most feature
screens have no real content yet.

- `src/lib/supabase.ts` and `src/lib/env.ts` are wired — the client is created from
  `EXPO_PUBLIC_SUPABASE_*` env vars, with an in-app "setup needed" screen when they're
  missing.
- `src/features/auth/` holds the working auth flow (`SessionProvider`, `useSession`,
  `useSignOut`, and the login/signup screens).
- `src/lib/db/profiles.ts` runs real `profiles` reads/writes; `src/features/profile/`
  has its `api.ts` / `hooks.ts` / `types.ts` implemented on top of it.
- `src/lib/db/chat.ts` is a placeholder adapter (returns a canned message, queries no
  tables) pending the conversations + participant-pair RLS design; `src/features/chat/`
  is built against it.
- `src/features/{marketplace,community}/` are scaffolded: a placeholder screen plus
  empty `api.ts` / `hooks.ts` / `types.ts` stubs.
- 5 SQL migrations are committed under `supabase/migrations/` (profiles, core tables,
  community board, legacy-table drop).

The "data flow" and "security" sections below describe the target for feature queries
still to be wired.

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

### Legacy
The pre-pivot "all-in-one hub" screens (a `Services` tab, an academic dashboard, mock
data) are gone from the tree. Don't reintroduce academic tooling — it's out of scope
(see *Product & Scope*).

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
- `src/lib/db/` — the data-access boundary. `index.ts` re-exports per-domain modules
  (`profiles.ts` real; `chat.ts` a placeholder); more (e.g. `listings.ts`) get added as
  features are wired.

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

- **Build the `marketplace` and `community` features** — still placeholder screens over
  empty `api.ts` / `hooks.ts` / `types.ts` stubs. Add their `src/lib/db/` modules and
  wire the feature `api.ts` files.
- Replace the `src/lib/db/chat.ts` placeholder with real conversation queries once the
  participant-pair RLS model is designed.
- Keep `src/types/database.ts` in sync with the committed migrations as the schema evolves.

## Tooling: lint & format
ESLint and Prettier enforce the code-quality rules in `AGENTS.md` mechanically.

- **`eslint.config.js`** — flat config. Extends `eslint-config-expo/flat`, layers
  `typescript-eslint` recommended **type-checked** rules over `**/*.{ts,tsx}` (via
  `projectService`, so no explicit file list), and turns on the rules `AGENTS.md`
  calls out: `@typescript-eslint/no-explicit-any`, `no-floating-promises`,
  `consistent-type-imports`, and `import/order` (external → internal → relative, a
  blank line between groups, alphabetised within each). Prettier runs last
  (`eslint-plugin-prettier` + `eslint-config-prettier`) so formatting never fights
  lint.
- **`.prettierrc`** — `singleQuote`, `semi`, `trailingComma: all`, `printWidth: 100`,
  `arrowParens: always`. Markdown and `app.json` are in `.prettierignore` (hand-wrapped
  prose / Expo-owned).
- **Scripts:** `npm run lint` / `lint:fix`, `npm run format` / `format:check`,
  `npm run typecheck`. All three of `lint`, `format:check`, `typecheck` must exit 0
  before a PR (see `CONTRIBUTING.md`).
- **Suppressions:** if a rule flags real code and the compliant fix would be a large
  diff, disable that rule at the **config** level with a `// why:` comment (see the
  scoped `react-hooks/set-state-in-effect` override for `SessionProvider.tsx`), not
  with scattered inline `// eslint-disable`.

## Testing
Unit tests run on Jest via the `jest-expo` preset (`jest.config.js`).

- **Run:** `npm test` (all), `npm run test:watch`, `npm run test:ci`
  (`--ci --coverage --maxWorkers=2`, used by CI once it exists).
- **Where:** a test lives next to its unit as `*.test.ts` / `*.test.tsx`
  (`src/lib/env.test.ts`, `src/features/profile/api.test.ts`). Import globals from
  `@jest/globals`.
- **What to mock:** the `src/lib/db` boundary — never the network or a real Supabase
  client. Tests that reach `src/lib/db` load `src/lib/supabase.ts`, which pulls in
  AsyncStorage; `jest.setup.js` swaps in the package's in-memory mock for that native
  module only (the Supabase client stays real, and is `null` without env vars).
  Prefer testing pure units (mappers, validators, `env.ts`) that need no client at
  all — extract the pure part if it isn't already separate.
- **Coverage:** `collectCoverageFrom` covers `src/**` and `app/**` minus `*.d.ts`,
  barrels, `types.ts`, and generated `src/types/**`. `coverageThreshold` is a low,
  honest floor (`lines: 5`) so CI enforces "tests run" without blocking; raise it
  deliberately as coverage grows.

## Local orchestration (Docker Compose)
`docker-compose.yml` at the repo root runs the full local backend + the Expo web app
with one command — `cp .env.example .env && docker compose up` — so a fresh clone needs
no manual DB setup. `docker compose down -v` fully resets it. This is **additive**: the
Supabase CLI workflow (`supabase/config.toml`, `supabase start`) is unchanged.

- **Containers:** `db` (`postgres:15` — `scripts/db/init/00-bootstrap.sql` adds the
  Supabase-compatible roles, the `auth` schema, and `auth.uid()`/`auth.role()`), `auth`
  (`supabase/gotrue` — owns/migrates the `auth` schema), `migrate` (one-shot: applies
  `supabase/migrations/*.sql` in lexical order then `supabase/seed.sql` if present, via
  `scripts/db/apply.sh`), `rest` (`postgrest/postgrest` — REST API over `public`),
  `gateway` (`nginx` on `:54321` — routes `/auth/v1/*` → `auth`, everything else →
  `rest`; the role Kong plays in hosted Supabase), and `web` (`Dockerfile.dev`,
  `expo start --web` on `:8081`). `studio` is opt-in via `--profile studio`.
- **Ordering:** `auth` waits for `db` healthy; `migrate` waits for `auth` healthy (⇒
  `auth.users` exists) and re-checks in-script; `rest` and `web` wait for `migrate` to
  complete successfully. Healthchecks on `db`, `auth`, `rest` are CI-reusable (Phase 5).
- **Maps to the data flow:** this stack is the "Supabase" end of the
  UI → feature → `src/lib/db` → Supabase contract, locally. `src/lib/env.ts` reads the
  `EXPO_PUBLIC_SUPABASE_*` vars set on the `web` container; auth calls go through the
  gateway to `auth`; `src/lib/db/*` queries go through the gateway to `rest` over the
  `public` schema with RLS enforced. New `src/lib/db` modules need no stack change.
- Full detail: [`local-dev.md`](local-dev.md).

## Change Management
When architecture changes:
- Update this document.
- Update [`/AGENTS.md`](../AGENTS.md) and its copy `.github/copilot-instructions.md` if a
  convention changes.
- Add migration notes when changing data-access boundaries or auth behavior.
- If the change was a major AI-assisted one, add an entry to
  [`/ai/AI_LOG.md`](../ai/AI_LOG.md).
