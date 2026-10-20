# Security audit — 20 October 2026

## Scope and result

Reviewed all application source, tests, scripts, package manifests and lockfile,
CI and hosting configuration, documentation, SVG, and the bundled asset inventory.
Reviewed browser network behavior and the production build after rebuilding
from the reviewed source. No evidence of malicious code, embedded credentials,
tracking, data exfiltration, or unexpected executable assets was found.

This source and dependency review is not a guarantee that all vulnerabilities
or malicious upstream behavior have been excluded. Dependency results reflect
npm's advisory database on the review date.

## Findings and fixes

The original scan reported five affected development packages: `vite` (high),
`vitest` (critical), `@vitest/mocker` (moderate), `tinypool` (critical), and
`esbuild` (low). These concern development/testing infrastructure; they do not
establish that the game or this computer was compromised.

- Updated Vite from 7.3.1 to 7.3.7 and Vitest from 3.2.4 to 4.1.11. Regenerated
  the lockfile, resolving esbuild to 0.28.2 and removing tinypool. The complete
  updated graph reports **zero known vulnerabilities**, including dev dependencies.
  Relevant upstream advisories include
  [Vite arbitrary file read](https://github.com/vitejs/vite/security/advisories/GHSA-p9ff-h696-f583)
  and [Vitest mock redirect traversal](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9).
- Changed dev and preview scripts from all network interfaces to loopback only.
  LAN testing now requires an explicit host override.
- Limited CI to read-only repository permissions, disabled checkout credential
  persistence, pinned Actions to verified commit IDs, added a job timeout, and
  made all known dependency vulnerabilities fail CI.
- Verified installation/builds with dependency lifecycle scripts disabled.
  CI and documented installation use `npm ci --ignore-scripts`.
- Added production response headers in `vercel.json`: restrictive CSP, MIME
  sniffing protection, no referrer disclosure, and disabled camera, microphone,
  and geolocation permissions. CSP blocks network connections, inline JavaScript,
  evaluation, framing, forms, and third-party scripts. Inline CSS remains allowed
  for game/UI positioning.
- Replaced the error screen's inline JavaScript handler with a delegated handler
  compatible with CSP.
- Explicitly enabled Chromium's sandbox in the browser checks. Replaced a fixed
  movement delay with a condition wait for reliable checks on this laptop.
- Expanded Git ignore rules for local hosting metadata, cloud credentials,
  private key files, and macOS metadata. Builds, dependencies, screenshots, and
  environment files are excluded from Git.

## Application review

- No app-side fetch, WebSocket, beacon, analytics, remote font, or remote asset
  endpoints. Graphics are generated locally and audio uses Web Audio synthesis.
- Persistent data consists only of local best scores/preferences. Loaded values
  are type-checked; HTML strings supplied as saved scores are rejected.
- HTML templates use authored strings, validated numbers/booleans, and internal
  game state. No URL parameters, remote responses, or arbitrary saved strings flow
  into them. Status text uses `textContent`.
- No backend, authentication, payment handling, shell execution, or runtime
  secrets. The development inspection hook is omitted from production.
- All 99 resolved lockfile packages use the npm registry and SHA-512 integrity
  hashes. Install-script flags belong only to esbuild and optional fsevents;
  the documented workflow skips these scripts.
- Font assets identify as TrueType fonts; attribution and licenses are included.

## Verification

Executed with Node 24.6.0 on macOS:

- Clean `npm ci --ignore-scripts --offline` from the new lockfile passed.
- `npm audit --json`: zero info/low/moderate/high/critical vulnerabilities.
- `npm test`: 14 tests passed in two files.
- `npm run build`: TypeScript checking and production bundling passed.
- Sandboxed Chrome checks passed: keyboard movement, flower collection,
  pause/resume, help, saved settings, 20 consecutive rounds, touch movement and
  cancellation, landscape layout, results, and no runtime errors.
- Served `dist` locally with the exact response headers from `vercel.json` and
  verified production boot/play/results, malformed saved HTML rejection, no
  development inspection hook, no external requests, and no CSP violations.
- Reviewed the Git upload inventory for credentials and unintended local files.

Security headers require a host that applies `vercel.json`, or equivalent host
configuration. A plain Python static server does not apply them. GitHub stores
the source; this push does not deploy the game or configure hosting.
