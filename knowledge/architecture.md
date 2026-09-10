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
- Navigation: `@react-navigation` bottom-tab navigator
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
The app is being built **UI-first against mock data**. There is no live backend yet:

- `src/constants/mockData.ts` supplies placeholder content for every screen.
- `src/lib/supabase.ts` and `src/lib/env.ts` are empty placeholders — the Supabase
  client is not initialized.
- `src/features/chat/*` are empty stubs kept as the reference shape for feature modules.

The "data flow" and "security" sections below are the **contract for when Supabase is
wired**, not a description of running code.

## Repository Layout

| Path | Responsibility |
|---|---|
| `App.tsx` | Root: mounts providers (`SafeAreaProvider`, `NavigationContainer`) and `AppNavigator`. Stays tiny. |
| `src/navigation/` | Navigator configuration. New screens are registered in `AppNavigator.tsx`. |
| `src/screens/` | One file per tab/route. Composition, layout, and screen-level state only. |
| `src/components/` | Reusable presentational UI. Props in, callbacks out. No data fetching or navigation state. |
| `src/constants/` | `colors.ts` design tokens; `mockData.ts` placeholder content. |
| `src/types/` | Shared cross-feature TypeScript types (`Event`, `Listing`, `Post`; `ServiceItem` is legacy — see below). |
| `src/features/<feature>/` | Domain logic for one feature: `types.ts`, `api.ts`, `hooks.ts`, optional `constants.ts` / `utils.ts` / `index.ts`. |
| `src/lib/` | Shared infrastructure boundaries: `supabase.ts` (client), `env.ts` (config), `db/` (all queries — stub today). |
| `supabase/` | Local Supabase config and SQL migrations. |

### Legacy (do not build on, slated for removal)
- **`app/`** — leftover Expo-Router scaffolding; `App.tsx` no longer imports it.
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
- `src/navigation/AppNavigator.tsx` — bottom-tab navigator; maps over a `tabs` array.
- `src/constants/colors.ts` — the single source of color tokens; screens/components must
  not hard-code hex.
- `src/constants/mockData.ts` — placeholder data; each entry is a stand-in for a future
  query result.
- `src/lib/supabase.ts` (placeholder) — the one place the Supabase client is created.
- `src/lib/env.ts` (placeholder) — the one place environment config is read and validated.
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

1. A screen in `src/screens/` triggers a user action.
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

- **Finish the marketplace + social pivot in code:** remove `ServicesScreen` /
  `ServiceCard` / the `Services` tab, drop `ServiceItem` and the `academicServices` /
  `adminServices` / `campusLifeServices` mock data, and strip the academic items from
  `HomeScreen`'s "Quick Access" row. Docs are pivoted; code is not.
- Wire `src/lib/supabase.ts` and `src/lib/env.ts`, then start filling `src/lib/db/` with
  per-domain modules.
- Add a test runner — the test/review skills assume one exists.
- Remove the legacy `app/` directory.

## Change Management
When architecture changes:
- Update this document.
- Update [`/AGENTS.md`](../AGENTS.md) and its copy `.github/copilot-instructions.md` if a
  convention changes.
- Add migration notes when changing data-access boundaries or auth behavior.
- If the change was a major AI-assisted one, add an entry to
  [`/ai/AI_LOG.md`](../ai/AI_LOG.md).
