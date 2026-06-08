---
name: pre-submit
description: Run all submission safety checks before a git push. Catches the four hard rules that auto-fail the competition entry.
disable-model-invocation: true
---

Run the following checks in order and report a pass/fail for each:

1. **Single branch** — run `git branch` and verify only `main` appears. FAIL if any other branch exists.

2. **Repo size** — run `du -sh --exclude=node_modules --exclude=.git .` and verify the output is < 10 MB. FAIL if >= 10 MB.

3. **No .env staged or committed** — run `git ls-files | grep -E '^\.env$'`. FAIL if `.env` appears in tracked files. Also run `git diff --cached --name-only | grep -E '^\.env$'`. FAIL if staged.

4. **No API key in client bundle** — if `web/dist/` exists, run `grep -r "ANTHROPIC" web/dist/ 2>/dev/null`. FAIL if any match. Also scan `web/src/` for hardcoded key patterns: `grep -r "sk-ant-" web/src/ 2>/dev/null`. FAIL if any match.

5. **CI lint + test** — run `npm ci --workspaces 2>/dev/null || (cd server && npm ci) && (cd web && npm ci)` then `npm run lint --workspaces 2>/dev/null` and `npm test --workspaces 2>/dev/null`. Report exit codes. FAIL if any non-zero.

6. **Attempt count reminder** — run `git log --oneline | wc -l` (as a proxy for repo activity) and remind the user: "Max 3 submission attempts. Make this one count."

Print a final summary table:

| Check | Status |
|-------|--------|
| Single branch (main only) | PASS/FAIL |
| Repo size < 10 MB | PASS/FAIL |
| .env not in git | PASS/FAIL |
| No API key in client | PASS/FAIL |
| Lint + tests green | PASS/FAIL |

Only give a go-ahead to push if ALL five checks PASS.
