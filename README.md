# wunified

WUnified is a campus marketplace for Wichita State University students that doubles as a
social hub — buy and sell with other Shockers, follow a campus social feed, track events,
and talk in community boards.  
Built by Team Campus Core for Senior Design.

## Tech Stack
- Expo + React Native + TypeScript (strict)
- `@react-navigation` (bottom tabs)
- Supabase (Auth + PostgreSQL + Storage) — planned, not wired yet
- Supabase Edge Functions (TypeScript) — planned

## Core Features
- **Campus Marketplace** — buy, sell, and trade with other WSU students
- **Social Feed** — campus posts with a ranking model
- **Community Boards** — topic-based chat boards for clubs, dorms, and interests
- **Event Calendar** — campus events and organization happenings
- More social features as the community grows

## Out of Scope
WUnified is **not** an academic tool. No class schedule, finances, timesheets, degree
planning, or myWSU integration — those are deliberately out of scope. Keep new features
on the marketplace + social side.

## Architecture
WUnified is a mobile-first React Native app built around two primary surfaces —
**Marketplace** and **Social** — plus an event calendar and community boards. Navigation
uses `@react-navigation` (bottom tabs): `App.tsx` mounts providers and
`src/navigation/AppNavigator.tsx`; each tab is a screen in `src/screens/`, composed from
`src/components/` and styled with tokens in `src/constants/`. The UI is currently built
against mock data (`src/constants/mockData.ts`). Supabase (Auth + PostgreSQL + RLS +
Storage) is the planned backend and is not wired yet.

> Some screens still carry pre-pivot scaffolding (a `Services` tab, academic entries in
> mock data). That is legacy and will be removed — do not build on it.

Full detail: [`knowledge/architecture.md`](knowledge/architecture.md).

## Getting Started
See [`knowledge/guides/quickstart.md`](knowledge/guides/quickstart.md) — `npm install`,
then `npm start` (or `npm run ios` / `android` / `web`).

## AI Framework (New Teammate Guide)
Development is **AI-first**: AI drafts most changes and a human reviews every diff.

| Where | What |
|---|---|
| [`AGENTS.md`](AGENTS.md) | The canonical ruleset — conventions, security rules, code quality bar, the why-not-what comment rule, the AI change log rule. `.github/copilot-instructions.md` is a synced copy for GitHub Copilot. |
| [`knowledge/`](knowledge/README.md) | Durable project knowledge for humans and AI — architecture, RLS/auth/error patterns, feature structure, and [`guides/`](knowledge/guides/) (quickstart, how-tos). |
| [`ai/skills/`](ai/skills/) | Task runbooks: planner, implementer, test, reviewer, docs-knowledge, database-migration, incident-debugging. |
| [`ai/AI_LOG.md`](ai/AI_LOG.md) | Log of major AI-made changes. |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Git & GitHub workflow (branches, commits, PRs, reviews) and the PR checklist. |

**New here?** Read [`AGENTS.md`](AGENTS.md), then run a change end-to-end following
[`knowledge/guides/working-with-ai.md`](knowledge/guides/working-with-ai.md).

## Team
- Ronish Rasaily – Infrastructure & System Architecture Lead
- Tammy Vu – Frontend & UX Lead
- Keaton Stwalley – Backend & Integration Lead
- Joanna Nguyen – Data & Algorithm Lead
