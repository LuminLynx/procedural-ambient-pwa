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

  randomWalkStep(){
    const jumps = [-2,-1,0,1,2];
    const c = this.params.complexity;
    const weights = jumps.map(j => Math.exp(-3*(Math.abs(j))*(1-c)));
    const sum = weights.reduce((a,b)=>a+b,0);
    let r=Math.random()*sum, idx=0; for(; idx<weights.length-1 && (r-=weights[idx])>0; idx++);
    this.degree = (this.degree + jumps[idx] + 5) % 5;
  }

  tick(){
    const beatSec = 60/this.params.bpm;
    const t0 = this.ctx.currentTime;

    this.randomWalkStep();
    const fMel = this.noteHz(this.degree, 1);
    this.playSine(fMel, t0, beatSec*0.85, 0.22, {a:0.02, d:0.2, s:0.55, r:0.25}, 1.5);

    const fPad = this.noteHz((this.degree+2)%5, 2);
    this.playSine(fPad*0.995, t0, beatSec*1.0, 0.12, {a:0.5, d:0.8, s:0.7, r:0.8});
    this.playSine(fPad*1.005, t0, beatSec*1.0, 0.12, {a:0.6, d:0.8, s:0.7, r:0.9});

    const fBass = this.noteHz(this.degree, -1)/2;
    if (Math.random() < 0.8 - 0.5*this.params.complexity)
      this.playSine(fBass, t0, beatSec*0.7, 0.18, {a:0.005, d:0.15, s:0.25, r:0.2});

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
    this.delay.delayTime.setValueAtTime(0.3 + 0.4*mix, this.ctx.currentTime);
    this.fb.gain.setValueAtTime(0.2 + 0.5*mix, this.ctx.currentTime);
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
