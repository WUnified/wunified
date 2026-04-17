# Contributing to WUnified

This project uses an AI-assisted development workflow. Keep changes small, explain decisions, and ensure both AI and human reviews are completed.

## PR Checklist
- [ ] AI review run using `/ai/skills/reviewer-agent.md`
- [ ] Findings addressed or noted in PR description
- [ ] Human teammate reviewed

## AI-Assisted Workflow
1. Define the scope and acceptance criteria in the PR description.
2. Implement changes in small, focused commits.
3. Run AI review using the code review skill guidance.
4. Address findings or document rationale for any deferred item.
5. Request at least one human teammate review before merge.

## Documentation Rule
When a task adds a feature, changes architecture, introduces a new pattern, or surfaces a bug worth remembering:
- Update the relevant file in `ai/knowledge/`.
- Create a new file if no relevant knowledge file exists.
- Complete that update before marking the work done.
