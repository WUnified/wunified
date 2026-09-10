# How to add a feature module

A **feature module** (`src/features/<feature>/`) owns the domain logic for one product
area — its types, its data access, and its React hooks. Screens consume a feature's
hooks; components stay presentational.

Use a feature module when a screen needs more than placeholder data: real fetching,
mutations, caching, realtime, or business rules shared across screens. Pure UI does not
need one.

## Layout

```
src/features/<feature>/
├── types.ts     # types & API contracts for this feature
├── api.ts       # data operations — calls src/lib/db/, never the Supabase client directly
├── hooks.ts     # useXxx hooks: state + loading/error, call api.ts
├── constants.ts # feature-only constants (optional)
├── utils.ts     # pure helpers (optional)
└── index.ts     # barrel export of the public surface
```

## Rules (the short version)

- **Types first.** Define `types.ts` before logic.
- **One data path.** `api.ts` calls `src/lib/db/` helpers; it does not import the
  Supabase client. This keeps every query auditable in one place and makes tests mock
  `src/lib/db` instead of the network.
- **Hooks own state.** `hooks.ts` manages loading / success / error and cleans up
  subscriptions. Screens just render what the hook returns.
- **Map errors at the boundary.** `api.ts` converts low-level DB errors into
  feature-readable messages — see [../error-handling-patterns.md](../error-handling-patterns.md).
- **Barrel export.** Consumers import from `@/features/<feature>` (relative for now:
  `../features/<feature>`), not deep paths.
- **Split at ~200 lines** or when a file does two jobs. Complex features get
  sub-folders (`threads/`, `reactions/`) that follow the same shape.

## Full reference

[../feature-module-structure.md](../feature-module-structure.md) has the complete
structure, file-by-file responsibilities, examples, and the new-feature checklist.
Related: [../architecture.md](../architecture.md) for how a request flows UI →
feature → `src/lib/db/` → Supabase.
