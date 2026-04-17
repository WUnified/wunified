# WUnified Copilot Instructions

## Purpose
These instructions guide AI agents and contributors to make safe, consistent, and maintainable code changes in this repository.

## Stack Overview
- Frontend: Expo + React Native + TypeScript
- Runtime: React 19, React Native 0.81
- Routing/UI structure: Expo app directory layout under `app/`
- Backend services: Supabase (Auth, PostgREST, Storage, Edge Functions)
- Database: PostgreSQL (with RLS expected for protected data)

## Repository Structure
Use the current layout as the source of truth:

- `app/`: App routes and screen-level files
- `app/auth/`: Authentication screens and auth layout
- `app/tabs/`: Tab screen routes
- `src/features/`: Feature modules (domain-oriented code)
- `src/lib/`: Shared infrastructure and client setup (for example Supabase client and env)
- `assets/`: Static assets
- Root config files: `app.json`, `package.json`, `tsconfig.json`

When adding new code, prefer placing it in `src/features/<feature>/` and keep route files in `app/` focused on composition and screen-level concerns.

## Naming Conventions
- Use TypeScript everywhere for app and shared code.
- Use `PascalCase` for React components and component filenames when they are reusable UI components.
- Use lowercase route filenames in `app/` (for example `login.tsx`, `signup.tsx`) to align with route naming.
- Use `camelCase` for variables, functions, and hooks internals.
- Prefix custom hooks with `use` (for example `useChatMessages`).
- Use `UPPER_SNAKE_CASE` for compile-time constants and env key names.
- Use descriptive names over abbreviations unless the abbreviation is standard and unambiguous.

## Import Rules
- Prefer explicit named imports over wildcard imports.
- Keep import groups ordered as:
  1. External packages
  2. Internal modules
  3. Relative local imports
- Until a path alias is formally configured in `tsconfig.json`, prefer relative imports for local files.
- Avoid fragile deep relative chains when possible by adding local barrel files inside feature folders (for example `src/features/chat/index.ts`) where this improves readability.
- Do not introduce circular imports between features or shared libraries.

## Coding Guidelines
- Follow strict TypeScript practices:
  - Avoid `any`; use explicit types or `unknown` with narrowing.
  - Type API boundaries (request/response, DB rows, and service return shapes).
- Keep components and modules small and focused; split files that are doing multiple concerns.
- Prefer pure utility functions for reusable logic and keep side effects isolated.
- Handle async flows with clear loading, success, and error states.
- Fail safely: surface actionable errors and do not swallow exceptions silently.
- Keep auth-sensitive logic centralized and enforce least-privilege access patterns.
- For Supabase queries, request only required fields instead of broad selects.
- Add or update tests when behavior changes (unit/integration where applicable).
- Update docs (README or feature docs) when architecture, setup, or contracts change.

## Required Conventions
- Route all database queries and DB access helpers through `src/lib/db/`; do not issue direct table queries from feature or UI layers.
- Require Row-Level Security (RLS) on every PostgreSQL table. New tables must not be merged without explicit RLS policies.
- Use functional React components only. Do not introduce class-based components.
- Do not use raw `any`. If `any` is temporarily unavoidable, include an inline comment explaining why and a follow-up action to remove it.
- Never expose the Supabase service role key in client code, app bundles, logs, or public env files. Service role credentials must remain server-side only.
- Handle Supabase authentication errors explicitly in all auth flows. Do not ignore or silently swallow auth failures.
- Enforce TypeScript strict mode for all app and shared code. Do not disable strict checks in project or local file configurations.

## Pull Request Checklist
- [ ] AI review run using `/ai/skills/reviewer-agent.md`
- [ ] Relevant `/ai/knowledge/` files created or updated
- [ ] RLS policy included for any new tables
- [ ] No service role key in client code

## Context For Complex Sessions
- For tasks spanning multiple files or features, paste the relevant `ai/knowledge/*.md` document at the start of the session before asking follow-up questions.

## Knowledge Base Rule
- After completing any task that adds a feature, changes architecture, introduces a new pattern, or reveals a bug worth remembering, draft an update to the relevant file in `ai/knowledge/`.
- If no relevant knowledge file exists, create one in `ai/knowledge/` with a focused topic name.
- Complete this knowledge-base update before ending the work session.
- Knowledge updates should capture what changed, why the decision was made, and any constraints or follow-up actions.

## AI Agent Behavior Rules
- Before editing, inspect nearby code patterns and reuse existing conventions.
- When starting a complex task, check `ai/skills/` for a relevant prompt or workflow template before proceeding.
- Prefer minimal diffs; do not reformat unrelated files.
- Do not modify generated files unless the task explicitly requires it.
- If requirements are unclear, propose assumptions and keep changes reversible.
- When adding new dependencies, justify the need and choose mature, maintained packages.