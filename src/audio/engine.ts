// Lightweight WebAudio ambient generator
export type EngineParams = {
  scale: 'majorPent' | 'minorPent';
  rootHz: number; // e.g., 220
  bpm: number; // tempo
  complexity: number; // 0..1 affects jump size & density
  mix: number; // 0..1 delay mix
};

const MAJOR_PENT = [0,2,4,7,9];
const MINOR_PENT = [0,3,5,7,10];

export class AmbientEngine {
  ctx: AudioContext;
  gain: GainNode;
  delay: DelayNode;
  fb: GainNode;
  out: GainNode;
  running = false;
  params: EngineParams;
  degree = 0;
  schedulerId: number | null = null;
  beatCount = 0;
  lastInterval = 0;

  constructor(params: EngineParams){
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.out = this.ctx.createGain();
    this.gain = this.ctx.createGain();
    this.delay = this.ctx.createDelay(2.0);
    this.fb = this.ctx.createGain();

    this.gain.gain.value = 0.3;
    this.delay.delayTime.value = 0.45;
    this.fb.gain.value = 0.35;

    this.gain.connect(this.delay);
    this.delay.connect(this.fb);
    this.fb.connect(this.delay);
    this.delay.connect(this.out);
    this.gain.connect(this.out);
    this.out.connect(this.ctx.destination);

    this.params = params;
  }

  currentScale(){ return this.params.scale === 'majorPent' ? MAJOR_PENT : MINOR_PENT; }

  noteHz(degree: number, octaveShift=0){
    const semi = this.currentScale()[((degree % 5)+5)%5] + 12*octaveShift;
    return this.params.rootHz * Math.pow(2, semi/12);
  }

  // Markov interval transition: center-weighted, blended by complexity
  markovStep(){
    const intervals = [-2, -1, 0, 1, 2];
    // Transition matrix: favor staying near 0 when complexity is low
    const baseWeights = [
      [0.2, 0.3, 0.3, 0.15, 0.05], // from -2
      [0.15, 0.25, 0.35, 0.2, 0.05], // from -1
      [0.1, 0.2, 0.4, 0.2, 0.1],   // from 0 (center-weighted)
      [0.05, 0.2, 0.35, 0.25, 0.15], // from +1
      [0.05, 0.15, 0.3, 0.3, 0.2]  // from +2
    ];
    
    const lastIdx = intervals.indexOf(this.lastInterval);
    const row = lastIdx >= 0 ? baseWeights[lastIdx] : baseWeights[2];
    
    // Blend with uniform distribution based on complexity
    const c = this.params.complexity;
    const uniform = 0.2; // uniform probability for each interval
    const weights = row.map(w => w * (1 - c) + uniform * c);
    
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
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

  tick(){
    const beatSec = 60/this.params.bpm;
    const t0 = this.ctx.currentTime;
    
    // 8-bar section root offsets (I–vi–IV–V pattern mapped to pentatonic)
    const sectionOffsets = [0, -3, -1, 2]; // cycle every 8 bars
    const barIndex = Math.floor(this.beatCount / 4);
    const sectionOffset = sectionOffsets[barIndex % sectionOffsets.length];

    // Cadence every 16 beats: nudge to stable degree
    const isCadence = this.beatCount % 16 === 15;
    if (isCadence && Math.random() < 0.75) {
      this.degree = Math.random() < 0.5 ? 0 : 2; // stable degrees
      this.lastInterval = 0;
    } else {
      this.markovStep();
    }

    // Melody with probabilistic rests
    const restProb = 0.15 + 0.25 * this.params.complexity;
    if (Math.random() > restProb) {
      // Occasional octave lift at phrase ends (every 32 beats)
      const isPhraseEnd = this.beatCount % 32 === 31;
      const octaveShift = isPhraseEnd && Math.random() < 0.3 ? 2 : 1;
      const fMel = this.noteHz(this.degree, octaveShift);
      this.playSine(fMel, t0, beatSec*0.85, 0.22, {a:0.02, d:0.2, s:0.55, r:0.25}, 1.5);
    }

    // Pad with section offset
    const padDegree = (this.degree + 2 + sectionOffset + 5) % 5;
    const fPad = this.noteHz(padDegree, 2);
    this.playSine(fPad*0.995, t0, beatSec*1.0, 0.12, {a:0.5, d:0.8, s:0.7, r:0.8});
    this.playSine(fPad*1.005, t0, beatSec*1.0, 0.12, {a:0.6, d:0.8, s:0.7, r:0.9});

    // Bass with Euclidean rhythm and section offset
    const beatInBar = this.beatCount % 8;
    if (this.euclideanRhythm(beatInBar, 3, 8)) {
      const bassDegree = (this.degree + sectionOffset + 5) % 5;
      const fBass = this.noteHz(bassDegree, -1)/2;
      this.playSine(fBass, t0, beatSec*0.7, 0.18, {a:0.005, d:0.15, s:0.25, r:0.2});
    }

    this.beatCount++;
    const delay = beatSec * 1000; 
    this.schedulerId = window.setTimeout(()=>this.tick(), delay);
  }

  playSine(freq:number, t0:number, dur:number, amp:number, env:{a:number,d:number,s:number,r:number}, vibrato?:number){
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);
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

    osc.connect(g).connect(this.gain);
    osc.start(t0);
    osc.stop(t0 + Math.max(env.a+env.d, dur) + env.r + 0.05);
  }

  setMix(mix:number){
    this.params.mix = mix;
    this.delay.delayTime.setValueAtTime(0.3 + 0.4*mix, this.ctx.currentTime);
    this.fb.gain.setValueAtTime(0.2 + 0.5*mix, this.ctx.currentTime);
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
