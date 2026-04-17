---
name: docs-knowledge-agent
description: "Use when: updating documentation, writing ADRs, recording decisions, updating knowledge base, documenting patterns, migration notes"
yamltriggers: ["update the docs", "add to knowledge", "document this", "write a runbook", ADR, "why did we", "how does X work", "log this decision", pattern, "for future reference"]
---

# Docs and Knowledge Agent Skill

Use this skill to keep docs and repository knowledge accurate after code or architecture changes.

## Goal
Ensure implementation changes are reflected in docs, ADR-style notes, migration notes, and operational runbooks.

## Inputs
- Summary of code changes
- Files changed
- Decisions made and trade-offs
- Any migration or rollout impact

## Workflow
1. Identify which docs should change (`README.md`, `CONTRIBUTING.md`, `ai/knowledge/*.md`, feature docs).
2. Update existing knowledge docs or create a focused new file if needed.
3. Capture what changed, why, constraints, and follow-up actions.
4. Note migration/compatibility requirements when contracts change.
5. Ensure language is concise, durable, and team-usable.

## Output Format
1. Docs Updated
2. Knowledge Entries Added/Updated
3. Decision Summary
4. Constraints and Follow-Ups

## Quality Bar
- Every meaningful architecture/pattern/bug change has a knowledge update.
- Documentation matches the current repo structure and conventions.
- No stale references or placeholder guidance.
