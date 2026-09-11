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

## 2026-09-10 — Marketplace wireframe polish and listing-card interactions

**Prompt:** "What could be missing from this wireframe that should be added? Remove the bottom bar. Remove the square outline and fit to screen. Add these items to the filter button: [categories]. The filter menu should only be visible when tapped on. Add these same categories to the item listing cards. The Listing Card component should have a larger expanded state when tapped, and should toggle back to the smaller listing state with the price, category, and condition tags. Add a description box to each listing when expanded."

**Files changed:**
- [../src/features/marketplace/screens/MarketplaceScreen.tsx](../src/features/marketplace/screens/MarketplaceScreen.tsx#L1-L295) — L1–295: built the marketplace mock, filter drawer, expanded/compact card toggle, category tags, seller row, and the expanded description block.
- [../app/(tabs)/index.tsx](../app/(tabs)/index.tsx#L1-L18) — L1–18: mounted the marketplace screen in the signed-in tab shell as the active home view.

**Summary:** Refined the marketplace mock into a tappable, filterable listing screen with hidden-on-demand filters, category chips, compact/expanded card states, and user-facing item descriptions to match the requested UI direction.

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
