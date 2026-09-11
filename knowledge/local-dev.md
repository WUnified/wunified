# Local orchestration (Docker Compose)

`docker-compose.yml` at the repo root brings up the **whole local backend + the Expo
web app** with one command, so a fresh clone needs no manual DB setup:

```bash
cp .env.example .env && docker compose up
```

`docker compose down -v` fully resets it (fresh Postgres volume → re-migrate + re-seed).
This is **additive** to the Supabase CLI workflow — `supabase/config.toml` and
`supabase start` still work unchanged for contributors who prefer them.

## Containers

| Service | Image (pinned) | Role |
|---|---|---|
| `db` | `postgres:15.8-alpine` | PostgreSQL. `scripts/db/init/00-bootstrap.sql` runs once on a fresh volume to create the Supabase-compatible roles (`anon`, `authenticated`, `service_role`, `authenticator`, `supabase_auth_admin`), the `auth` schema, and the `auth.uid()` / `auth.role()` / `auth.jwt()` helpers the RLS policies in `supabase/migrations/` depend on. Host port `54322`. (Plain Postgres, not `supabase/postgres` — that image self-bootstraps in a way that needs its full self-hosting mount.) |
| `auth` | `supabase/gotrue:v2.151.0` | Auth. Owns and migrates the `auth` schema (creates `auth.users`). Internal only. |
| `migrate` | `postgres:15.8-alpine` | One-shot. Runs `scripts/db/apply.sh`, then exits. `rest` and `web` wait for it to finish successfully. |
| `rest` | `postgrest/postgrest:v12.2.12` | REST API over the `public` schema — the "backend skeleton". Internal only. |
| `gateway` | `nginx:1.27-alpine` | The single origin on host port `54321`. Routes `/auth/v1/*` → `auth`, everything else → `rest`. Hosted Supabase uses Kong for this; locally an nginx shim is enough. |
| `web` | built from `Dockerfile.dev` | `npx expo start --web` on host port `8081`. |
| `meta` + `studio` | `supabase/postgres-meta` + `supabase/studio` | Opt-in DB browser on `54323`. Only starts with `docker compose --profile studio up`. |

### Why a `gateway`

`@supabase/supabase-js` (via `src/lib/supabase.ts`) is created with a **single URL** and
derives `"<url>/auth/v1"` and `"<url>/rest/v1"` from it. PostgREST and GoTrue are
separate processes on separate ports, so the stack needs one front door. `gateway` owns
`EXPO_PUBLIC_SUPABASE_URL` (`http://localhost:54321`) and fans requests out. It also
passes bare paths straight through, so `curl http://localhost:54321/profiles` hits
PostgREST directly.

## How migrations + seed are applied

`scripts/db/apply.sh` (run by the `migrate` service):

1. Waits until `auth.users` exists — GoTrue creates it, and
   `supabase/migrations/20260420010000_create_profiles.sql` both FKs to it and puts a
   trigger on it. `migrate` also `depends_on` `auth` being healthy; the in-script wait
   is a second guard against a slow GoTrue migration.
2. Applies `supabase/migrations/*.sql` in lexical (filename) order via
   `psql -v ON_ERROR_STOP=1 --single-transaction`.
3. Applies `supabase/seed.sql` **if it exists** (it does not yet — Phase 3 adds it).
4. Records each applied file in `public._compose_migrations`, so a plain
   `docker compose up` after a restart is a no-op. A full re-seed needs
   `docker compose down -v`.

Connection roles: `migrate` connects as `postgres` (superuser — needed for the
`auth.users` trigger and the security-definer function), `auth` as
`supabase_auth_admin` (owns the `auth` schema), `rest` as `authenticator` (SET ROLEs to
`anon` / `authenticated` / `service_role` per request). `scripts/db/init/00-bootstrap.sql`
creates the non-`postgres` roles with the local password; it must match
`POSTGRES_PASSWORD`.

## How this maps to the data-flow contract

The [architecture data flow](architecture.md#data-flow-ui--feature--srclibdb--supabase)
is UI → feature hook → feature `api.ts` → `src/lib/db/*` → Supabase. This stack is the
"Supabase" end of that chain, locally:

- `src/lib/env.ts` reads `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  (set on the `web` container from `.env`) → `src/lib/supabase.ts` builds the client.
- Auth calls (`SessionProvider`, login/signup) → `gateway` `/auth/v1/*` → `auth`.
- `src/lib/db/profiles.ts` queries → `gateway` → `rest` → `public.profiles`, with
  Postgres RLS enforced (PostgREST switches to `anon` / `authenticated` per the JWT).
- New `src/lib/db/*` modules (Phase 4) need no stack change — they hit the same
  gateway over the same `public` schema.

`JWT_SECRET`, `ANON_KEY`, and `EXPO_PUBLIC_SUPABASE_ANON_KEY` must stay consistent:
GoTrue signs tokens with `JWT_SECRET`, PostgREST verifies with the same value, and the
client sends `ANON_KEY` (a JWT signed with it) until a user logs in.

## Known caveats

- **Image tags** — `supabase/*` tags move fast. If a pull 404s, bump the tag in
  `docker-compose.yml` (the only place they live).
- **Hot reload** — bind mounts don't forward filesystem events on macOS/Windows; the
  `web` service sets `CHOKIDAR_USEPOLLING` / `WATCHPACK_POLLING`. Reload is a beat
  slower than bare-metal `npm start`.
- **First run** pulls ~4 images and builds the web image (~3–6 min).
