# Task: Add Modern Drum Section and Groove Engine

Repo: procedural-ambient-pwa
Owner: Codex
Priority: High
Status: Ready

## Summary
Enhance the ambient generator with a lightweight rhythmic section (kick, snare, hats) using Euclidean and probabilistic patterns.
Goal: move away from the “zen pad” sound and create a subtle downtempo or lo-fi feel while preserving the current app structure and PWA functionality.

## Scope (modify in place; no re-scaffold)
- Update `src/audio/engine.ts` only.
- Add:
  - **Kick**: sine pitch-drop thump (main beats).
  - **Snare**: filtered noise burst (backbeats + ghosts).
  - **Hats**: high-passed noise clicks (off-beats and syncopations).
- Implement **Euclidean rhythms** (kick 5/16, hats 9/16, snare 2/16 base + ghosts).
- Keep the melodic/pad generator exactly as is.
- Add a new param:
  ```ts
  drumLevel?: number // 0–1, overall drum volume
  ```
- Mix drums into a small sub-bus with gentle compression for punch.
- Maintain CPU efficiency: no sample loading, just noise + oscillators.
- Do not modify manifest, service worker, or CI/CD.

## Implementation Notes
- Use 16th-note scheduler steps (subdivision of the current beat loop).
- Share one noise buffer for hats/snare for performance.
- Optional compressor chain (threshold≈–20 dB, ratio 3:1).
- Parameter defaults:
  - `drumLevel: 0.5`
  - `bpm` unaffected by drums (still drives beat clock).
- Keep all current PWA/CI behaviors unchanged.

## Acceptance Criteria
- [ ] Kick audible on 1 and 3, snare on 2 and 4, hats between beats.
- [ ] Groove feels organic (not strictly quantized).
- [ ] Drums volume controlled by `drumLevel`; set to 0 = mute.
- [ ] No console or audio errors in 5 min run.
- [ ] CPU use remains comparable to before.
- [ ] All existing melodic functions, sliders, and offline/install work unaffected.

## Test Plan
1. Run the app locally with defaults (`drumLevel = 0.5`).
   - Should hear ambient texture + light rhythmic pulse.
2. Try `bpm = 90–100`; groove becomes more noticeable.
3. Reduce `drumLevel → 0`; verify silence in percussion.
4. Inspect DevTools for absence of leaks or errors.

## Branch & PR
- Branch: `feat/modern-beats`
- PR → `main` with:
  - summary of new rhythm logic and design choices
  - short Loom or 30 s audio snippet showing new groove

## Out of Scope
- Sample-based drums, recording/export, or UI changes beyond optional `drumLevel` slider.

## Rollback
- Remove drum section or set `drumLevel = 0` in defaults if regression occurs.
