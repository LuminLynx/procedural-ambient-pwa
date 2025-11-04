# Task: Dynamic Scenes, Harmonic Movement, and Timbre Variation

Repo: procedural-ambient-pwa
Owner: Codex
Priority: High
Status: Ready

## Summary
Evolve the generator beyond a static “zen” feel by adding:
1) **Harmonic movement** (periodic key/scale center changes),
2) **Dynamic scenes** (parameter presets that transition over time),
3) **Timbre variation** (waveshape/FM and gentle filtering),
4) **Multi-voice layering** (lead/pad/bell/bass with subtle pan drift),
while keeping the current UI largely intact and PWA behavior unchanged.

## Scope (modify in place; no re-scaffold)
- Implement a lightweight **Scene Engine** that morphs generator parameters over time (e.g., every N bars).
- Add **Harmonic Loop** support: rotate `rootHz` and/or scale mode per section.
- Introduce **Timbre Modes**: sine/triangle/soft-square + optional mild FM; add a simple lowpass filter sweep tied to “Space”.
- Add a **Bell/Pluck** upper voice with sparse events (e.g., once per 2–4 bars) and subtle stereo pan drift.
- Keep existing controls; add **only** these optional controls (non-breaking):

  - `sceneDurationBars` (default 32)

  - `enableScenes` (bool, default true)

  - `enableHarmonicLoop` (bool, default true)

  - `seed` (number; if present, makes session repeatable)


## Files to Modify
- `src/audio/engine.ts` — core; add Scene Engine + harmonic loop + timbre/filter + new voice

- `src/App.tsx` — minimally expose the new toggles/seed (optional if you prefer defaults)

- `src/styles.css` — no required changes


## Implementation Notes
### 1) Scene Engine
- Define 2–3 named scenes with parameter targets (example below). Interpolate over `sceneDurationBars`.

- Interpolate: `bpm`, `mix` (delay), `complexity`, `timbreMode`, and `scale`.

- Example scene list to cycle: **Calm → Nocturne → Ether**.


```ts
type Scene = { name:string; scale:'majorPent'|'minorPent'; bpm:number; mix:number; complexity:number; timbre:'sine'|'triangle'|'softsq'|'fm' };
const SCENES: Scene[] = [
  { name:'Calm',     scale:'majorPent', bpm:72, mix:0.4, complexity:0.30, timbre:'sine' },
  { name:'Nocturne', scale:'minorPent', bpm:62, mix:0.55, complexity:0.45, timbre:'triangle' },
  { name:'Ether',    scale:'majorPent', bpm:68, mix:0.65, complexity:0.55, timbre:'fm' }
];
```

### 2) Harmonic Movement
- Every 8 bars (or end of scene), shift `rootHz` (and/or degree offset) following a loop (e.g. A→F#→D→E for A major context).

- Provide a default `rootLoopHz = [220, 185, 147, 165]` (A3, F#3, D3, E3). Guard against abrupt jumps by slewing frequency over ~0.5s.


### 3) Timbre Variation + Filter
- Implement oscillator factory: `sine`, `triangle`, `soft square` (via waveshaper or low-gain square), and a mild `fm` option (mod ratio ~1.5, index ~1–2).

- Add a single `BiquadFilterNode` lowpass per voice or a shared filter bus; modulate cutoff slowly with `mix`.


### 4) Multi-Voice Layering
- Keep existing **lead**, **pad**, **bass**. Add a **bell** voice:

  - Bell triggers once every 2–4 bars (random), higher octave (oct+2 or +3), fast attack/short release.

  - Slight `StereoPannerNode` drift for pad/bell (e.g., 0.1 .. -0.1 over long periods).


### 5) Seeded RNG
- Add a seedable RNG (mulberry32). If `seed` provided, initialize with it; else random.

- Use it for interval choices, rests, timbre picks, and bell timing.


### 6) Backwards Compatibility
- Existing sliders continue to work; new features default to enabled with sane defaults.
- If you don’t expose new controls in UI, read defaults from `engine` params only.

## Acceptance Criteria
- [ ] Let it play for ~3–5 minutes: audible **scene changes** (tempo/delay/complexity feel shifts) without jarring jumps.

- [ ] **Harmonic loop** is perceivable (pads/bass shift tonal center every ~8 bars or at scene boundaries).

- [ ] **Timbre** is not strictly sine: occasional triangle/soft-square or mild FM present; gentle lowpass movement audible.

- [ ] **Bell** voice appears sparsely in upper register with subtle stereo drift; overall CPU remains similar.

- [ ] If a `seed` is set, two sessions with the same seed produce the **same** sequence of events (within scheduling tolerance).

- [ ] No console errors over 5 minutes; autoplay remains gesture-gated; PWA install/offline unaffected.


## Test Plan
- Desktop Chrome with headphones (and Safari iOS for sanity):

  - Start with defaults, listen 4–5 minutes; note scene boundaries and tonal shifts.

  - Toggle `enableScenes`/`enableHarmonicLoop` to compare static vs dynamic.

  - Set `seed=12345` and verify reproducibility across reloads.

  - Run Lighthouse PWA; confirm previous scores maintained.


## Performance
- No new heavy deps. Keep one scheduler tick per beat; avoid allocating many nodes per tick.

- Ensure filters/detunes are reused nodes where possible.


## Branch & PR
- Branch: `feat/dynamic-scenes-harmony-timbre`

- PR → `main` with a short 1–2 min audio capture or Loom showing scene change and harmonic movement.


## Out of Scope
- Visualizer, recording/export, MIDI/DAW (separate tasks).


## Rollback
- Disable scenes/harmonic loop via flags; revert `engine.ts` if regressions occur.

