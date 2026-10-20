# Start here — Lamb on the Lam

This is the complete game project from the previous chat.

## User intent

Run and test this game locally on the user's laptop. On 20 October 2026 the user also requested a security audit and a push to `https://github.com/langley-2/lam-lamb`. The audit is in `docs/SECURITY-AUDIT.md`. Publishing a hosted game remains a separate action.

## Run locally

Use Node.js 22.12+ on the Node 22 line, or Node 24+, then open a terminal in this folder:

    npm ci --ignore-scripts
    npm run dev

Open the Local URL printed by Vite (usually http://localhost:5173). The previous server ran in a cloud workspace, so that URL was inaccessible from the user's laptop. Run this copy on the laptop.

## Game

A mobile-friendly lamb chase game with arrow/WASD or drag controls, flowers, bush hiding, one sheepdog, personal bests, sound, pause/results/settings screens, and a dog-free Gentle Stroll mode.

## Contents

- src/: complete TypeScript/Phaser game and styles
- public/: self-hosted fonts and favicon
- assets/: art attribution and font licenses
- tests/: 14 passing unit tests
- scripts/browser-check.mjs: browser smoke test; expects dev server port 5173 and Chromium
- docs/PLAN.md: original detailed product and architecture plan
- dist/: last successful production build
- vercel.json: optional configuration for future deployment, not an active deployment
- package-lock.json: reproducible dependency installation

Dependencies and build output are ignored by Git. No cloud project manifest or credentials are included.

## Checks already completed

- TypeScript and Vite production build passed.
- All 14 unit tests passed.
- Chromium checks passed: keyboard movement, flower collection, pause/resume, instructions, settings persistence, 20 restarts, touch movement/cancellation, landscape resizing, results, and no browser errors.
- Physical iPhone/Android testing is still needed. Emulation does not verify actual touch feel, audio, or battery performance.

## Further checks

    npm test
    npm run build

The security update also passed clean installation, zero known dependency vulnerabilities, all 14 unit tests, production build, and sandboxed Chrome desktop/touch checks on this laptop with Node 24.6.0. See README.md for details. Browser checks use Playwright Chromium by default; set CHROMIUM_PATH to an existing Chrome/Chromium executable when needed.
