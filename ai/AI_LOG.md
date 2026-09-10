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
