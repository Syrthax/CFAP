# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Carbon Footprint Awareness Platform — solo competition submission. Phases 0–4 defined in `instructions.md`.

## Architectural Law (non-negotiable)

**Numbers come from code. Language comes from the LLM.**

The deterministic engine (`footprint.ts`, `rules.ts`, `policy.ts`) computes every kg CO₂e and ranks every action. The LLM only narrates and answers follow-ups, constrained to the numbers the engine gives it. The LLM must never invent or alter a CO₂e figure.

## Phase-Gate Protocol

Execute one phase at a time. Do not advance to the next phase until the current phase's Definition of Done (DoD) fully passes. Always check the DoD against `instructions.md` before declaring a phase complete.

## Stack

- **Frontend:** `web/` — React + Vite + TypeScript + recharts
- **Backend:** `server/` — Node + Fastify + TypeScript
- **Validation:** zod on every boundary (request body + LLM output)
- **Tests:** Vitest + Testing Library (`server/tests/`)
- **CI:** GitHub Actions — lint + test on push to `main`
- **Package manager:** npm

## Commands (once scaffolded)

```bash
# Root (runs both)
npm ci
npm run lint
npm test

# Frontend only
cd web && npm run dev

# Backend only
cd server && npm run dev
```

## Repo Hard Rules (submission constraints — violations auto-fail)

1. **Single branch only.** Always on `main`. Never `git checkout -b` or create any other branch.
2. **< 10 MB.** `.gitignore` node_modules/dist in the very first commit. Run `du -sh --exclude=node_modules .` before pushing.
3. **No `.env` in git.** `.env` is gitignored. `.env.example` (with placeholder values) is committed.
4. **No API key in client bundle or git history.** `ANTHROPIC_API_KEY` lives in `.env`, loaded server-side only.
5. **Max 3 submission attempts.** Use `/pre-submit` before every push.

## Carbon Factor Citations (required)

`factors.ts` must source every value from **DEFRA 2024**, **EPA**, or **Poore & Nemecek 2018** and include a `source` and `year` field on each constant. Citing methodology is a rubric requirement.

## Security Checklist (Phase 3 gate)

- zod-validate every request body; reject out-of-range values
- Rate limit per IP; helmet security headers; CORS locked to frontend origin
- LLM output validated against zod schema; repair-or-reject on malformed output
- `npm audit` step in CI (optional but recommended)

## Accessibility Checklist (Phase 3 gate)

- Every chart needs a visually-hidden `<table>` data equivalent + `aria-label`
- Chat responses in `aria-live="polite"` region
- Color contrast ≥ WCAG AA; respect `prefers-reduced-motion`
- Verify with axe

## "Why these?" Trace Panel

This is the highest-leverage feature for the rubric. Every evaluated rule — fired **and** skipped — must appear in the trace with its reason. A cyclist must not see `shift-short-car-trips`; the trace must show it was skipped and why.
