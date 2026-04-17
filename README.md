# wunified

WUnified is an all-in-one digital hub for Wichita State University students.  
Built by Team Campus Core for Senior Design.

## Tech Stack
- React Native (TypeScript)
- Supabase (Auth + PostgreSQL + Storage)
- Supabase Edge Functions (TypeScript)

## Core Features
- Academic Dashboard (Schedule, Finances, Timesheets)
- Social Feed with Ranking Model
- Campus Marketplace
- Real-time Chat
- Event & Organization Management

## Architecture
WUnified uses a mobile-first architecture with React Native as the frontend and Supabase as the backend infrastructure. Authentication is handled via Supabase Auth (JWT-based), and data security is enforced using PostgreSQL Row-Level Security (RLS).

## AI Framework (New Teammate Guide)
WUnified uses an AI-assisted engineering workflow with shared instructions, skills, and knowledge documents.

### Framework Folders
- `.github/copilot-instructions.md`: Team-wide AI coding rules, conventions, and security requirements.
- `ai/knowledge/`: Durable project knowledge (architecture decisions, RLS patterns, bug learnings, and design rationale).
  - `architecture.md` — Overall system design and data flow
  - `rls-patterns.md` — Approved RLS policy templates
  - `feature-module-structure.md` — How to organize feature code
  - `auth-session-management.md` — Auth initialization and error handling
  - `error-handling-patterns.md` — Error classification and handling strategies
  - `ai-workflow.md` — AI framework and skill governance
- `ai/skills/`: Task-specific runbooks for AI workflows (for example AI code review).
- `CONTRIBUTING.md`: Contributor process and required PR checklist.

### When To Use Which Skill
- Use `ai/skills/reviewer-agent.md` before opening or merging a PR.
- Use `ai/skills/planner-agent.md` to turn requests/issues into scope, risks, and acceptance criteria.
- Use `ai/skills/implementer-agent.md` to implement approved scope in small PR-sized slices.
- Use `ai/skills/test-agent.md` to add or update tests and verify changed behavior.
- Use `ai/skills/reviewer-agent.md` for structured correctness/security/regression reviews.
- Use `ai/skills/docs-knowledge-agent.md` to update docs and `ai/knowledge/` after meaningful changes.
- Use `ai/skills/database-migration.md` for schema changes, RLS policy updates, and safe migrations.
- Use `ai/skills/incident-debugging.md` for diagnosing and fixing production issues and bugs.
- Use a skill when you need a repeatable workflow with a clear output format.
- If no skill exists for a recurring task, create one in `ai/skills/` so future sessions stay consistent.

### Complex Session Rule
For complex tasks (multi-file features, architecture changes, security-sensitive changes, or ambiguous bugs), include relevant `ai/knowledge/*.md` docs in the AI session context/prompt so the model uses project-specific decisions instead of generic assumptions.

### PR Checklist
See `CONTRIBUTING.md` for the required checklist, including:
- AI review run using `/ai/skills/reviewer-agent.md`
- Findings addressed or noted in PR description
- Human teammate reviewed

## Team
- Ronish Rasaily – Infrastructure & System Architecture Lead
- Tammy Vu – Frontend & UX Lead
- Keaton Stwalley – Backend & Integration Lead
- Joanna Nguyen – Data & Algorithm Lead
