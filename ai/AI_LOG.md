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
