/**
 * Database access boundary.
 *
 * Every Supabase query and DB helper lives under `src/lib/db/`. Feature and UI code
 * imports from here — never the Supabase client directly — so all data access sits in
 * one auditable place (RLS assumptions, field selection, error mapping) and tests can
 * mock a single module instead of the network.
 *
 * See knowledge/architecture.md → "Data Access Boundary" for the rationale and
 * knowledge/feature-module-structure.md for how features consume this layer.
 *
 * Empty for now: Supabase is not wired yet (`src/lib/supabase.ts` is a placeholder).
 * As it lands, add one module per domain (e.g. `listings.ts`, `events.ts`, `boards.ts`)
 * and re-export its public functions from here so callers have a single import point.
 */

export {};
