# Lamb on the Lam

A small, illustrated browser game about a hungry lamb and forbidden flowers.

## Run

Use Node 22.12+ on the Node 22 line, or Node 24+ (Node 22 is pinned in `.nvmrc`).

```sh
npm ci --ignore-scripts
npm run dev
```

Open the printed URL. On a phone, drag anywhere in the meadow to move. Desktop uses arrow keys or WASD. Eat flowers, slow down inside bushes to hide, and watch the dog's warning marker. Gentle Stroll removes the dog.

```sh
npm test
npm run build
npm run preview
```

## Architecture

- `src/world.ts`: fixed-step rules, scoring, perception, cover, collision, and A* navigation.
- `src/scene.ts`: Phaser presentation, camera, character animation, and effects.
- `src/art.ts`: original, locally generated illustrated textures.
- `src/main.ts`: semantic HTML menus, HUD, settings, and application lifecycle.
- `src/input.ts`: single-owner touch capture and keyboard input.
- `src/audio.ts`: small synthesized sound effects, unlocked by a gesture.
- `src/storage.ts`: defensive local best-score and settings storage.

The renderer uses Phaser Canvas, which suits this modest, sprite-based world and avoids a GPU requirement. No API, account, remote artwork, or audio download is required during play. Fonts are self-hosted. The original plan is in `docs/PLAN.md`; this implementation is the first polished playable release, not the entire expansion roadmap.

## Vercel via Git

1. Push this directory to a GitHub repository.
2. Import that repository into your Vercel account.
3. Select Vite; use `npm run build`, output `dist`, and Node 22.
4. Select `main` as the production branch.
5. Require the `check` CI job before merging.

`vercel.json` already declares the build configuration. The app lives at `/`, so no SPA catch-all rewrite is needed. No environment variables are required. Vercel's Git integration provides branch previews and deploys production when `main` changes.

Development and preview servers bind to this computer only. To test from a phone on a trusted local network, explicitly use `npm run dev -- --host 0.0.0.0`.

The security review and verification results are recorded in [docs/SECURITY-AUDIT.md](docs/SECURITY-AUDIT.md). `vercel.json` includes production browser security headers; other hosts must configure equivalent response headers.

## Checks

Unit tests cover input-independent rules and storage failures. `scripts/browser-check.mjs` runs interactive Chromium checks against the Vite dev server at port 5173 and saves screenshots. It uses Playwright's Chromium by default; set `CHROMIUM_PATH` for an existing Chrome/Chromium installation, and `LAMB_BASE_URL` for another local port. The browser sandbox stays enabled. It exercises keyboard/touch movement, capture cancellation, pause, settings, results, orientation layout, and repeated rounds.

```sh
npm run dev -- --port 5173
# In another terminal:
node scripts/browser-check.mjs
```

Physical iPhone/Android touch, sound, thermal performance, and interruption behavior still require real-device playtesting. Browser emulation is not a substitute.

## Deliberate limits

Scores are local to a browser. There is no cloud leaderboard or anti-cheat system. Flower spawning is seeded per run, but this is not a competitive daily challenge. The meadow contains one dog, one map, classic chase, and gentle stroll. No service worker is installed, so reload receives the current release without offline-cache migration issues.
