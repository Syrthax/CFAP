---
name: phase
description: Execute a specific build phase (0–4) of the Carbon Footprint Awareness Platform. References the DoD from instructions.md and stops until it passes.
disable-model-invocation: true
---

The user wants to execute Phase $ARGUMENTS of the build plan.

1. Read `instructions.md` and locate the section for Phase $ARGUMENTS (under "10. Build phases").
2. Read the full phase description and its Definition of Done (DoD).
3. Implement everything described in that phase. Do not implement anything from a later phase.
4. When implementation is complete, explicitly verify each DoD criterion one by one:
   - Run the commands the DoD specifies (e.g., `npm ci && npm run lint && npm test`)
   - For Phase 0: also run `git branch` and show the output (must show only `main`)
   - For Phase 2: run the policy engine against a cyclist profile and a vegetarian profile and show the trace
   - For Phase 3: run `npm test` and confirm all test cases from Section 11 pass; confirm axe reports no violations
   - For Phase 4: run `du -sh --exclude=node_modules .` and confirm < 10 MB
5. Do not declare the phase complete until every DoD item passes.
6. Report: which DoD items passed, which (if any) are still open, and the exact command output.

Security reminder for every phase:
- Never create a git branch. Always stay on `main`.
- Never put ANTHROPIC_API_KEY in client-side code or commit it.
- Always check that `.env` is gitignored before any `git add`.
