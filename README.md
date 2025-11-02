# procedural-ambient-pwa

Installable Progressive Web App that generates endless ambient music in the browser using Web Audio. Works offline after first load.

## Tech
- Vite + React + TypeScript
- Web Audio API (no heavy deps)
- Service Worker + Web App Manifest
- GitHub Actions -> GitHub Pages

## Quickstart
```bash
npm i
npm run dev
# build
npm run build && npm run preview
```

> Audio starts only after a user click/tap (autoplay blocked by browsers).

## Deploy (GitHub Pages)
1. Repository settings → Pages → **Build and deployment: GitHub Actions**.
2. Commit the workflow in `.github/workflows/build-and-deploy.yml` (included here).
3. Push to `main`. The Action builds and publishes `dist/`.

## PWA Notes
- `public/manifest.webmanifest` declares name, colors, and icons (192/512).
- `public/sw.js` uses a simple cache-first strategy for the app shell.
- iOS: Use “Add to Home Screen”; ensure Silent Mode is off to hear audio.

## Files of interest
- `src/audio/engine.ts` — generator (`AmbientEngine`): random-walk pentatonic melody, dual detuned pad, bass plucks, feedback delay.
- `src/App.tsx` — UI (scale, root Hz, tempo, complexity, space), start/stop + install button.
- `src/styles.css` — minimal dark theme.

## Future Work
- Recording/export via `MediaRecorder`.
- Presets + visualizer (AnalyserNode canvas).
- MIDI/DAW integration.
