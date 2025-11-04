# Task: Improve Generator Variety (Markov intervals, rhythm gates, 8‑bar sections)

Repo: procedural-ambient-pwa
Owner: Codex
Priority: High
Status: Ready

## Summary
Upgrade the existing WebAudio engine to produce more musical variety while preserving the current UI and PWA structure.

## Scope (modify in place; do NOT re-scaffold)
- Replace random-walk melody with a small **Markov interval** model over intervals −2..+2, blended by `complexity`.
- Add **rhythm variation**:
  - Melody: **probabilistic rests** per beat (rate influenced by `complexity`).
  - Bass: **Euclidean rhythm**, e.g., 3 hits over 8 beats.
- Add light **form**:
  - **8-bar sections**: shift pad/bass root through a simple repeating pattern mapped to pentatonic degrees (I–vi–IV–V-ish).
  - **Cadence every 16 beats**: nudge melody to a stable degree (e.g., 0 or 2) with high probability.
  - **Occasional octave lift** at phrase ends for the melody.
- Keep controls and app behavior the same: scale (major/minor pent), root Hz, tempo, complexity, space.
- Keep manifest, service worker, and CI/CD untouched.

## Files to Modify
- `src/audio/engine.ts` (core logic changes)
- (Only if necessary for tiny constants) otherwise, **do not** alter other files without approval.

## Implementation Notes
- Intervals set: `[-2, -1, 0, 1, 2]`.
- Markov: center-weighted transition matrix; blend with uniform distribution by `complexity` (higher = flatter/more adventurous).
- Melody rests: probability ≈ `0.15 + 0.25*complexity` (tweak to taste).
- Bass Euclidean: `steps=8, pulses=3` on `beatIndex % 8`.
- Section root offsets cycle every 8 bars, e.g., `[0, -3, -1, 2]` (mod 5 for pentatonic degrees).
- Cadence: every 16 beats, set degree to 0 or 2 with high probability.
- Optional: modulate delay mix slightly across long phrases for “breathing”.

## Acceptance Criteria
- [ ] Within ~2 minutes of playback, output is clearly more varied:
      melody includes rests, bass hits are spaced (not every beat), pads feel like they shift every ~8 bars, melody resolves about every 16 beats.
- [ ] `complexity` slider still works (higher = more adventurous intervals and slightly fewer melody notes).
- [ ] No console errors during a 5-minute run; audio still starts only after user gesture (autoplay-safe).
- [ ] PWA install/offline behavior unchanged and still passes Lighthouse “Installable” + “Offline” (desktop) with score ≥ 90.

## Test Plan
Run locally and listen 2–3 minutes with:
- **Preset A**: `scale=majorPent`, `rootHz=220`, `bpm=72`, `complexity=0.35`, `mix=0.4`.
- **Preset B**: same but `complexity=0.7` (should sound more adventurous).

Verify:
- Melody doesn’t trigger every beat; rests occur.
- Bass follows a spread-out pulse (3 over 8).
- Pad/bass harmony shifts feel every ~8 bars.
- Melody gently resolves every ~16 beats.
- Sliders still alter sound in real time.

## Performance/UX
- No new heavy dependencies.
- One scheduler tick per beat; CPU usage comparable to current build.

## Branch & PR
- Branch: `feat/generative-variety`
- PR → `main` including:
  - Summary of the approach and validation notes.
  - Short Loom/GIF or audio snippet demonstrating the changes.

## Out of Scope
- Recording/export, visualizer, MIDI/DAW, UI changes not required by the above.

## Rollback
- Revert `src/audio/engine.ts` to the previous revision if regressions are found.
