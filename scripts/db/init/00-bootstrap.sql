-- Local dev bootstrap for the compose stack.
--
-- The `db` service runs the plain `postgres` image (not supabase/postgres, whose
-- entrypoint bootstraps itself in ways that need its full ~8-file self-hosting
-- mount and otherwise fail). This script creates the Supabase-compatible roles,
-- the `auth` schema, and the auth.* JWT helpers that the SQL migrations and
-- PostgREST/GoTrue expect. GoTrue creates auth.users (and the rest of the auth
-- schema contents) itself on first start.
--
-- Runs once, on a fresh volume (`docker compose down -v` to re-run). Assumes
-- POSTGRES_USER=postgres. LOCAL ONLY — the password below is the well-known
-- local default and must match POSTGRES_PASSWORD in .env. Never reuse anywhere
-- network-reachable.

-- ── API roles ──────────────────────────────────────────────────────────────
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

-- PostgREST logs in as `authenticator` and SET ROLEs to one of the above.
create role authenticator noinherit login password 'postgres';
grant anon, authenticated, service_role to authenticator;

-- GoTrue owns and migrates the auth schema. Superuser locally so its migrations
-- (extensions, etc.) never trip over privileges.
create role supabase_auth_admin login superuser password 'postgres';

-- GoTrue's own migrations schema-qualify (so they succeed regardless), but its
-- runtime queries do not — without `auth` on the search_path every request
-- fails with "relation ... does not exist" once GoTrue looks up an unqualified
-- table name (e.g. `identities`).
alter role supabase_auth_admin set search_path = auth, public;

-- Let POSTGRES_USER assume the API roles too — handy for psql and the one-shot
-- migrate job (which connects as postgres).
grant anon, authenticated, service_role to postgres;

-- ── Extensions the migrations / GoTrue may expect ─────────────────────────
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- ── auth schema + JWT helpers ────────────────────────────────────────────
create schema if not exists auth authorization supabase_auth_admin;
grant usage on schema auth to anon, authenticated, service_role, postgres;

-- PostgREST (PGRST_DB_USE_LEGACY_GUCS=false) exposes the verified JWT as a JSON
-- string in the `request.jwt.claims` GUC. These mirror Supabase's helpers, so
-- the RLS policies in supabase/migrations/ (auth.uid(), auth.role()) work.
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true), '')::jsonb
$$;

create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')::uuid
$$;

create or replace function auth.role() returns text language sql stable as $$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '')::text
$$;

create or replace function auth.email() returns text language sql stable as $$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email', '')::text
$$;

grant execute on all functions in schema auth to anon, authenticated, service_role;

-- ── public schema grants ─────────────────────────────────────────────────
-- Supabase grants the API roles blanket access to `public`; the per-table RLS in
-- the migrations is what actually restricts rows. Without these grants the
-- policies' `to authenticated` clauses would still be blocked by table perms.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- Same, applied to whatever the migrate job (runs as postgres) creates next.
alter default privileges for role postgres in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on functions to anon, authenticated, service_role;
