// Lightweight WebAudio ambient generator
export type TimbreMode = 'sine' | 'triangle' | 'softsq' | 'fm';

export type EngineParams = {
  scale: 'majorPent' | 'minorPent';
  rootHz: number; // e.g., 220
  bpm: number; // tempo
  complexity: number; // 0..1 affects jump size & density
  mix: number; // 0..1 delay mix
  sceneDurationBars?: number; // default 32
  enableScenes?: boolean; // default true
  enableHarmonicLoop?: boolean; // default true
  seed?: number; // if present, makes session repeatable
  drumLevel?: number; // 0..1, overall drum volume
};

const MAJOR_PENT = [0,2,4,7,9];
const MINOR_PENT = [0,3,5,7,10];

// Musical structure constants
const BEATS_PER_BAR = 4;
const BAR_LENGTH = 8; // beats per 8-bar section cycle
const BASS_HITS = 3; // Euclidean rhythm: 3 hits over 8 beats
const CADENCE_INTERVAL = 16; // beats between cadences
const PHRASE_LENGTH = 32; // beats per phrase for octave lifts

// Drum pattern constants
const DRUM_GHOST_PROBABILITY = 0.25; // Probability of ghost snare notes
const DRUM_SNARE_AMP = 0.45; // Base amplitude for snare hits
const DRUM_KICK_AMP = 0.6; // Base amplitude for kick hits
const DRUM_HAT_AMP = 0.25; // Base amplitude for hi-hat hits
const DRUM_HAT_CLOSED_PROB = 0.85; // Probability of closed vs open hi-hats

// Scene definitions with exact density values
type Scene = { 
  name: string; 
  scale: 'majorPent' | 'minorPent'; 
  bpm: number; 
  mix: number; 
  complexity: number;
  density: number; // probability of melodic note per beat
  timbre: TimbreMode;
};

const SCENES: Scene[] = [
  { name: 'Calm', scale: 'majorPent', bpm: 72, mix: 0.4, complexity: 0.30, density: 0.80, timbre: 'sine' },
  { name: 'Nocturne', scale: 'minorPent', bpm: 62, mix: 0.55, complexity: 0.45, density: 0.65, timbre: 'triangle' },
  { name: 'Ether', scale: 'majorPent', bpm: 68, mix: 0.65, complexity: 0.55, density: 0.55, timbre: 'fm' }
];

// Harmonic loop: A3 → F#3 → D3 → E3
const ROOT_LOOP_HZ = [220, 185, 147, 165];

// FM synthesis parameters (exact spec values)
const FM_MOD_RATIO = 1.5; // Modulator frequency ratio
const FM_INDEX = 1.8; // FM index for modulation depth

// Harmonic slew rate (interpolation factor per beat)
const HARMONIC_SLEW_RATE = 0.15;

// Mulberry32 seeded RNG
function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export class AmbientEngine {
  ctx: AudioContext;
  gain: GainNode;
  delay: DelayNode;
  fb: GainNode;
  out: GainNode;
  filter: BiquadFilterNode;
  running = false;
  params: EngineParams;
  degree = 0;
  schedulerId: number | null = null;
  beatCount = 0;
  lastInterval = 0;
  
  // Scene engine state
  currentSceneIndex = 0;
  sceneStartBeat = 0;
  sceneDurationBars = 32;
  enableScenes = true;
  enableHarmonicLoop = true;
  currentTimbre: TimbreMode = 'sine';
  currentDensity = 0.80; // current melody density
  
  // Harmonic loop state
  harmonicLoopIndex = 0;
  targetRootHz: number;
  currentRootHz: number;
  harmonicSlewStart?: number;
  harmonicSlewEnd?: number;
  harmonicSlewStartTime?: number;
  harmonicSlewEndTime?: number;
  
  // Bell voice state
  nextBellBeat = 0;
  
  // Multi-melody buses (up to 3)
  melodyBuses: GainNode[] = [];
  
  // Pan nodes for stereo drift
  padPanL: StereoPannerNode;
  padPanR: StereoPannerNode;
  bellPan: StereoPannerNode;
  panDriftPhase = 0;
  
  // Seeded RNG
  rng: () => number;
  
  // Drum section
  drumBus: GainNode;
  drumCompressor: DynamicsCompressorNode;
  noiseBuffer: AudioBuffer;
  sixteenthCount = 0; // 16th note counter for drum patterns

  constructor(params: EngineParams){
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.out = this.ctx.createGain();
    this.gain = this.ctx.createGain();
    this.delay = this.ctx.createDelay(2.0);
    this.fb = this.ctx.createGain();
    this.filter = this.ctx.createBiquadFilter();

    this.gain.gain.value = 0.3;
    this.delay.delayTime.value = 0.45;
    this.fb.gain.value = 0.35;
    
    // Setup filter
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 2000;
    this.filter.Q.value = 1.0;

    // Create pan nodes
    this.padPanL = this.ctx.createStereoPanner();
    this.padPanR = this.ctx.createStereoPanner();
    this.bellPan = this.ctx.createStereoPanner();
    this.padPanL.pan.value = 0;
    this.padPanR.pan.value = 0;
    this.bellPan.pan.value = 0;

    // Connect audio graph: gain → filter → delay feedback loop → out
    this.gain.connect(this.filter);
    this.filter.connect(this.delay);
    this.delay.connect(this.fb);
    this.fb.connect(this.delay);
    this.delay.connect(this.out);
    this.filter.connect(this.out);
    this.out.connect(this.ctx.destination);

    // Setup drum bus with compressor
    this.drumBus = this.ctx.createGain();
    this.drumCompressor = this.ctx.createDynamicsCompressor();
    this.drumCompressor.threshold.value = -20;
    this.drumCompressor.ratio.value = 3;
    this.drumCompressor.attack.value = 0.003;
    this.drumCompressor.release.value = 0.25;
    this.drumBus.connect(this.drumCompressor);
    this.drumCompressor.connect(this.out);
    
    this.params = params;
    
    // Initialize scene engine parameters
    this.sceneDurationBars = params.sceneDurationBars ?? 32;
    this.enableScenes = params.enableScenes ?? true;
    this.enableHarmonicLoop = params.enableHarmonicLoop ?? true;
    
    // Initialize RNG (must come before createNoiseBuffer)
    this.rng = params.seed !== undefined ? mulberry32(params.seed) : Math.random;
    
    // Create shared noise buffer for hats and snare (uses RNG)
    this.noiseBuffer = this.createNoiseBuffer();

    // Create melody buses for multi-melody output tracking (max 3)
    for (let i = 0; i < 3; i++) {
      const melodyBus = this.ctx.createGain();
      melodyBus.connect(this.gain);
      this.melodyBuses.push(melodyBus);
    }
    
    // Initialize harmonic loop
    this.targetRootHz = params.rootHz;
    this.currentRootHz = params.rootHz;
    
    // Initialize bell timing
    this.nextBellBeat = Math.floor(this.rng() * 8) + 8; // 8-16 beats
  }

  currentScale(){ return this.params.scale === 'majorPent' ? MAJOR_PENT : MINOR_PENT; }

  noteHz(degree: number, octaveShift=0){
    const semi = this.currentScale()[((degree % 5)+5)%5] + 12*octaveShift;
    return this.currentRootHz * Math.pow(2, semi/12);
  }
  
  // Scene Engine: interpolate between current and next scene
  updateSceneEngine() {
    if (!this.enableScenes) return;
    
    const barCount = Math.floor(this.beatCount / BEATS_PER_BAR);
    const barsIntoScene = barCount - this.sceneStartBeat / BEATS_PER_BAR;
    
    // Check if we should transition to next scene
    if (barsIntoScene >= this.sceneDurationBars) {
      this.currentSceneIndex = (this.currentSceneIndex + 1) % SCENES.length;
      this.sceneStartBeat = this.beatCount;
    }
    
    // Interpolate parameters
    const currentScene = SCENES[this.currentSceneIndex];
    const nextScene = SCENES[(this.currentSceneIndex + 1) % SCENES.length];
    const progress = Math.min(barsIntoScene / this.sceneDurationBars, 1.0);
    
    // Smooth interpolation using ease-in-out
    const t = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    // Interpolate BPM
    const targetBpm = currentScene.bpm + (nextScene.bpm - currentScene.bpm) * t;
    this.params.bpm = targetBpm;
    
    // Interpolate mix
    const targetMix = currentScene.mix + (nextScene.mix - currentScene.mix) * t;
    this.params.mix = targetMix;
    this.setMix(targetMix);
    
    // Interpolate complexity
    this.params.complexity = currentScene.complexity + (nextScene.complexity - currentScene.complexity) * t;
    
    // Interpolate density
    this.currentDensity = currentScene.density + (nextScene.density - currentScene.density) * t;
    
    // Update scale (switch at 50% through scene)
    this.params.scale = progress < 0.5 ? currentScene.scale : nextScene.scale;
    
    // Update timbre (switch at 50% through scene)
    this.currentTimbre = progress < 0.5 ? currentScene.timbre : nextScene.timbre;
  }
  
  // Harmonic Loop: shift root frequency every 8 bars with 600ms slew
  updateHarmonicLoop() {
    if (!this.enableHarmonicLoop) {
      this.targetRootHz = this.params.rootHz;
      this.currentRootHz = this.params.rootHz;
      return;
    }
    
    const barCount = Math.floor(this.beatCount / BEATS_PER_BAR);
    
    // Every 8 bars, move to next root in the loop (exact spec: A3=220 → F#3=185 → D3=147 → E3=165)
    if (barCount % 8 === 0 && this.beatCount % BEATS_PER_BAR === 0) {
      const oldTarget = this.targetRootHz;
      this.harmonicLoopIndex = (this.harmonicLoopIndex + 1) % ROOT_LOOP_HZ.length;
      this.targetRootHz = ROOT_LOOP_HZ[this.harmonicLoopIndex];
      
      // Only update if target actually changed
      if (oldTarget !== this.targetRootHz) {
        // Linear slew over 600ms (exact spec)
        const t0 = this.ctx.currentTime;
        const slewTime = 0.6; // 600ms
        
        // Store start and end for linear interpolation
        const startHz = this.currentRootHz;
        const endHz = this.targetRootHz;
        const startTime = t0;
        const endTime = t0 + slewTime;
        
        // We'll interpolate in the tick function
        this.harmonicSlewStart = startHz;
        this.harmonicSlewEnd = endHz;
        this.harmonicSlewStartTime = startTime;
        this.harmonicSlewEndTime = endTime;
      }
    }
    
    // Interpolate current root based on slew timing
    if (this.harmonicSlewStartTime !== undefined && this.harmonicSlewEndTime !== undefined) {
      const t0 = this.ctx.currentTime;
      if (t0 >= this.harmonicSlewEndTime) {
        // Slew complete
        this.currentRootHz = this.harmonicSlewEnd!;
        this.harmonicSlewStartTime = undefined;
        this.harmonicSlewEndTime = undefined;
      } else if (t0 >= this.harmonicSlewStartTime) {
        // Slewing in progress - linear interpolation
        const progress = (t0 - this.harmonicSlewStartTime) / (this.harmonicSlewEndTime - this.harmonicSlewStartTime);
        this.currentRootHz = this.harmonicSlewStart! + (this.harmonicSlewEnd! - this.harmonicSlewStart!) * progress;
      }
    }
  }
  
  // Update pan drift for stereo movement
  updatePanDrift() {
    const t0 = this.ctx.currentTime;
    this.panDriftPhase += 0.01;
    
    const panValue = Math.sin(this.panDriftPhase) * 0.1;
    this.padPanL.pan.setValueAtTime(-panValue, t0);
    this.padPanR.pan.setValueAtTime(panValue, t0);
    this.bellPan.pan.setValueAtTime(Math.sin(this.panDriftPhase * 1.3) * 0.15, t0);
  }
  
  // Create oscillator with timbre variation
  // Returns [oscillator, optional modulator oscillator for cleanup]
  createOscillator(freq: number, timbre: TimbreMode): [OscillatorNode, OscillatorNode | null] {
    const osc = this.ctx.createOscillator();
    let modOsc: OscillatorNode | null = null;
    
    switch (timbre) {
      case 'sine':
        osc.type = 'sine';
        break;
      case 'triangle':
        osc.type = 'triangle';
        break;
      case 'softsq':
        osc.type = 'square';
        break;
      case 'fm': {
        // FM synthesis: carrier + modulator
        osc.type = 'sine';
        modOsc = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        modOsc.frequency.value = freq * FM_MOD_RATIO;
        modGain.gain.value = freq * FM_INDEX;
        modOsc.connect(modGain).connect(osc.frequency);
        break;
      }
    }
    
    osc.frequency.value = freq;
    return [osc, modOsc];
  }

  // Markov interval transition with exact spec transitions
  markovStep(){
    const intervals = [-2, -1, 0, 1, 2];
    // Exact transition matrix from spec:
    const baseWeights = [
      [0.10, 0.25, 0.40, 0.20, 0.05], // from -2
      [0.05, 0.25, 0.45, 0.20, 0.05], // from -1
      [0.10, 0.20, 0.40, 0.20, 0.10], // from  0 (center-weighted)
      [0.05, 0.20, 0.45, 0.25, 0.05], // from +1
      [0.05, 0.20, 0.40, 0.25, 0.10]  // from +2
    ];
    
    const lastIdx = intervals.indexOf(this.lastInterval);
    const row = lastIdx >= 0 ? baseWeights[lastIdx] : baseWeights[2];
    
    // Blend with uniform distribution based on complexity
    const c = this.params.complexity;
    const uniform = 0.2; // uniform probability for each interval
    const weights = row.map(w => w * (1 - c) + uniform * c);
    
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = this.rng() * sum;
    let idx = 0;
    for (; idx < weights.length - 1 && (r -= weights[idx]) > 0; idx++);
    
    const interval = intervals[idx];
    this.lastInterval = interval;
    this.degree = (this.degree + interval + 5) % 5;
  }

  // Euclidean rhythm: distribute pulses evenly over steps
  euclideanRhythm(step: number, pulses: number, steps: number): boolean {
    return (step * pulses) % steps < pulses;
  }
  
  // Create shared noise buffer for drums
  createNoiseBuffer(): AudioBuffer {
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Use seeded RNG for deterministic noise when seed is provided
    for (let i = 0; i < bufferSize; i++) {
      data[i] = this.rng() * 2 - 1;
    }
    return buffer;
  }
  
  // Kick drum: sine pitch-drop thump
  playKick(t0: number, amp: number) {
    const drumLevel = this.params.drumLevel ?? 0.5;
    if (drumLevel === 0) return;
    
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t0);
    osc.frequency.exponentialRampToValueAtTime(40, t0 + 0.05);
    
    g.gain.setValueAtTime(amp * drumLevel, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
    
    osc.connect(g);
    g.connect(this.drumBus);
    
    osc.start(t0);
    osc.stop(t0 + 0.3);
  }
  
  // Snare drum: filtered noise burst
  playSnare(t0: number, amp: number, isGhost: boolean = false) {
    const drumLevel = this.params.drumLevel ?? 0.5;
    if (drumLevel === 0) return;
    
    const noise = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    
    noise.buffer = this.noiseBuffer;
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1.5;
    
    const finalAmp = isGhost ? amp * 0.3 : amp;
    const duration = isGhost ? 0.06 : 0.12;
    
    g.gain.setValueAtTime(finalAmp * drumLevel, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.drumBus);
    
    noise.start(t0);
    noise.stop(t0 + duration);
  }
  
  // Hi-hats: high-passed noise clicks
  playHat(t0: number, amp: number, closed: boolean = true) {
    const drumLevel = this.params.drumLevel ?? 0.5;
    if (drumLevel === 0) return;
    
    const noise = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    
    noise.buffer = this.noiseBuffer;
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    filter.Q.value = 1.0;
    
    const duration = closed ? 0.03 : 0.08;
    const finalAmp = closed ? amp : amp * 0.7;
    
    g.gain.setValueAtTime(finalAmp * drumLevel, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.drumBus);
    
    noise.start(t0);
    noise.stop(t0 + duration);
  }
  
  // Drum scheduler: called every 16th note
  playDrums(t0: number, sixteenthStep: number) {
    const drumLevel = this.params.drumLevel ?? 0.5;
    if (drumLevel === 0) return;
    
    // Kick: Euclidean 5/16 pattern (main beats + occasional syncopation)
    if (this.euclideanRhythm(sixteenthStep % 16, 5, 16)) {
      this.playKick(t0, DRUM_KICK_AMP);
    }
    
    // Snare: base pattern on beats 2 and 4 (steps 4 and 12) + ghosts
    const beatStep = sixteenthStep % 16;
    if (beatStep === 4 || beatStep === 12) {
      this.playSnare(t0, DRUM_SNARE_AMP, false);
    } else if (this.euclideanRhythm(sixteenthStep % 16, 2, 16) && this.rng() < DRUM_GHOST_PROBABILITY) {
      // Occasional ghost notes
      this.playSnare(t0, DRUM_SNARE_AMP, true);
    }
    
    // Hi-hats: Euclidean 9/16 pattern (off-beats and syncopations)
    if (this.euclideanRhythm(sixteenthStep % 16, 9, 16)) {
      const isClosed = this.rng() < DRUM_HAT_CLOSED_PROB; // Mostly closed hats
      this.playHat(t0, DRUM_HAT_AMP, isClosed);
    }
  }

  tick(){
    const beatSec = 60/this.params.bpm;
    const t0 = this.ctx.currentTime;
    
    // Update scene engine and harmonic loop
    this.updateSceneEngine();
    this.updateHarmonicLoop();
    this.updatePanDrift();
    
    // Trigger drums on 16th note subdivisions
    // Schedule 4 drum events per beat for tighter rhythmic control.
    // This approach is acceptable for this use case as it creates a manageable
    // number of audio nodes per beat and provides good timing precision.
    const sixteenthSec = beatSec / 4;
    for (let i = 0; i < 4; i++) {
      const sixteenthTime = t0 + (i * sixteenthSec);
      this.playDrums(sixteenthTime, this.sixteenthCount + i);
    }
    this.sixteenthCount += 4; // Advance by 4 sixteenth notes per beat
    
    // 8-bar section root offsets (I–vi–IV–V pattern mapped to pentatonic)
    const sectionOffsets = [0, -3, -1, 2]; // cycle every 8 bars
    const barIndex = Math.floor(this.beatCount / BEATS_PER_BAR);
    const sectionOffset = sectionOffsets[barIndex % sectionOffsets.length];

    // Cadence every 16 beats: nudge to stable degree (exact spec: 60% to 0, 40% to 2)
    const isCadence = this.beatCount % CADENCE_INTERVAL === (CADENCE_INTERVAL - 1);
    if (isCadence) {
      this.degree = this.rng() < 0.6 ? 0 : 2; // stable degrees (60% / 40% split)
      this.lastInterval = 0;
    } else {
      this.markovStep();
    }

    // Melody with density control (exact spec: density ∈ [0.4, 0.9])
    if (this.rng() < this.currentDensity) {
      // Occasional octave lift at phrase ends (every 32 beats)
      const isPhraseEnd = this.beatCount % PHRASE_LENGTH === (PHRASE_LENGTH - 1);
      const octaveShift = isPhraseEnd && this.rng() < 0.3 ? 2 : 1;
      const fMel = this.noteHz(this.degree, octaveShift);
      this.playNote(fMel, t0, beatSec*0.85, 0.22, {a:0.02, d:0.2, s:0.55, r:0.25}, this.currentTimbre, 1.5, undefined, 0);
    }

    // Pad with section offset and stereo panning (exact spec: dual detune ±0.5%)
    const padDegree = (this.degree + 2 + sectionOffset + 5) % 5;
    const fPad = this.noteHz(padDegree, 2);
    this.playNote(fPad*0.995, t0, beatSec*1.0, 0.12, {a:0.5, d:0.8, s:0.7, r:0.8}, this.currentTimbre, undefined, this.padPanL);
    this.playNote(fPad*1.005, t0, beatSec*1.0, 0.12, {a:0.6, d:0.8, s:0.7, r:0.9}, this.currentTimbre, undefined, this.padPanR);

    // Bass with Euclidean rhythm and section offset
    const beatInBar = this.beatCount % BAR_LENGTH;
    if (this.euclideanRhythm(beatInBar, BASS_HITS, BAR_LENGTH)) {
      const bassDegree = (this.degree + sectionOffset + 5) % 5;
      const fBass = this.noteHz(bassDegree, -1)/2;
      this.playNote(fBass, t0, beatSec*0.7, 0.18, {a:0.005, d:0.15, s:0.25, r:0.2}, 'sine');
    }
    
    // Bell voice: sparse, upper octave, with stereo drift
    if (this.beatCount >= this.nextBellBeat) {
      const bellOctave = 2 + Math.floor(this.rng() * 2); // oct +2 or +3
      const bellDegree = Math.floor(this.rng() * 5);
      const fBell = this.noteHz(bellDegree, bellOctave);
      this.playNote(fBell, t0, beatSec*0.3, 0.15, {a:0.01, d:0.1, s:0.2, r:0.15}, this.currentTimbre, undefined, this.bellPan);
      
      // Schedule next bell in 8-16 beats (2-4 bars)
      this.nextBellBeat = this.beatCount + Math.floor(this.rng() * 9) + 8;
    }

    this.beatCount++;
    const delay = beatSec * 1000; 
    this.schedulerId = window.setTimeout(()=>this.tick(), delay);
  }

  playNote(freq:number, t0:number, dur:number, amp:number, env:{a:number,d:number,s:number,r:number}, timbre:TimbreMode='sine', vibrato?:number, panNode?:StereoPannerNode, melodyBusIndex?:number){
    const [osc, modOsc] = this.createOscillator(freq, timbre);
    const g = this.ctx.createGain();

    // Apply LP filter for softsq timbre (exact spec: 3.2kHz Q=0.7)
    let filterNode: BiquadFilterNode | null = null;
    if (timbre === 'softsq') {
      filterNode = this.ctx.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.value = 3200; // 3.2kHz
      filterNode.Q.value = 0.7;
      g.gain.value = 0.3; // reduce gain for square wave
    }

    if (vibrato){
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 4.5;
      lfoGain.gain.value = vibrato;
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start(t0);
      lfo.stop(t0 + dur + env.r + 0.05);
    }

    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(amp, t0 + env.a);
    g.gain.linearRampToValueAtTime(amp*env.s, t0 + env.a + env.d);
    g.gain.setValueAtTime(amp*env.s, t0 + Math.max(env.a+env.d, dur));
    g.gain.linearRampToValueAtTime(0.0001, t0 + Math.max(env.a+env.d, dur) + env.r);

    // Connect oscillator → filter (if softsq) → gain → output
    if (filterNode) {
      osc.connect(filterNode);
      filterNode.connect(g);
    } else {
      osc.connect(g);
    }
    
    // Route to melody bus if specified, otherwise to main gain
    if (melodyBusIndex !== undefined && melodyBusIndex < this.melodyBuses.length) {
      if (panNode) {
        g.connect(panNode).connect(this.melodyBuses[melodyBusIndex]);
      } else {
        g.connect(this.melodyBuses[melodyBusIndex]);
      }
    } else {
      if (panNode) {
        g.connect(panNode).connect(this.gain);
      } else {
        g.connect(this.gain);
      }
    }
    
    // Start oscillators
    if (modOsc) {
      modOsc.start(t0);
      modOsc.stop(t0 + Math.max(env.a+env.d, dur) + env.r + 0.05);
    }
    osc.start(t0);
    osc.stop(t0 + Math.max(env.a+env.d, dur) + env.r + 0.05);
  }

  setMix(mix:number){
    this.params.mix = mix;
    const t0 = this.ctx.currentTime;
    this.delay.delayTime.setValueAtTime(0.3 + 0.4*mix, t0);
    this.fb.gain.setValueAtTime(0.2 + 0.5*mix, t0);
    
    // Modulate filter cutoff with mix (exact spec: 5kHz..9kHz, 500ms ramp)
    const cutoff = 5000 + mix * 4000;
    this.filter.frequency.setValueAtTime(this.filter.frequency.value, t0);
    this.filter.frequency.linearRampToValueAtTime(cutoff, t0 + 0.5);
  }

  setScale(scale: 'majorPent' | 'minorPent'){
    this.params.scale = scale;
  }

  setRootHz(rootHz: number){
    this.params.rootHz = rootHz;
  }

  setBpm(bpm: number){
    this.params.bpm = bpm;
  }

  setComplexity(complexity: number){
    this.params.complexity = complexity;
  }
  
  setDrumLevel(drumLevel: number){
    this.params.drumLevel = drumLevel;
  }
  
  // Get current scene name for visuals
  getCurrentSceneName(): 'Calm' | 'Nocturne' | 'Ether' {
    return SCENES[this.currentSceneIndex].name as 'Calm' | 'Nocturne' | 'Ether';
  }
  
  // Get melody buses for visual analysis
  getMelodyBuses(): AudioNode[] {
    return this.melodyBuses;
  }
  
  // Get master output node for recording
  getMasterNode(): AudioNode {
    return this.out;
  }

  async start(){
    if (this.running) return;
    await this.ctx.resume();
    this.setMix(this.params.mix);
    this.running = true;
    this.tick();
  }

  stop(){
    if (!this.running) return;
    if (this.schedulerId) window.clearTimeout(this.schedulerId);
    this.schedulerId = null;
    this.running = false;
  }
}
