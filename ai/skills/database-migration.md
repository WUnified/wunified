---
name: database-migration
description: "Use when: creating tables, schema changes, database migrations, RLS policies, safe data migrations"
yamltriggers: [migration, schema, "new table", "alter table", "add column", RLS, "row level security", "drop column", "change the DB", seed, "database change"]
---

# Database Migration Skill

Use this skill to design and implement safe schema changes, including new tables, migrations, and RLS policy updates.

## Goal
Deliver schema changes that enforce data safety, security (RLS), and backward compatibility without data loss or permission gaps.

## Inputs
- Schema change requirement (new table, column, policy, index)
- Data migration scope (if any)
- Affected features and data volume
- Rollback tolerance (can we roll back? how?)
- Relevant knowledge docs: `ai/knowledge/rls-patterns.md`

## Workflow
1. **Understand the change**: What data model change is needed? Why?
2. **Reference RLS patterns**: 
   - Is this creating a new table? Use Pattern 1–6 from `rls-patterns.md` as a template.
   - Which ownership/membership model applies?
3. **Design without breaking**:
   - Add columns as nullable first, then backfill, then add NOT NULL if needed.
   - Add new tables with RLS enabled from day one.
   - Never remove columns without deprecation period.
4. **Write migration SQL**:
   - Include table creation → RLS enable → policy creation as one unit.
   - Use migration numbering: `0001_initial_setup.sql`, `0002_add_chat_tables.sql`, etc.
5. **Verify RLS**:
   - Every new table must have explicit RLS policies for select/insert/update/delete.
   - Test policies against anon, authenticated, and expected owner/member roles.
6. **Document data assumptions**:
   - If migrating existing data, explain the mapping.
   - Call out any implicit constraints (e.g., "assumes user_id always matches auth.uid()").

## Output Format
1. Schema Change Summary
2. RLS Pattern Applied (reference the pattern from rls-patterns.md)
3. Migration SQL
4. Data Migration Plan (if applicable)
5. Rollback Strategy
6. Testing Steps
7. Assumptions and Risks

## Quality Bar
- RLS is enabled and policies are explicit for every table operation.
- Migrations are additive (new) or backward-compatible (alter).
- No data loss without documented approval.
- Rollback path is clear and tested.
- All policies match an approved pattern from `ai/knowledge/rls-patterns.md`.

## Anti-Patterns (Do NOT Do)
- Creating tables without RLS enabled.
- Using overly permissive policies (e.g., `using (true)` on private data).
- Removing columns or renaming tables without deprecation/migration.
- Assuming implicit constraints without testing.

## Reference
- Always consult `ai/knowledge/rls-patterns.md` before writing new policies.
