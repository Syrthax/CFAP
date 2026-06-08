# Carbon Footprint Awareness Platform

A context-aware carbon footprint advisor that ranks interventions by **impact-per-effort** given what you already do. If you cycle but eat beef daily, it surfaces diet — not cycling.

> Full documentation coming in Phase 4.

## Quick Start

```bash
# Install all dependencies
npm ci

# Start backend (port 3001)
npm run dev:server

# Start frontend (port 5173) — in a second terminal
npm run dev:web
```

## Environment Setup

```bash
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
```

## Development

```bash
npm run lint    # ESLint across all workspaces
npm test        # Vitest across all workspaces
```

## Architecture

```
Form input → UserContext
  → Context Engine (computeSignals)   : deterministic CO2e per category
  → Policy / Rules (decide)           : deterministic ranked ActionPlan + trace
  → LLM (bounded)                     : narrates plan, answers follow-ups
  → Output validation (zod)           : reject/repair malformed LLM output
  → UI: chart + "Why these?" panel + chat
```

**Principle:** numbers come from code, language comes from the LLM. The engine computes every kg CO₂e; the LLM only narrates, constrained to those figures.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + TypeScript + recharts |
| Backend | Node + Fastify + TypeScript |
| Validation | zod |
| Tests | Vitest + Testing Library |
| CI | GitHub Actions |
