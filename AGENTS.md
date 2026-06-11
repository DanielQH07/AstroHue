# AstroHue Agent Guide

## Purpose

AstroHue is a free browser-based astronomy color guessing game. A player
inspects a complete color image, shapes an HSL guess, receives directional
feedback, and gets at most five attempts.

## Architecture

- Next.js App Router pages and Node.js Route Handlers
- Stateless HMAC-signed round tokens; no database or account system
- Private generated puzzle answers isolated in `src/data/puzzles.server.ts`
- Client game state in `components/game/AstroGame.tsx`
- Versioned, non-sensitive local persistence in `src/lib/storage/localStats.ts`
- Offline Python/Pillow content preparation in `scripts/`

## Important Locations

- `app/api/round/route.ts`, `app/api/guess/route.ts`: public game APIs
- `src/data/nasa-puzzles.generated.json`: private generated puzzle records
- `src/lib/game/`: selection, feedback, scoring, and token logic
- `components/game/`: gameplay UI
- `public/astro/`: locally stored playable imagery
- `data/`: source metadata and manual rights-review ledger
- `tests/`: unit, component, API, and E2E coverage

## Conventions And Safety Rules

- Use strict TypeScript and focused components.
- Puzzle answer data must never be imported by a Client Component.
- Never include target HSL, target point, or palette candidates in initial
  HTML, localStorage, public JSON, or incomplete-round API responses.
- NASA images must remain locally stored, individually credited, and reviewed.
- A NASA-hosted record is not automatically legally cleared.
- Do not use NASA logos or imply endorsement.
- External reference websites may inform broad UX principles only. Do not copy
  their assets, source, layout, branding, prose, or distinctive styling.
- Do not add runtime NASA API calls.
- Keep npm scripts cross-platform and runtime writes out of production.

## Commands

```text
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run content:nasa
npm run content:validate
npm run check
```

Set `PYTHON` when Python is not discoverable automatically. Set
`ASTROHUE_ROUND_SECRET` to at least 32 random characters.

## Verification Expectations

For future changes, run the narrow relevant tests first, then `npm run check`.
Gameplay, API, layout, accessibility, or persistence changes also require
Playwright. Confirm that answers remain server-only, randomized responses use
`no-store`, local image paths exist, and the app works at 360px width.
