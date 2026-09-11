# AI Change Log

A running record of **major** changes made with AI assistance in this repo. It exists so
the team can answer "when did this land, and what prompt produced it?" without spelunking
through diffs.

## When an entry is added

During an AI session, before a major code change — a new feature, a new pattern, an
architecture change, a DB / RLS / auth change, a new dependency, or an edit spanning
roughly three or more files — the AI asks:

> "Would you like to add this prompt to the AI log?"

If the user says yes, the AI appends an entry here. Typo fixes, comment-only edits,
single-line tweaks, and doc-only changes are not logged.

## Entry format

- Newest entry first (add new entries directly under this heading).
- Keep it to three parts: the prompt, the files touched with line ranges, and a
  one-line summary. No diffs, no essays.
- File links are relative to this `ai/` folder (`../src/...`) and use GitHub line
  anchors (`#L10-L42`). Line ranges are approximate — they point a reader at the change,
  they are not a spec.

```markdown
## YYYY-MM-DD — Short title

**Prompt:** <the user's request, verbatim or lightly trimmed>

**Files changed:**
- [path/from/repo/root.ts](../path/from/repo/root.ts#L10-L42) — L10–42: what changed here
- [another/file.tsx](../another/file.tsx#L5-L9) — L5–9: what changed here

**Summary:** One or two lines on what changed and why.
```

---

## 2026-09-10 — Single-command local orchestration (Phase 2)

**Prompt:** "Phase 2 — Single-command local orchestration. From a fresh clone,
`cp .env.example .env && docker compose up` must bring up the complete local stack —
Postgres (migrated + seeded), a REST API backend, auth, and the Expo web frontend —
with no other manual steps; `docker compose down -v` fully resets it. Deliverables:
(1) root `docker-compose.yml` with every image pinned — `db` (supabase/postgres),
`auth` (gotrue, owns/migrates the auth schema), `rest` (postgrest on the public
schema), one-shot `migrate` applying `supabase/migrations/*.sql` then `supabase/seed.sql`
(may not exist yet) in lexical order via `psql -v ON_ERROR_STOP=1`, `web` built from a
local `Dockerfile.dev`, optional `studio`. Healthchecks on db/auth/rest; ordering so
`migrate` gates on `auth.users` existing and `rest`/`web` gate on `migrate` finishing;
`migrate` re-run safe or documented reset-only; `web` uses a named `node_modules`
volume + source bind mount + `EXPO_PUBLIC_SUPABASE_*` + `REACT_NATIVE_PACKAGER_HOSTNAME`.
(2) `Dockerfile.dev` (Node 20, `npm ci`, expose 8081). (3) `.dockerignore`. (4) expand
`.env.example` with well-known non-secret local defaults so `up` works unedited; keep
`.env` git-ignored. (5) thin `dev:up/down/reset/logs` wrappers. (6) docs — README
Getting Started, a `knowledge/` local-orchestration section, `AGENTS.md` ⇄
`.github/copilot-instructions.md` sync. Additive to the existing Supabase CLI workflow;
no application code changes; minimal diff."

**Files changed:**
- [../docker-compose.yml](../docker-compose.yml) — new: `db` / `auth` / `migrate` /
  `rest` / `gateway` / `web` services + profile-gated `meta` + `studio`; pinned tags;
  healthchecks on db/auth/rest; `depends_on` ordering (auth→db healthy, migrate→auth
  healthy, rest+web→migrate completed). Adds a small nginx `gateway` on `:54321`
  (routes `/auth/v1/*`→auth, else→rest) because `@supabase/supabase-js` needs one
  origin — the brief's `rest:54321` is served through it. `db` uses plain
  `postgres:15-alpine` (the `supabase/postgres` image self-bootstraps in a way that
  needs its full self-hosting mount and fails otherwise).
- [../Dockerfile.dev](../Dockerfile.dev) — new: `node:20.19.4-bookworm-slim` (bumped
  from `.18.1` once the container flagged it as below Expo's minimum), `npm ci`,
  `EXPOSE 8081`, CMD `npx expo start --web --host lan`.
- [../.dockerignore](../.dockerignore) — new: `node_modules`, `.expo`, `.git`,
  `coverage`, `dist`, `*.log`.
- [../scripts/db/apply.sh](../scripts/db/apply.sh) — new: waits for `auth.users`,
  applies migrations then seed (if present) in lexical order with
  `ON_ERROR_STOP=1 --single-transaction`, records each in `public._compose_migrations`
  so plain re-`up` is a no-op (full re-seed = `down -v`).
- [../scripts/db/init/00-bootstrap.sql](../scripts/db/init/00-bootstrap.sql) — new:
  creates the Supabase-compatible roles (`anon`, `authenticated`, `service_role`,
  `authenticator`, `supabase_auth_admin`), the `auth` schema, the `auth.uid()` /
  `auth.role()` / `auth.jwt()` / `auth.email()` helpers, and the `public` schema grants
  the RLS policies rely on (mounted into the db image's initdb.d). `supabase_auth_admin`
  also gets `search_path = auth, public` — GoTrue's runtime queries (unlike its
  migrations) aren't schema-qualified and fail to find `auth.identities` etc. without it.
- [../scripts/gateway/nginx.conf](../scripts/gateway/nginx.conf) — new: the
  `/auth/v1`→gotrue, `*`→postgrest routing + `/healthz`.
- [../scripts/gateway/cors.conf](../scripts/gateway/cors.conf) — new: CORS handling
  shared by every gateway location — reflects `Origin` and the browser's requested
  headers, and answers the preflight `OPTIONS` itself. Duplicates the `add_header`s
  inside the `if ($request_method = OPTIONS)` block, not just outside it — nginx
  doesn't inherit `add_header` into an `if` that sets its own, so the first version
  silently shipped preflight responses with no CORS headers at all.
- [../.env.example](../.env.example#L1-L40) — expanded: Postgres creds, `JWT_SECRET`,
  `ANON_KEY`, `SERVICE_ROLE_KEY`, `GOTRUE_*`, `EXPO_PUBLIC_SUPABASE_*` — all set to the
  published Supabase demo values (local-only) so `up` works with zero edits.
- [../.gitignore](../.gitignore#L34-L36) — ignore `.env` (keeps `.env.example` tracked).
- [../package.json](../package.json#L19-L22) — `dev:up` / `dev:down` / `dev:reset` /
  `dev:logs` scripts (thin `docker compose` wrappers).
- [../README.md](../README.md) — "Getting Started" rewritten: single-command quickstart,
  service/port table, `dev:reset` wipe, first-run time note, Supabase-CLI-as-alternative.
- [../knowledge/local-dev.md](../knowledge/local-dev.md) — new: per-container reference,
  the migrate/seed flow, why the gateway exists, mapping to the
  UI→feature→`src/lib/db`→Supabase contract, caveats.
- [../knowledge/architecture.md](../knowledge/architecture.md#L201-L220) — new "Local
  orchestration (Docker Compose)" section before Change Management.
- [../AGENTS.md](../AGENTS.md#L38-L43) +
  [../.github/copilot-instructions.md](../.github/copilot-instructions.md#L38-L43) —
  repo-structure table: `supabase/` row updated + `docker-compose.yml` / `scripts/db/`
  rows added (files kept byte-identical).
- [../knowledge/guides/quickstart.md](../knowledge/guides/quickstart.md#L1-L10) —
  one-command note at the top pointing to `local-dev.md`.

**Summary:** Added a root `docker-compose.yml` (+ `Dockerfile.dev`, `.dockerignore`,
`scripts/db/apply.sh`, an nginx gateway + CORS config, expanded `.env.example`) that
stands up Postgres + GoTrue + PostgREST + Expo web with `cp .env.example .env &&
docker compose up` and resets with `down -v`, plus `dev:*` npm wrappers and
README/knowledge/AGENTS docs. Additive to the Supabase CLI workflow; no app code
touched. Debugged live against a real Docker daemon through several rounds: swapped
`db` from `supabase/postgres` to plain `postgres` (the former's own role/schema
bootstrap needs its full self-hosting mount and failed on its own), added the
`search_path` fix on `supabase_auth_admin`, fixed the `rest`/`gateway` healthchecks
(BusyBox `wget --spider` isn't reliable; PostgREST's image has no curl/wget at all —
used a `bash /dev/tcp` probe against its admin `/ready`), added `BROWSER=none` to stop
Expo's `spawn xdg-open ENOENT` crash loop in the container (not `CI=1`, which disables
Metro's watch mode and breaks hot reload), and built out the gateway's CORS handling
(reflects `Origin` + requested headers; the preflight `OPTIONS` needs its own complete
`add_header` set — see file note above). Verified end-to-end in the browser: all
services healthy, `migrate` exits 0, `\dt public.*` shows the migrated schema, REST and
auth respond through the gateway, and signup in the browser creates a session and a
`public.profiles` row via the trigger. `npm run format:check` / `lint` / `typecheck` /
`test:ci` all exit 0 (11/11 tests).
## 2026-09-10 — Profile stats row and empty posts section

**Prompt:** "Add two presentation-only sections to
src/features/profile/screens/ProfileScreen.tsx. No new data sources, no new hooks, no
other files. Colors from Colors only. 1. STATS ROW inside the header card, below the WSU
Verified badge: three equal columns ('Connections', 'Posts', 'Saved'), count at 20pt
weight 700 Colors.text above a 12pt Colors.textMuted label, all counts hardcoded to 0
with a TODO to replace them once the follows and posts tables exist. 2. POSTS SECTION
below the details card, 24px gap: 'Posts' header at 18pt weight 700, then a
Colors.surface card (radius 24, padding 32, centered) with 'No posts yet' (15pt weight
600 Colors.textDim) and 'Posts you share will show up here.' (13pt Colors.textMuted).
Keep the 32px bottom padding. Run `npx tsc --noEmit`."

**Files changed:**
- [src/features/profile/screens/ProfileScreen.tsx](../src/features/profile/screens/ProfileScreen.tsx#L41)
  — L41: `STAT_LABELS` constant driving the three stat columns.
- [src/features/profile/screens/ProfileScreen.tsx](../src/features/profile/screens/ProfileScreen.tsx#L268-L298)
  — L268–276: TODO comment + hardcoded-zero stats row in the header card; L292–298:
  "Posts" header and empty-state card between the details card and actions.
- [src/features/profile/screens/ProfileScreen.tsx](../src/features/profile/screens/ProfileScreen.tsx#L422-L539)
  — `emptyPosts*`, `sectionHeading`, `stat*` styles, inserted alphabetically.

**Summary:** Placeholder stats row and empty posts section on the profile screen; no
data or behavior changes. Stats row sits 20px below the badge (card padding keeps it
24px from the bottom edge), and the posts section sits above the Edit/Sign out actions.
`tsc --noEmit` passes; not yet checked on a device.

---

## 2026-09-10 — Profile screen card-based restyle

**Prompt:** "Restyle src/features/profile/screens/ProfileScreen.tsx to a modern
card-based layout. Presentation only — do not change hooks, data flow, or behavior. Do
not edit any other file. All colors from Colors, no hardcoded hex. Display state: a
top-anchored ScrollView inside SafeAreaView, 20px horizontal padding. Header card
(Colors.surface, radius 24, padding 24) with an 88x88 avatar — Image when avatar is set,
otherwise a Colors.primary circle with the uppercased initial — then display_name,
@username, and a solid WSU Verified pill only when verified. Details card (radius 24,
padding 20) with Username / Member since (toLocaleDateString('en-US', { month: 'long',
year: 'numeric' })) / Status rows, each with a 36x36 Colors.primary glyph chip, label on
the left, right-aligned value, and 1px separators between rows. Actions: 'Edit profile'
primary pill and 'Sign out' quiet outline pill, minHeight 52, 32px bottom padding. Edit
form: fields in the same surface card with an 'Edit profile' heading, inputs radius 12,
Save as primary pill and Cancel as outline pill. Keep accessibility labels, 44pt touch
targets, loading/error states, and the alphabetized StyleSheet. Run `npx tsc --noEmit`."
(Replaced an earlier same-day pass that top-anchored the screen with a divider and made
Edit profile the primary action.)

**Files changed:**
- [src/features/profile/screens/ProfileScreen.tsx](../src/features/profile/screens/ProfileScreen.tsx#L1-L63)
  — L1–12: added `Image` and `SafeAreaView` imports; L33–39: en-US `formatMemberSince`;
  L41–63: new in-file `DetailRow` with accessibility-hidden glyph chip.
- [src/features/profile/screens/ProfileScreen.tsx](../src/features/profile/screens/ProfileScreen.tsx#L160-L295)
  — L160–240: edit form wrapped in a surface card with heading and pill actions;
  L242–295: header card, details card, and pill actions.
- [src/features/profile/screens/ProfileScreen.tsx](../src/features/profile/screens/ProfileScreen.tsx#L297-L486)
  — L297–486: alphabetized card, row, pill, and avatar styles (Colors tokens only).

**Summary:** Presentation-only restyle of the profile screen into header and details
cards with pill buttons; hooks, state, and behavior unchanged. Inputs use
`Colors.background` so they stand out on the surface card, and a remote avatar shows a
neutral circle while loading. `tsc --noEmit` passes; not yet checked on a device. File
is now ~486 lines — splitting DetailRow, the header card, and the edit form into
components is a suggested follow-up.

---

## 2026-09-10 — Fix "Profile not found" flash on profile first load

**Prompt:** "Fix the 'Profile not found' flash on first load in
src/features/profile/screens/ProfileScreen.tsx. Do not modify any other file. The local
`profile` state starts null and is only populated by a useEffect, which runs after
render, so the !profile branch renders the empty state for a frame. Derive the displayed
record instead: `const current = profile ?? loadedProfile;`. Use `current` for the
empty-state check and the display branch (heading, @username, wsu_verified badge,
startEditing). Keep setProfile(saved) in handleSave. Update the why-comment to explain
that local state only holds post-save records, with the loaded profile as fallback. Run
`npx tsc --noEmit`. Revert src/features/auth/SessionProvider.tsx to origin/main — it was
out of scope for this PR."

**Files changed:**
- [src/features/profile/screens/ProfileScreen.tsx](../src/features/profile/screens/ProfileScreen.tsx#L36-L40)
  — L1: dropped `useEffect` import; L36–40: rewrote why-comment, added
  `current = profile ?? loadedProfile`, removed the seeding effect.
- [src/features/profile/screens/ProfileScreen.tsx](../src/features/profile/screens/ProfileScreen.tsx#L76-L214)
  — L76: empty-state check uses `current`; L88–101: renamed shadowing helper params to
  `record` / `values`; L202–214: display branch reads from `current`.
- `src/features/auth/SessionProvider.tsx` — reverted to `origin/main` (drops the
  out-of-scope stale-refresh-token handling).

**Summary:** The profile view now falls back to the loaded record during render instead
of waiting for an effect, removing the one-frame empty-state flash; local state holds
only saved records. `tsc --noEmit` passes. The stale-refresh-token fix should return in
its own PR.

---

## 2026-09-10 — Profile screen view and edit mode

**Prompt:** "Implement ProfileScreen in src/features/profile/screens/ProfileScreen.tsx.
Only edit the screen file — do NOT modify types.ts, api.ts, hooks.ts, index.ts, or
src/lib/db/profiles.ts. Use useCurrentProfile() and useProfileMutation() from '../hooks';
never call Supabase or lib/db from the screen. Render a centered ActivityIndicator while
loading, the load error message alone on failure, and an empty state when no profile
exists. On success show display_name, @username, and a 'WSU Verified' badge only when
wsu_verified is true (wsu_verified/created_at/updated_at read-only). 'Edit profile'
switches to TextInputs for username, display_name, and avatar URL seeded from the
profile. Save trims and locally blocks empty username/display_name, calls
updateProfile({ username, display_name, avatar }), disables while saving, overwrites
local profile state with the returned record and exits edit mode on success, or stays in
edit mode showing the mutation error above the form. Keep the sign-out button. Hold a
local useState seeded from the hook's profile via useEffect. Match AGENTS.md: StyleSheet
at the bottom with alphabetized keys, colors only from constants/colors, WHY comments,
strict TS, 44pt touch targets, accessible labels."

**Files changed:**
- [src/features/profile/screens/ProfileScreen.tsx](../src/features/profile/screens/ProfileScreen.tsx#L31-L224)
  — L31–47: hook wiring + local profile/form/validation state; L49–99: loading, load
  error, and not-found states; L101–126: trimmed local validation + save; L128–202: edit
  form with Save/Cancel; L204–224: read-only profile view with WSU badge.
- [src/features/profile/screens/ProfileScreen.tsx](../src/features/profile/screens/ProfileScreen.tsx#L226-L319)
  — L226–319: alphabetized styles using `Colors` tokens only.

**Summary:** Replaced the placeholder profile screen with loading/error/empty states, a
read-only profile view, and an edit mode that saves through the existing profile hooks.
Added a Cancel button and hides stale mutation errors until the next save attempt,
since the mutation hook cannot reset its error. File is ~319 lines — splitting the edit
form into its own component is a suggested follow-up. Verified with `tsc --noEmit`;
not yet run on a device.
## 2026-09-10 — CI/CD pipeline (Phase 5)

**Prompt:** "Phase 5 — CI/CD. P5.1 `.github/workflows/ci.yml` on `pull_request`:
install → typecheck → lint → format:check → test:ci → secret scan (trufflehog) →
migration up/down smoke against a Postgres service container. P5.2 mark these as
required status checks in branch protection (closes P0.1). P5.3 open a PR, let CI run,
download the logs, comment the run link + log excerpt on the related Issues." Read-first
check found `scripts/db-rollback.sh` and `*.down.sql` pairs (Phase 3) don't exist yet;
per user direction, shipped `migration-smoke` as forward-apply-only (applied twice
against a fresh database) rather than blocking on that.

**Files changed:**
- [../.github/workflows/ci.yml](../.github/workflows/ci.yml) — new: `quality`
  (`typecheck`/`lint`/`format:check`/`test:ci`, coverage artifact), `secret-scan`
  (TruffleHog pinned to `363923b` / `v3.97.4`, PR-diff scan via `base`/`head`, full
  history on `push`), `migration-smoke` (`postgres:15` service container; bootstraps a
  minimal `auth` schema/`anon`/`authenticated` roles inline since the container has no
  GoTrue, applies `supabase/migrations/*.sql`, drops and re-applies from scratch, logs
  to `migration-smoke.log` artifact).
- [../src/lib/env.ts](../src/lib/env.ts#L8-L45) — fixed pre-existing lint failures
  blocking a green `quality` run: `readPublicEnv()` is now a function (read live) instead
  of a module-level `const` (was snapshotted at import time, silently breaking
  `env.test.ts`'s `process.env` mutation tests once the unused-var/unnecessary-assertion
  lint errors were fixed the naive way).
- [../src/features/marketplace/screens/MarketplaceScreen.tsx](../src/features/marketplace/screens/MarketplaceScreen.tsx) —
  `eslint --fix` (Prettier-only formatting, no behavior change) to clear pre-existing
  `prettier/prettier` lint errors.
- [../README.md](../README.md#L44-L62) — new "CI" section: what each job checks, where
  to see results, how to read `migration-smoke.log`.
- [../knowledge/architecture.md](../knowledge/architecture.md#L186) +
  [L201-L215](../knowledge/architecture.md#L201-L215) — "used by CI once it exists" →
  "run by the `quality` CI job"; new "CI" section describing the three required checks
  and the `migration-smoke` auth stub.
- [../CONTRIBUTING.md](../CONTRIBUTING.md#L45-L48) — "CI runs the same once it exists" →
  points at the three required checks and the README CI section.

**Summary:** Added a three-job required CI pipeline (`quality`, `secret-scan`,
`migration-smoke`) pinned to exact Action versions/SHAs, fixed two pre-existing lint
failures on `main` that would otherwise fail the first `quality` run, and refreshed
docs that assumed CI didn't exist yet. Validated locally: ran the exact
`migration-smoke` script against a throwaway `postgres:15` Docker container (forward
apply, reset, forward re-apply — both clean); `npm run typecheck` / `lint` /
`format:check` / `test:ci` all exit 0 (11/11 tests). Live-verified on
[PR #44](https://github.com/WUnified/wunified/pull/44): a deliberately broken lint
rule failed only the `quality` check ([run](https://github.com/WUnified/wunified/actions/runs/34559450447))
while `secret-scan`/`migration-smoke` stayed green, reverted, then a clean push showed
all three green ([run](https://github.com/WUnified/wunified/actions/runs/34559712084)).
Set `quality`/`secret-scan`/`migration-smoke` as required status checks on `main`
(`gh api .../branches/main/protection`), preserving the existing 1-approval +
code-owner-review rule. No open GitHub Issue matched "P0.1" or a Phase 5 CI tracking
item, so the P5.3 issue-comment step was skipped — flagged to the user rather than
guessed at.

---

## 2026-09-10 — Marketplace wireframe polish and listing-card interactions

**Prompt:** "What could be missing from this wireframe that should be added? Remove the bottom bar. Remove the square outline and fit to screen. Add these items to the filter button: [categories]. The filter menu should only be visible when tapped on. Add these same categories to the item listing cards. The Listing Card component should have a larger expanded state when tapped, and should toggle back to the smaller listing state with the price, category, and condition tags. Add a description box to each listing when expanded."

**Files changed:**
- [../src/features/marketplace/screens/MarketplaceScreen.tsx](../src/features/marketplace/screens/MarketplaceScreen.tsx#L1-L295) — L1–295: built the marketplace mock, filter drawer, expanded/compact card toggle, category tags, seller row, and the expanded description block.
- [../app/(tabs)/index.tsx](../app/(tabs)/index.tsx#L1-L18) — L1–18: mounted the marketplace screen in the signed-in tab shell as the active home view.

**Summary:** Refined the marketplace mock into a tappable, filterable listing screen with hidden-on-demand filters, category chips, compact/expanded card states, and user-facing item descriptions to match the requested UI direction.

---

## 2026-09-10 — Tooling: Conventional Commits + pre-commit hooks (Phase 1, PR 3)

**Prompt:** "Phase 1 — Tooling foundation, PR 3 `chore/commitlint-husky`. Enforce
Conventional Commits and run lint/format on staged files pre-commit. Add pinned dev
deps `husky`, `@commitlint/cli`, `@commitlint/config-conventional`, `lint-staged`.
`commitlint.config.js` extends `@commitlint/config-conventional`; allowed types
`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`, `ci`, `perf`, `style`,
`revert`; keep `body-max-line-length` relaxed so the `Co-Authored-By:` trailer and
AI-log context aren't rejected. Husky: `"prepare": "husky"`, `.husky/commit-msg` →
`npx --no -- commitlint --edit \"$1\"`, `.husky/pre-commit` → `npx --no -- lint-staged`.
`lint-staged`: `*.{ts,tsx}` → `eslint --fix` + `prettier --write`, `*.{json,md,yml,yaml}`
→ `prettier --write`. Docs (required): rewrite the `CONTRIBUTING.md` 'Commits'
subsection for Conventional Commits (format, allowed types, 2–3 examples, keep the
`Co-Authored-By:` trailer rule, note release-please-generated changelog in Phase 5);
apply the matching change to the `AGENTS.md` 'Git & GitHub' bullet and its verbatim
copy `.github/copilot-instructions.md`. Optionally seed `release-please-config.json` +
`.release-please-manifest.json` at `0.1.0` (no GitHub Action here). Verify a bad
message is rejected and a Conventional one passes; keep `tsc --noEmit` passing."

**Files changed:**
- [../package.json](../package.json#L18-L22) — L18: `"prepare": "husky"`; L20–23: a
  top-level `lint-staged` block; pinned dev deps `husky@9.1.7`, `@commitlint/cli@21.2.2`,
  `@commitlint/config-conventional@21.2.2`, `lint-staged@17.5.1` (+ `package-lock.json`).
- [../commitlint.config.js](../commitlint.config.js) — new: extends config-conventional,
  the 11-type `type-enum`, `body-max-line-length` and `footer-max-line-length` disabled.
- `.husky/commit-msg`, `.husky/pre-commit` — new hook scripts (husky v9);
  `npm run prepare` set `core.hooksPath`.
- [../release-please-config.json](../release-please-config.json),
  [../.release-please-manifest.json](../.release-please-manifest.json) — new, seeded at
  `0.1.0` with `release-type: simple` (does not touch `package.json` version). No
  workflow — Phase 5 adds that.
- [../CONTRIBUTING.md](../CONTRIBUTING.md#L20-L40) — "Commits" subsection rewritten for
  Conventional Commits.
- [../AGENTS.md](../AGENTS.md#L148-L153) +
  [../.github/copilot-instructions.md](../.github/copilot-instructions.md#L148-L153) —
  the "Git & GitHub" commit bullet updated identically (files stay byte-for-byte equal).

**Summary:** Added `commitlint` (Conventional Commits, 11 allowed types, relaxed body/
footer length) on a Husky `commit-msg` hook and `lint-staged` (eslint --fix + prettier)
on `pre-commit`, rewrote the commit guidance in `CONTRIBUTING.md` / `AGENTS.md` /
`.github/copilot-instructions.md`, and seeded release-please config for Phase 5.
Validated: `echo "add stuff" | commitlint` and `echo "wip: x" | commitlint` both
rejected, `echo "chore: add commitlint and husky" | commitlint` passes (as does a
long body + `Co-Authored-By:` trailer); `npm run lint` / `format:check` / `typecheck`
still exit 0.

## 2026-09-10 — Tooling: Jest unit-test runner (Phase 1, PR 2)

**Prompt:** "Phase 1 — Tooling foundation, PR 2 `chore/jest-setup`. A working unit-test
runner with at least two real tests and coverage output. Add pinned dev deps `jest`,
`jest-expo` (SDK-compatible line), `@types/jest`, `@testing-library/react-native` (React
19 support), and `react-test-renderer` matching React if the preset needs it. Add
`jest.config.js` — `preset: jest-expo`, RN/Expo `transformIgnorePatterns` from the
docs, `collectCoverageFrom` for `src/**` + `app/**` excluding `*.d.ts` / type-only /
barrels, and a low honest `coverageThreshold` (lines ~5%). Add `test` / `test:watch` /
`test:ci` scripts. Extend the ESLint flat config with a test override (Jest globals for
`*.test.ts(x)` / `*.spec.ts(x)`). Write deterministic tests, no network, no real
Supabase: `src/lib/env.test.ts` covering `getSupabaseEnv` and
`getMissingSupabaseEnvNames` with `process.env` manipulated per-test and restored, plus
one more test on an existing pure unit (extract the pure part rather than mocking the
Supabase SDK). Add `/coverage` to `.gitignore`, `.prettierignore`, ESLint ignores. Keep
`tsc --noEmit` passing; add a `knowledge/architecture.md` 'Testing' section." (Also
required by the task: resolve the pre-existing merge-conflict markers committed in
`.gitignore`.)

**Files changed:**
- [../package.json](../package.json#L15-L48) — L15–18: `test` / `test:watch` /
  `test:ci`; pinned dev deps `jest@29.7.0`, `jest-expo@57.0.5`, `@types/jest@29.5.14`,
  `@testing-library/react-native@13.3.3`, `react-test-renderer@19.2.3` (jest-expo is
  built on Jest 29 and pins react-test-renderer to the installed React; RNTL 13 is the
  stable React-19 line) (+ `package-lock.json`).
- [../jest.config.js](../jest.config.js) — new: `jest-expo` preset, `setupFiles`,
  `transformIgnorePatterns`, `collectCoverageFrom` (also excludes generated
  `src/types/**`), `coverageThreshold` `{ lines: 5 }`.
- [../jest.setup.js](../jest.setup.js) — new: mock the AsyncStorage **native module**
  with the package's in-memory mock so modules that reach `src/lib/db` load under Jest
  (the Supabase client itself is not mocked).
- [../eslint.config.js](../eslint.config.js#L78-L92) — Jest globals for `jest.setup.js`
  (test files import from `@jest/globals`).
- [../.gitignore](../.gitignore) — resolved the committed `<<<<<<< / ======= / >>>>>>>`
  markers: kept the curated Expo/RN list (the HEAD side) rather than a literal union of
  the 140-line generic Node template, and added `/coverage`, `*.lcov`, `.nyc_output`,
  `.eslintcache`, `*.log`.
- [../src/features/profile/api.ts](../src/features/profile/api.ts#L4-L7) — `export` the
  already-extracted `mapProfile` so it can be unit-tested without a DB client.
- [../src/lib/env.test.ts](../src/lib/env.test.ts) — new: 7 cases over the two env
  helpers; mutates `process.env` in place and restores it.
- [../src/features/profile/api.test.ts](../src/features/profile/api.test.ts) — new: 4
  cases over `mapProfile` (null row, full mapping, avatar passthrough, no shared ref).
- [../knowledge/architecture.md](../knowledge/architecture.md) — new "Testing" section;
  dropped the "Add a test runner" line from Open Work.

**Summary:** Added a Jest (`jest-expo`) unit-test runner with `test` / `test:watch` /
`test:ci` scripts, two real deterministic test files (11 cases) mocking only the
AsyncStorage native module, coverage output with a 5%-lines floor, and resolved the
merge-conflict markers that were sitting committed in `.gitignore`. Validated:
`npm run test:ci` green with a coverage summary, `npm run lint` / `format:check` /
`typecheck` all exit 0.

## 2026-09-10 — Tooling: ESLint + Prettier (Phase 1, PR 1)

**Prompt:** "Phase 1 — Tooling foundation, PR 1 `chore/eslint-prettier`. ESLint +
Prettier configured for an Expo/RN/TypeScript-strict codebase, wired to npm scripts,
with the whole existing tree passing. Use ESLint flat config (`eslint.config.js`)
extending `eslint-config-expo/flat`; add `typescript-eslint` recommended-type-checked
rules for `**/*.ts(x)` and turn on `@typescript-eslint/no-explicit-any`,
`no-floating-promises`, `consistent-type-imports`, and import ordering matching
`AGENTS.md` (external → internal → relative, alphabetised, newline between groups).
Run Prettier via `eslint-plugin-prettier` and as a standalone script, with
`eslint-config-prettier` last. Add `.prettierrc` (`singleQuote`, `semi`,
`trailingComma: all`, `printWidth: 100`, `arrowParens: always`) and `.prettierignore`.
Add `lint` / `lint:fix` / `format` / `format:check` / `typecheck` scripts. Run
`lint:fix` + `format`, hand-review every changed file, revert behaviour/unrelated
churn; if a rule forces a large diff, disable it at config level with a comment, not
inline. Every new dep pinned to an exact version. Update `CONTRIBUTING.md` pre-PR
checks and add a `knowledge/architecture.md` 'Tooling: lint & format' section. Keep
`tsc --noEmit` passing." (Deviations from the task text, confirmed with the user:
targeted the actual repo — Expo SDK 57 / React 19.2 / TS ~6.0.3, not SDK 54; branch
`rr/chore/eslint-prettier` since the Phase 0 naming change is unmerged; `eslint@9`
because `eslint-config-expo@57` is not ESLint-10-ready; markdown + `app.json` added to
`.prettierignore` so the format pass didn't reflow hand-wrapped docs.)

**Files changed:**
- [../eslint.config.js](../eslint.config.js) — new flat config: Expo base +
  type-checked TS rules + `import/order` + Prettier last; scoped
  `react-hooks/set-state-in-effect` off for `SessionProvider.tsx`; Node globals for
  `*.js`.
- [../.prettierrc](../.prettierrc), [../.prettierignore](../.prettierignore) — new.
- [../package.json](../package.json#L6-L40) — L6–14: five scripts; L30–39: pinned dev
  deps `eslint@9.39.5`, `eslint-config-expo@57.0.2`, `eslint-config-prettier@10.1.8`,
  `eslint-plugin-prettier@5.5.6`, `prettier@3.9.6`, `typescript-eslint@8.70.0`
  (+ `package-lock.json`).
- [../src/lib/env.ts](../src/lib/env.ts#L6-L15) — L6–15: read `process.env` through a
  narrow typed view so the two public keys are `string | undefined` (clears
  `no-unsafe-assignment`).
- [../src/lib/db/chat.ts](../src/lib/db/chat.ts#L12-L21) — L12–21: `fetchChatMessages`
  drops `async` for `Promise.resolve(...)` (clears `require-await`); signature and
  behaviour unchanged.
- [../src/lib/db/profiles.ts](../src/lib/db/profiles.ts#L40-L115) — removed two
  redundant `as Profile` assertions (`no-unnecessary-type-assertion`); `tsc` still
  passes.
- `app/_layout.tsx`, `app/(auth)/signup.tsx`, `src/features/auth/*`,
  `src/features/{chat,profile}/{api,hooks}.ts` — Prettier formatting + `import/order`
  reordering only, no behaviour change.
- [../CONTRIBUTING.md](../CONTRIBUTING.md) — pre-PR checks now list `npm run lint` /
  `format:check` / `typecheck`.
- [../knowledge/architecture.md](../knowledge/architecture.md) — new "Tooling: lint &
  format" section.

**Summary:** Added an ESLint flat config (Expo + type-checked TypeScript + import
ordering + Prettier) and a Prettier config with npm scripts, brought the whole tree
to green with minimal compliant fixes (typed `process.env` view, `Promise.resolve`
placeholder, dropped redundant assertions) and formatting/import-order only elsewhere.
Validated: `npm run lint`, `npm run format:check`, `npm run typecheck` all exit 0.

---

## 2026-09-10 — Feature-first folder structure on Expo Router

**Prompt:** "Migrate WUnified to a feature-first folder structure on Expo Router.
Structure-only change to prep for the marketplace + community rebrand — no product
features, no backend/schema changes. Preserve all working code, especially the Supabase
auth flow. Install `expo-router` + `react-native-safe-area-context` + `react-native-screens`;
set `main` to `expo-router/entry` and add a `scheme`. `git mv` the real auth screens from
`app/auth/{login,signup}.tsx` to `src/features/auth/screens/`; `git rm` the empty
`app/tabs/*` + `app/auth/layout.tsx` stubs and `App.tsx` / `index.ts`. Port the `App.tsx`
session logic verbatim into `src/features/auth/SessionProvider.tsx` + `hooks.ts`. Build
the `app/` routing layer: root `_layout.tsx` (providers + not-configured/loading gate),
`(auth)/_layout.tsx` and `(tabs)/_layout.tsx` redirect guards, and thin route files for
login/signup + four tabs (`index` = Marketplace, community, chat, profile). Add placeholder
screens + empty `api/hooks/types` stubs per feature, `src/constants/colors.ts`, and a
generated `src/types/database.ts`. Verify with `tsc --noEmit` + an `expo export` bundle.
Update `AGENTS.md` (+ its `.github/copilot-instructions.md` copy),
`knowledge/architecture.md`, `knowledge/feature-module-structure.md`, and `README.md` to
match. Out of scope: feature logic, Supabase schema/RLS/migrations, edits to
`src/lib/{supabase,env,db}` contents."

**Files changed:**
- [../package.json](../package.json#L4) — `main` → `expo-router/entry`; added `expo-router`,
  `react-native-safe-area-context`, `react-native-screens`.
- [../app.json](../app.json#L7) — added `"scheme": "wunified"`; `expo-router` config plugin.
- [../app/_layout.tsx](../app/_layout.tsx) — new root layout: `SafeAreaProvider` +
  `SessionProvider` + the Supabase-not-configured / session-loading / auth-error gate
  (ported from the old `App.tsx`).
- [../app/(auth)/_layout.tsx](../app/(auth)/_layout.tsx),
  [../app/(auth)/login.tsx](../app/(auth)/login.tsx),
  [../app/(auth)/signup.tsx](../app/(auth)/signup.tsx) — auth route group + redirect guard.
- [../app/(tabs)/_layout.tsx](../app/(tabs)/_layout.tsx) + `index/community/chat/profile.tsx`
  — signed-in `<Tabs>` + redirect guard; each route re-exports a feature screen.
- [../src/features/auth/SessionProvider.tsx](../src/features/auth/SessionProvider.tsx),
  [../src/features/auth/hooks.ts](../src/features/auth/hooks.ts),
  [../src/features/auth/index.ts](../src/features/auth/index.ts) — session context,
  `useSession` / `useSignOut`, barrel.
- `src/features/auth/screens/{LoginScreen,SignupScreen}.tsx` — `git mv` from
  `app/auth/{login,signup}.tsx`; only the `src/lib/supabase` import path changed.
- `src/features/{marketplace,community,chat,profile}/` — placeholder `screens/*Screen.tsx`,
  empty `api.ts` / `hooks.ts` / `types.ts` stubs, `index.ts` barrels.
- [../src/constants/colors.ts](../src/constants/colors.ts) — new color tokens.
- [../src/types/database.ts](../src/types/database.ts) — generated from the live Supabase
  schema (`supabase gen types typescript`).
- Removed: `App.tsx`, `index.ts`, `app/tabs/*`, `app/auth/layout.tsx`.
- Docs: [../AGENTS.md](../AGENTS.md#L21) + `.github/copilot-instructions.md` (kept
  identical), [../README.md](../README.md), [../knowledge/architecture.md](../knowledge/architecture.md),
  [../knowledge/feature-module-structure.md](../knowledge/feature-module-structure.md),
  [../knowledge/auth-session-management.md](../knowledge/auth-session-management.md)
  (status flipped to "wired", points at `src/features/auth/`), and the guides
  [quickstart](../knowledge/guides/quickstart.md) /
  [how-to-add-a-screen](../knowledge/guides/how-to-add-a-screen.md) /
  [how-to-add-a-feature-module](../knowledge/guides/how-to-add-a-feature-module.md) /
  [how-to-add-a-component](../knowledge/guides/how-to-add-a-component.md) — all rewritten
  for Expo Router routing, feature-first `screens/`, `src/lib/db/`, and the new
  `colors.ts` tokens.

**Summary:** Replaced the hand-rolled `App.tsx` navigation/auth shell with Expo Router
file-based routing and a feature-first `src/features/<feature>/` layout, preserving the
working Supabase auth flow verbatim, and brought every doc (ruleset, architecture,
feature-module structure, auth, and all four guides) in line with the new layout.
Verified via `tsc --noEmit` and a clean `expo export` bundle; interactive four-state
auth check still needs a simulator run.
