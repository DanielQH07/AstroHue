# Architecture

## Request Flow

The browser requests a round with up to 100 played IDs. The server selects an
approved local puzzle and returns only its public image identity and a signed
round token. The token contains puzzle ID, attempt count, nonce, issue time, and
expiry, but no answer.

Each guess returns textual HSL feedback. The server increments attempts from the
verified token rather than trusting the browser. A new signed token carries the
next attempt count. Target color, sample point, title, description, credit, and
source appear only on a win or fifth attempt.

## Data Boundary

`src/data/puzzles.server.ts` imports `server-only` before reading the generated
private manifest. Client Components depend only on public TypeScript shapes.
Credits are rendered from a safe server projection.

localStorage may contain the signed token, public puzzle, current slider values,
public guess history, played IDs, onboarding status, and aggregate statistics.
Reveal data is intentionally omitted.

## Runtime And Deployment

Route Handlers use the Node.js runtime for crypto. Content preparation is a
development command and production needs no filesystem writes or external
NASA request. This maps directly to a Vercel Next.js deployment with one secret
environment variable.

## Threat Model

The design prevents accidental answer shipment in initial HTML, public JSON,
client bundles, and active-round responses. HMAC signatures prevent token
editing. It is still a casual stateless game: copied valid tokens can be
replayed, local statistics can be edited, and a determined user with server
access can read committed private content.
