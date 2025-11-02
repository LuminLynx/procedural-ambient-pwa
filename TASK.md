# Task: Implement Procedural Music Generator PWA (MVP)

Owner: Codex
Repo: procedural-ambient-pwa
Priority: High (scaffold + MVP)
Status: Ready to start

## 1) Context
We want a browser-based Progressive Web App that generates endless ambient music offline using Web Audio. A React+TS Vite starter exists (see spec below). This task is to deliver a production-quality MVP that runs offline, is installable, and exposes basic controls.

## 2) Goal (MVP)
Ship an installable PWA that:
- Generates continuous ambient music (random-walk on pentatonic scale).
- Exposes UI controls: scale (major/minor pentatonic), root Hz, tempo, complexity, space (delay mix).
- Works offline after first load (service worker + manifest).
- Plays only after a user gesture (autoplay policies compliant).
- Is responsive and mobile-friendly.

## 3) Out of Scope (for now)
- Recording/export to file.
- Visualizer.
- Presets library beyond the defaults.
- DAW/MIDI integration.
- Advanced synthesis beyond sine + simple mod (vibrato), and delay feedback.

## 4) Deliverables
- A Vite React+TS app [Vite + React + TS].
- Files:
  - `public/manifest.webmanifest` with icons (192/512).
  - `public/sw.js` service worker (cache-first app shell).
  - `src/audio/engine.ts` WebAudio generator (class `AmbientEngine`).
  - `src/App.tsx`, `src/main.tsx`, `src/styles.css`.
- README.md with setup, build, and PWA notes.
- GitHub Actions workflow for Pages deployment.
- Lighthouse PWA score ≥ 90 on installability/offline (desktop).

## 5) Implementation Notes
- WebAudio only starts after explicit user interaction (button click).
- Use an `AmbientEngine` with: sine oscillators, ADSR via Gain ramps, detuned dual-pad, bass plucks, feedback delay loop.
- Random walk over 5-degree pentatonic with center-weighted jumps; complexity flattens the distribution.
- Delay mix/time and feedback tied to “Space” slider.
- Service worker: simple cache-first for app shell; bust cache via version bump and file list.
- Manifest: `display: standalone`, theme/background #0f172a; provide 192/512 icons.
- iOS: advise “Add to Home Screen” in footer; silent mode tip.

## 6) Acceptance Criteria (Checklist)
- [ ] Install prompt appears on supported browsers; app installable.
- [ ] App functions offline (controls + generator still work).
- [ ] Clicking **Start** begins audio within 150ms (subject to scheduling/AudioContext).
- [ ] Adjusting sliders affects audio in real time (no page reloads).
- [ ] Autoplay blocked until user gesture (no console errors).
- [ ] No uncaught JS errors in console during 5-minute run.
- [ ] UI responsive: works on 360px width and up.
- [ ] Lighthouse: PWA Installable & Offline passes; score ≥ 90.
- [ ] Basic unit smoke test builds and mounts `<App />` without crashing.
- [ ] GitHub Pages workflow deploys `dist/` on push to `main`.

## 7) Testing Plan
- Manual:
  - Chrome/Edge desktop, Android Chrome, Safari iOS.
  - Airplane mode check after initial load: app still launches; Start works.
- Automated:
  - `vitest` smoke test for rendering `<App />` and basic state changes (optional but preferred).
- PWA:
  - Verify `beforeinstallprompt` flow on desktop Chromium, and “Add to Home Screen” hint on iOS.

## 8) Performance & Accessibility
- First load bundle < 150KB gzipped (no heavy deps).
- Avoid layout shifts; use system font stack.
- Contrast meets WCAG AA; labels for sliders; keyboard focus visible.

## 9) How to Run
```bash
npm i
npm run dev
# build
npm run build && npm run preview
```
Service worker only activates on `https://` or `localhost`.

## 10) Definition of Done
- Code merged to `main` in `procedural-ambient-pwa`.
- GitHub Pages deployment working (Actions workflow included).
- Short Loom/GIF demo showing install, offline run, and controls.
- README updated with any deviations from spec and future TODOs.

## 11) Reference Spec (from starter)
- Use the starter structure provided in the shared canvas (Vite, manifest, sw, engine.ts, App.tsx).
- Keep code style minimal & typed; no external audio libraries for MVP.
