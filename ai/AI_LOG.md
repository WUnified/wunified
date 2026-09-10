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
