# AstroHue

AstroHue is a free, account-free astronomy color guessing game. The player sees
a complete, fully colored image and has five guesses to match one color sampled
from it. Hue, saturation, and lightness clues point toward the answer after
each attempt.

AstroHue is an independent educational project and is not affiliated with or
endorsed by NASA.

## Screenshot

Run the app and capture the root game at 1440×900 after the browser verification
step. Do not add screenshots or assets copied from reference websites.

## Gameplay

1. Inspect and zoom into the astronomy image.
2. Shape a color with the Hue, Saturation, and Lightness sliders.
3. Submit up to five guesses and follow the written directional clues.
4. On a win or fifth attempt, see the target values, sample area, description,
   credit, and source.
5. Share a spoiler-free result or immediately explore another image.

## Architecture

The App Router renders public pages and a client game shell. `POST /api/round`
selects an approved local puzzle and issues an HMAC-signed token.
`POST /api/guess` verifies that token, advances the attempt server-side, and
returns only directional feedback until completion. The target manifest is
loaded only through a module guarded by `server-only`.

No database, authentication, tracker, paid API, or runtime NASA request is
used. Safe progress and statistics are versioned in localStorage.

## Tech Stack

- Next.js 16.2.9, React 19, strict TypeScript, App Router
- Tailwind CSS 4 plus project CSS tokens
- Zod, Radix Dialog, Lucide
- Vitest, React Testing Library, Playwright, axe
- Python 3.11+, requests, and Pillow for offline content preparation

## Structure

```text
app/                 Pages, metadata, and Route Handlers
components/game/     Game UI and dialogs
components/layout/   Shared header and footer
src/data/            Private generated puzzle data and server projection
src/lib/             Color, game, persistence, and validation logic
scripts/             NASA downloader, validator, and Python launcher
public/astro/        Local NASA images and project-owned fallbacks
data/                Source metadata and rights-review ledger
tests/               Unit, component, API, and E2E tests
docs/                Architecture and content workflow notes
```

## Local Setup

Requirements:

- Node.js 20.9 or later (Node 24 is supported)
- npm 10 or later
- Python 3.11 or later
- Pillow and requests for content commands

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell systems that block `npm.ps1`, invoke `npm.cmd` directly.
The content launcher checks `PYTHON`, then common Python commands and Conda.

Install Python dependencies when needed:

```bash
python -m pip install Pillow requests
```

## Environment Variables

`ASTROHUE_ROUND_SECRET` is required in production and must contain at least 32
characters. Generate a strong value:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Development has a loudly warned fallback. Production APIs fail safely with a
503 response when the secret is missing.

`PYTHON` may point to a specific Python executable for content commands.

## Commands

```text
npm run dev              Start local development
npm run build            Create the production build
npm run start            Serve the production build
npm run lint             Run ESLint
npm run typecheck        Run strict TypeScript checking
npm run test             Run Vitest suites
npm run test:watch       Watch Vitest
npm run test:e2e         Run Playwright browsers
npm run test:e2e:ui      Open Playwright UI mode
npm run content:nasa     Prepare 20 NASA records with seed 42
npm run content:review   Reapply explicit manual review decisions
npm run content:validate Validate manifest and local image assets
npm run check            Lint, typecheck, test, validate content, build
```

## NASA Content Pipeline

`scripts/download_nasa_images.py` searches the NASA Image and Video Library API
across diverse themes. It rejects likely illustrations and event material,
deduplicates IDs and hashes, chooses large raster renditions, validates and
orients images, limits the longest edge to 2400px, and writes WebP at quality
88. It never scrapes NASA HTML.

```bash
npm run content:nasa
node scripts/run-python.mjs scripts/download_nasa_images.py --count 8 --seed 7
node scripts/run-python.mjs scripts/download_nasa_images.py --query Jupiter --query Saturn --force
```

The extraction stage quantizes a 256px working image, filters near-black,
near-white, and weakly saturated colors, scores useful clusters, chooses a
representative location away from edge noise, and derives the final target from
a robust 31×31 local patch. Up to five candidates remain in the private record.

Outputs:

- `public/astro/nasa/*.webp`
- `src/data/nasa-puzzles.generated.json`
- `data/nasa-source-metadata.json`
- `data/nasa-rights-review.csv`

If downloading is unavailable, six project-owned abstract SVGs keep the app
fully runnable. They are explicitly labeled as placeholders, not NASA photos.

## Rights And Attribution Review

Every downloaded record starts as `pending` and is excluded from production
selection. Review its NASA record, description, photographer, center, and
potential third-party indicators. Confirm the exact credit and usage terms,
then change the manifest and CSV status to `approved`; use `rejected` whenever
rights or attribution remain unsuitable.

NASA sometimes hosts third-party copyrighted material. Do not claim all NASA
content is public domain. Do not use NASA insignia, logotypes, or wording that
implies endorsement.

## Curating Targets

During development, `/dev/curate` shows private records and candidates. It
returns 404 in production. To replace a target, choose a visible location,
sample a robust local patch with the pipeline or another deterministic image
tool, update integer HSL, HEX, and normalized point coordinates together, then
run `npm run content:validate`.

To add a puzzle manually:

1. Store a local optimized image under `public/astro/`.
2. Add a complete private record with a unique ID and hash.
3. Preserve credit, source URL, rights status, dimensions, target, and point.
4. Approve only after manual review.
5. Run validation and the API answer-leak tests.

## Testing

```bash
npm run test
npx playwright install
npm run test:e2e
```

Vitest covers color math, wrap-around, tolerances, scoring, tokens, storage,
components, and API answer protection. Playwright covers onboarding, wins,
five-guess losses, reload restoration, keyboard sliders, zoom, stats, mobile
overflow, and axe.

## Vercel Deployment

1. Push this repository to GitHub.
2. Import it into Vercel as a Next.js project.
3. Add `ASTROHUE_ROUND_SECRET` to Production and Preview environments.
4. Ensure approved generated content is committed.
5. Deploy.

No filesystem write or content download occurs at runtime.

## Security, Privacy, And Limitations

- CSP, clickjacking protection, MIME protection, referrer policy, and a limited
  permissions policy are configured.
- API payloads are Zod-validated and guess bodies are capped at 4 KB.
- Gameplay statistics remain in the browser.
- Stateless signed tokens prevent casual answer leakage but cannot provide
  durable replay prevention. A competitive system would require server state.
- Local statistics do not sync across browsers or devices.
- Rights approval remains a manual publishing responsibility.

## Future Ideas

Daily curated modes, optional sound, color-vision learning aids, themed
collections, richer local curation controls, and durable cross-device profiles
could follow without changing the Explore mode.
