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

## 2026-09-10 — Remove temporary marketplace UI

**Prompt:** "Let's add relevant comments to major sections and delete the current UI changes for marketplace, we will let the others design the marketplace later"

**Files changed:**
- [../src/features/marketplace/screens/MarketplaceScreen.tsx](../src/features/marketplace/screens/MarketplaceScreen.tsx#L1-L29) — restored the placeholder screen while retaining the data layer.
- [../supabase/migrations/20260910000500_create_public_profiles.sql](../supabase/migrations/20260910000500_create_public_profiles.sql#L1-L100) — added comments for the public/private boundary, synchronization, backfill, and foreign key.
- [../knowledge/architecture.md](../knowledge/architecture.md#L48-L54) — clarified that the marketplace screen remains a placeholder.

**Summary:** Removed the temporary marketplace UI and documented the important public-profile schema decisions for the future feature team.

---

## 2026-09-10 — Rename public seller profiles table

**Prompt:** "ok lets just change public_seller_profiles to public_profiles"

**Files changed:**
- [../supabase/migrations/20260910000500_create_public_profiles.sql](../supabase/migrations/20260910000500_create_public_profiles.sql#L1-L90) — renamed the public identity table, policy, trigger, and listing foreign key.
- [../src/lib/db/listings.ts](../src/lib/db/listings.ts#L1-L110) — updated the joined DTO source and relationship name.
- [../knowledge/architecture.md](../knowledge/architecture.md#L58-L62) — updated the shared public identity name.

**Summary:** The shared public identity table is now named `public_profiles` so it can support marketplace, chat, and discussion features.

---

## 2026-09-10 — Separate public seller profile projection

**Prompt:** "let's go ahead and make the seller table that has the appropriate information for the marketplace so we can add private columns to profiles later"

**Files changed:**
- [../supabase/migrations/20260910000500_create_public_profiles.sql](../supabase/migrations/20260910000500_create_public_profiles.sql#L1-L90) — public identity projection, sync trigger, RLS, and listing foreign key.
- [../src/lib/db/listings.ts](../src/lib/db/listings.ts#L1-L130) — marketplace join moved to the public identity table.
- [../supabase/seed.sql](../supabase/seed.sql#L1-L105) — removed obsolete commented fixture block.
- [../knowledge/architecture.md](../knowledge/architecture.md#L54-L62) — documented the private/public profile boundary.

**Summary:** Marketplace seller data now comes from a narrowly scoped public table while the main profiles table remains private.

---

## 2026-09-10 — Marketplace seed and minimal listings flow

**Prompt:** "Start implementation" following the requested database seeding, listings repository, marketplace feature layer, and P4.3 minimal market screen plan.

**Files changed:**
- [../supabase/seed.sql](../supabase/seed.sql#L1-L105) — deterministic Auth, profile, and marketplace fixtures.
- [../supabase/config.toml](../supabase/config.toml#L60-L65) — enabled local seed loading.
- [../src/lib/db/listings.ts](../src/lib/db/listings.ts#L1-L220) — class-based listings repository, DTO mapping, and error handling.
- [../src/features/marketplace/types.ts](../src/features/marketplace/types.ts#L1-L30), [../src/features/marketplace/api.ts](../src/features/marketplace/api.ts#L1-L40), [../src/features/marketplace/hooks.ts](../src/features/marketplace/hooks.ts#L1-L120) — marketplace contracts and feature state.
- [../src/features/marketplace/screens/MarketplaceScreen.tsx](../src/features/marketplace/screens/MarketplaceScreen.tsx#L1-L300) — temporary listing feed and creation form.
- [../knowledge/architecture.md](../knowledge/architecture.md#L54-L60) — documented Auth-backed seed constraint.

**Summary:** Added a local seeded marketplace path with joined seller DTOs and a temporary create-and-refresh screen for validating real data access.

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
