# TASK — Procedural Music Generator: Specific, Testable Vision

> **Objective:** Ship a predictable, evolving generative music & visual experience with **clear constraints**, **exact parameter ranges**, **deterministic seeding**, and **measurable acceptance criteria**. No vague features; everything below is concrete.

---

## 0) Scope & Non‑Goals
**In scope (MVP+):** multi‑melody engine (max 3), harmonic movement, timbre/FX palette, rhythmic intelligence, audio‑reactive visuals (Canvas2D), recording/export, optional sample fetch via Freesound, strict UI controls.

**Non‑goals:** DAW/MIDI, cloud accounts, large 3D/GLSL pipelines, heavy AI models. If API keys are missing, disable that feature gracefully.

---

## 1) Architecture
```
src/
  audio/
    engine.ts          # multi-melody scheduler + synthesis + harmony
    fx.ts              # delay, reverb, bitcrush, phaser helpers
    recorder.ts        # MediaRecorder wrapper (master or stems)
  visuals/
    canvas.tsx         # audio-reactive Canvas2D scene
  api/
    freesound.ts       # fetch sample URLs (optional)
  ui/
    controls.tsx       # right-rail controls (see UI spec)
```

---

## 2) Determinism & Clock
- **Transport:** scheduler step = **16th‑note**; stepSec = `(60/bpm)/4`.
- **Seed:** `seed: number` → mulberry32 RNG used for all coin‑flips (melody density, timbre picks, rests). Persist last seed in `localStorage`.
- **Max voices:** up to **3 melodies** + pad + bass + (optional drums) routed to master.

---

## 3) Harmony & Melodies
### 3.1 Tonal Centers (exact)
- Rotate **rootHz** following this loop (slewed over 600ms): `A3=220 → F#3=185 → D3=147 → E3=165`.
- Change every **8 bars** (bar = 4 beats). Slew is linear.

### 3.2 Modes/Scales (exact)
- Support: `majorPent = [0,2,4,7,9]`, `minorPent = [0,3,5,7,10]`.
- Scene may switch between these; see §6.

### 3.3 Melodic Motion (exact)
- Intervals set `[-2,-1,0,1,2]`. Markov transitions (rows by prev interval):
  - `[-2]: [0.10,0.25,0.40,0.20,0.05]`
  - `[-1]: [0.05,0.25,0.45,0.20,0.05]`
  - `[ 0]: [0.10,0.20,0.40,0.20,0.10]`
  - `[ 1]: [0.05,0.20,0.45,0.25,0.05]`
  - `[ 2]: [0.05,0.20,0.40,0.25,0.10]`
- Blend toward uniform by `complexity ∈ [0,1]`.
- **Cadence:** every 16 beats set degree to `0` (60%) or `2` (40%).

### 3.4 Melody Density (exact)
- Per‑scene **density** ∈ [0.4, 0.9] = probability of melodic note per beat. See §6.

---

## 4) Timbre & FX (exact)
### 4.1 Oscillator Timbres
- Allowed per‑note timbre: `sine`, `triangle`, `softsq` (square → LP 3.2kHz, Q=0.7), `fm` (mod ratio 1.5, index 1.8).
- **Pad** uses dual detune: `±0.5%` around target freq.

### 4.2 Global FX Buses
- **Delay:** `DelayNode` with feedback loop. Map `mix ∈ [0,1]` → delayTime `0.3..0.7s`, feedback `0.2..0.7`.
- **Reverb:** simple Schroeder: 3 parallel combs + 1 allpass **or** `ConvolverNode` with a short IR (≤ 200KB). Dry/Wet fixed at 20%.
- **Bitcrush:** optional mild downsample `(hold n=2..4)` on lead only when `complexity > 0.6` (10% chance per phrase).
- **Phaser:** 4‑stage allpass sweep `0.3Hz` on pad at low depth.

### 4.3 Filter Motion
- Master **lowpass** moves with `mix`: cutoff `5kHz..9kHz`, 500ms ramp.

---

## 5) Rhythm (exact, no randomness beyond seed)
- **Bass**: Euclidean (steps=8, pulses=3) on beat grid.
- **Optional drums** (behind flag `enableDrums`, default false):
  - Kick at steps {0,8} plus Euclid (16,5) (90% prob per hit).
  - Snare at {4,12} + ghost at 14 (25%).
  - Hats Euclid (16,9) + extra hit (5%).
- **Swing:** apply 16th swing when `swing ∈ [0,0.2]` (scene‑controlled): delay off‑beats by `swing * stepSec`.

---

## 6) Scenes (exact values)
Cycle these scenes; each lasts `sceneDurationBars = 32` bars. Linear interpolate numeric params; switch `scale`/`timbre` at scene boundary.

| Scene      | scale      | bpm | mix  | complexity | density | timbre |
|------------|------------|-----|------|------------|---------|--------|
| Calm       | majorPent  | 72  | 0.40 | 0.30       | 0.80    | sine   |
| Nocturne   | minorPent  | 62  | 0.55 | 0.45       | 0.65    | triangle |
| Ether      | majorPent  | 68  | 0.65 | 0.55       | 0.55    | fm     |

---

## 7) Visuals (exact)
- **Canvas2D** only (no WebGL).
- Render **1200× (devicePixelRatio)** back buffer, scale to viewport, target **60 FPS** on desktop.
- Visual Mode = **Spectrum Landscape**:
  - Use `AnalyserNode.fftSize = 2048`, get frequency data (Uint8Array).
  - Map 32 mel‑like bands → column heights; gradient colors from current scene (Calm: blue, Nocturne: purple, Ether: teal).
  - Overlay 3 orbits (one per melody) whose radius = rolling RMS of each melody’s output gain.
- Controls: `visualIntensity ∈ [0,1]` scales column height and orbit radius; default 0.7.

---

## 8) Recording & Export (exact)
- Use **MediaRecorder** on the **master bus**.
- `Start Recording` → capture until `Stop`.
- Preferred `mimeType`: `'audio/webm;codecs=opus'`; fallback to auto.
- On stop: save `session-YYYYMMDD-HHMM.webm` and JSON **session file** with:
  - seed, used scenes, root sequence timestamps, user params, app version.
- (Optional after MVP) Per‑stem capture: create parallel MediaStreamDestinations for `melodies`, `pad`, `bass`, `drums`.

---

## 9) API Integration (optional, deterministic)
- **Freesound**: `GET https://freesound.org/apiv2/search/text/?query={term}&fields=id,previews&filter=duration:[0 TO 2]`.
  - Auth: `Authorization: Token <FS_API_KEY>` (read from `import.meta.env.VITE_FREESOUND_KEY`).
  - Rate limit: **max 3 req/min**; cache responses in `localStorage` 24h.
  - Use only if key present; otherwise disable the feature and show a tooltip.
- Samples (if fetched) are used only for **hats** (short bursts). If offline → fall back to noise hats.

---

## 10) UI (exact controls & ranges)
Right‑rail panel:
- **Seed** (number input; default random; persists in localStorage)
- **Enable Scenes** (toggle; default ON)
- **Scene Duration** (select: 16, 32, 64 bars; default 32)
- **Tempo** (40–120 BPM; bound to scene but user may override until next scene switch)
- **Complexity** (0–1 step 0.01)
- **Space (Delay)** (0–1 step 0.01)
- **Visual Intensity** (0–1 step 0.01)
- **Record** (Start/Stop buttons) → downloads on stop
- **Reset** (returns to scene‑managed defaults and generates a new seed)

No layout changes beyond adding these controls in a single column.

---

## 11) Performance & Accessibility
- Desktop CPU ≈ current build; no more than **2ms** average audio callback jitter.
- Avoid GC churn: reuse nodes where possible; one scheduler `setTimeout` per 16th.
- Keyboard focus visible; labels for sliders; contrast ≥ AA.

---

## 12) Acceptance Criteria (measurable)
1. **Determinism:** launching with seed `12345` yields the same 4‑minute structure (same scene and root changes at the same bars) across two runs.
2. **Harmony:** tonal center rotates exactly every 8 bars across A→F#→D→E with 600ms slews.
3. **Scenes:** Calm→Nocturne→Ether each **32 bars**, parameters interpolate; `scale/timbre` switch at boundaries only.
4. **Variety:** within 2 minutes, audible changes in timbre, density, delay, and tonal center; melody does **not** sound like a constant spa loop.
5. **Visuals:** canvas runs at **≥ 55 FPS** on a typical laptop; bars height follow bass/pad energy; orbits follow melody RMS.
6. **Recording:** Start/Stop produces a playable `.webm` and a JSON session file.
7. **API handling:** with a valid `VITE_FREESOUND_KEY`, one search returns samples and hats switch to previews; with no key, feature is disabled without errors.
8. **No errors:** 5‑minute run with no uncaught errors or audio dropouts; PWA install/offline unaffected.

---

## 13) Milestones
- **M1 (Engine Core):** seedable scheduler, Markov melody, Euclid bass, delay/LP filter, harmonic loop, scenes (params only). ✓
- **M2 (Timbre/FX):** triangle/softsq/FM, pad detune, basic phaser, reverb.
- **M3 (Visuals):** Canvas2D Spectrum Landscape + melody orbits; intensity control.
- **M4 (Recording):** master recording + session JSON; basic UI wiring.
- **M5 (API Opt‑in):** Freesound fetch + hats sample fallback + caching.

Each milestone should be a separate PR targeting `main`.

---

## 14) Deliverables
- Code changes as per folders above; no re‑scaffold.
- PR set with:
  - Implementation notes (any deviations from exact values above called out explicitly).
  - 60–120s screen capture showing: scene transitions, root changes, visual reactivity, and a recording demo.
  - Lighthouse PWA checks still pass; Pages deploy green.

---

## 15) Rollback & Flags
- Feature flags: `enableScenes`, `enableDrums`, `enableReverb`, `useFreesound`. Defaults: `true,false,true,false`.
- If regressions occur, set flags to safe defaults or revert `engine.ts` to the last passing version.

