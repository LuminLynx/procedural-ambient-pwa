# Task: Procedural Music PWA (MVP) — Use Existing Repo (DO NOT re-scaffold)

Owner: Codex
Repo: procedural-ambient-pwa
Priority: High
Status: Ready

## Context
The repo already contains the full starter (Vite + React + TS + PWA files) and CI artifacts. This task is **NOT** to scaffold a new project, but to finish and harden the MVP on top of the existing structure.

## Goals
- Ensure the current PWA **builds, installs, and runs offline**.
- Implement/verify the **Web Audio generator** controls: scale (major/minor pentatonic), root Hz, tempo, complexity, space (delay mix).
- Respect **autoplay** policy (start only after user gesture).
- Confirm **CI → GitHub Pages** deployment succeeds from `main`.
- Achieve **Lighthouse PWA ≥ 90** (desktop) for installability/offline.

## Non-goals (for now)
- No recording/export, no visualizer, no MIDI/DAW. (Future tasks)

## Work Plan (operate on existing files)
1) **Do not change the repo layout**. Work within these files unless you’re fixing a defect:

   - `public/manifest.webmanifest`

   - `public/sw.js`

   - `src/audio/engine.ts` (AmbientEngine)

   - `src/App.tsx`, `src/main.tsx`, `src/styles.css`

   - `.github/workflows/build-and-deploy.yml`

2) **Wire PWA basics**

   - Verify manifest name/icons/colors show in install prompt.

   - Confirm service worker precaches app-shell; bump cache version if needed.

3) **Generator behavior**

   - Random-walk pentatonic melody, detuned pad, occasional bass; sliders must affect sound live.

   - Start only after user click/tap; no console errors during 5-minute run.

4) **Responsive UI**

   - Works at 360px width; focus rings visible; slider labels readable.

5) **CI deploy**

   - Ensure GH Pages action publishes `dist/` successfully on push to `main`.

   - Add Pages URL to repo description.


## Acceptance Criteria
- [ ] App **installs** (Chromium desktop), shows proper icon/name.

- [ ] **Offline**: after first load, airplane mode → app still launches; Start works.

- [ ] **Controls** alter audio in real time (scale/root/bpm/complexity/mix).

- [ ] **Autoplay** compliant (no auto sound before gesture; no errors).

- [ ] **Lighthouse** Installable+Offline pass; score ≥ 90 (desktop).

- [ ] **CI** builds and deploys; published site loads and works offline.

- [ ] No uncaught errors in devtools console during a 5-minute session.


## Testing Notes
- Desktop Chrome/Edge, Android Chrome, Safari iOS (Add to Home Screen).

- iOS tip: Silent Mode off. Check tap latency and audio context resume.


## Definition of Done
- All acceptance criteria checked.

- Short Loom/GIF demo attached in PR description.

- README updated only if deviations were necessary (no structural overhaul).


---
**Important**: This task must **reuse the existing repo structure**. Avoid re-scaffold or large-scale restructuring unless a blocker is found; surface blockers for approval before changing structure.
