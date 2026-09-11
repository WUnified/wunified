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
