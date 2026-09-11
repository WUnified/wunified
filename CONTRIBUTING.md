# Contributing to WUnified

Development here is **AI-first**: AI drafts most changes, and a human reviews every diff
before it merges. Keep changes small, explain decisions in comments (why, not what), and
make sure both the AI review and a human review happen.

Start with [`/AGENTS.md`](AGENTS.md) — it's the canonical ruleset (conventions, security
rules, code quality bar, the AI change log rule). For task context, read the relevant
doc in [`knowledge/`](knowledge/README.md).

## Git & GitHub Workflow

### Branches
- `main` is always deployable. Never push to it directly — every change goes through a PR.
- Branch from an up-to-date `main`. Name branches `<initials>/<type>/<short-description>`,
  e.g. `rr/feature/marketplace-listing-card`, `tv/fix/tab-bar-icons`.
  Types: `feature`, `fix`, `chore`, `docs`, `refactor`.
- One branch = one logical change. Delete the branch after it merges.

### Commits
- Small, self-contained commits — each should build and stand on its own.
- **[Conventional Commits](https://www.conventionalcommits.org):** the subject is
  `type(scope): summary` — imperative, lower-case, no trailing period, ~72 chars.
  `commitlint` enforces this on `commit-msg` (see `commitlint.config.js`).
  - Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`,
    `ci`, `perf`, `style`, `revert`.
  - `scope` is optional and names the area touched (a feature, `db`, `ci`, …).
  - Breaking change: add `!` before the colon (`feat(db)!: …`) and/or a
    `BREAKING CHANGE:` footer.
  - Examples:
    - `feat(marketplace): add listing card component`
    - `fix(auth): handle expired session on cold start`
    - `chore: pin eslint and prettier versions`
- Add a blank line + body when *why* isn't obvious from the subject.
- Don't mix unrelated changes, and don't commit commented-out code or debug logging.
- AI-assisted commits keep the trailer `Co-Authored-By: <model> <noreply@anthropic.com>`.
- The changelog and version bumps are generated from this commit history by
  release-please (wired in Phase 5) — a well-formed subject line is what ends up in
  `CHANGELOG.md`.

### Pull requests
- Fill in the PR template and complete the checklist below.
- **At least one human approval is required before merge.** Resolve every review
  comment or reply with why it's deferred.
- Run the local checks before opening the PR — all must pass: `npm run lint`,
  `npm run format:check`, and `npm run typecheck` (`tsc --noEmit`). CI (`quality`,
  `secret-scan`, `migration-smoke`) runs the same checks plus a few more and is
  required to merge — see the README's "CI" section.
- Keep PRs small — aim for under ~400 changed lines; split larger work into stacked PRs.
- Resolve conflicts by rebasing your branch on `main` (don't merge `main` into it).
- Merge with a **merge commit** (GitHub's "Create a merge commit"), and delete the
  branch on merge.

## PR Checklist
- [ ] AI review run using [`ai/skills/reviewer-agent.md`](ai/skills/reviewer-agent.md)
- [ ] Findings addressed or noted in the PR description
- [ ] Relevant `knowledge/` doc created or updated
- [ ] `ai/AI_LOG.md` updated for major AI changes (or the user declined)
- [ ] RLS policy included for any new tables
- [ ] No service role key in client code
- [ ] A human teammate reviewed

## AI-Assisted Workflow
The full loop — frame, load context, pick a skill, review the diff, update knowledge,
open the PR — lives in
[`knowledge/guides/working-with-ai.md`](knowledge/guides/working-with-ai.md). The two
rules it hinges on (read/update `knowledge/`, and offer to log major changes to
`ai/AI_LOG.md`) are defined in [`AGENTS.md`](AGENTS.md).
