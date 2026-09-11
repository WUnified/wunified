# wunified

WUnified is a campus marketplace for Wichita State University students that doubles as a
social hub — buy and sell with other Shockers, follow a campus social feed, track events,
and talk in community boards.  
Built by Team Campus Core for Senior Design.

## Tech Stack
- Expo + React Native + TypeScript (strict)
- Expo Router (file-based routing; bottom tabs for the signed-in area)
- Supabase Auth — wired (login / signup / session gate)
- Supabase PostgreSQL + RLS — first queries landing (`profiles`); most features, Storage,
  and Edge Functions not wired yet

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
is file-based with Expo Router: `app/` holds thin route files and `_layout.tsx`
navigators, and each route renders a screen from `src/features/<feature>/screens/`,
composed from `src/components/` and styled with tokens in `src/constants/`. The root
`app/_layout.tsx` mounts providers and a Supabase auth gate (`src/features/auth/`).
Supabase Auth is wired, and profile reads/writes go through `src/lib/db/profiles.ts`;
chat uses a placeholder adapter (`src/lib/db/chat.ts`, no tables yet), and marketplace,
community, events, and Storage are not wired.

Full detail: [`knowledge/architecture.md`](knowledge/architecture.md).

## Getting Started

The whole local stack — Postgres (migrated + seeded), auth, a REST API, and the Expo
web app — comes up with one command. You need **Docker** (Desktop or Engine + Compose
v2); nothing else.

```bash
git clone <repo-url>
cd wunified
cp .env.example .env      # local-only defaults, works unedited
docker compose up         # or: npm run dev:up
```

Then open **http://localhost:8081**. Login / signup runs against the containerized
GoTrue. The first `up` pulls Postgres, GoTrue, PostgREST, and nginx and builds the web
image — **~3–6 minutes** depending on your connection; later starts take seconds.

| Service | Where | Purpose |
|---|---|---|
| Expo web | http://localhost:8081 | The app (Metro + web bundle) |
| API gateway | http://localhost:54321 | Supabase-style endpoint — `/auth/v1/*` → GoTrue, everything else → PostgREST |
| Postgres | `postgresql://postgres:postgres@localhost:54322/postgres` | Database (migrations + seed applied on start) |
| Studio | http://localhost:54323 | DB browser — opt-in: `docker compose --profile studio up` |

Convenience wrappers (thin — plain `docker compose up` works on its own):

```bash
npm run dev:up      # docker compose up
npm run dev:down    # docker compose down
npm run dev:reset   # docker compose down -v && docker compose up   (wipe + rebuild)
npm run dev:logs    # docker compose logs -f
```

`docker compose down -v` fully resets the stack — the next `up` re-migrates and
re-seeds from scratch.

Contributors who have the **Supabase CLI** can still run `supabase start` instead;
`supabase/config.toml` is unchanged and the compose stack is additive. See
[`knowledge/local-dev.md`](knowledge/local-dev.md) for how the containers fit together.

### Running on a device / simulator

For Expo Go, the iOS Simulator, or an Android emulator (outside Docker), see
[`knowledge/guides/quickstart.md`](knowledge/guides/quickstart.md) — `npm install`,
then `npm start` (or `npm run ios` / `android` / `web`), pointed at the same local
stack via `.env`.

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
