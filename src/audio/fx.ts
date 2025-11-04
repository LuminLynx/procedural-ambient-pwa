// FX module: delay, reverb, bitcrush, phaser helpers

/**
 * Delay with exact parameter mapping
 * mix ∈ [0,1] → delayTime 0.3..0.7s, feedback 0.2..0.7
 */
export function createDelay(ctx: AudioContext, mix: number = 0.5): {
  input: GainNode;
  output: GainNode;
  delayNode: DelayNode;
  feedbackNode: GainNode;
  setMix: (mix: number) => void;
} {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const delayNode = ctx.createDelay(2.0);
  const feedbackNode = ctx.createGain();
  const wetGain = ctx.createGain();
  const dryGain = ctx.createGain();

  // Map mix to delay parameters
  const delayTime = 0.3 + mix * 0.4; // 0.3..0.7s
  const feedback = 0.2 + mix * 0.5; // 0.2..0.7

  delayNode.delayTime.value = delayTime;
  feedbackNode.gain.value = feedback;
  wetGain.gain.value = mix;
  dryGain.gain.value = 1.0;

  // Connect: input → dry → output
  //              → delay → feedback → delay
  //              → wet → output
  input.connect(dryGain);
  dryGain.connect(output);
  
  input.connect(delayNode);
  delayNode.connect(feedbackNode);
  feedbackNode.connect(delayNode);
  delayNode.connect(wetGain);
  wetGain.connect(output);

  const setMix = (newMix: number) => {
    const t = ctx.currentTime;
    const newDelayTime = 0.3 + newMix * 0.4;
    const newFeedback = 0.2 + newMix * 0.5;
    
    delayNode.delayTime.setValueAtTime(newDelayTime, t);
    feedbackNode.gain.setValueAtTime(newFeedback, t);
    wetGain.gain.setValueAtTime(newMix, t);
  };

  return { input, output, delayNode, feedbackNode, setMix };
}

/**
 * Simple Schroeder reverb: 3 parallel combs + 1 allpass
 * Dry/Wet fixed at 20%
 */
export function createReverb(ctx: AudioContext): {
  input: GainNode;
  output: GainNode;
} {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const wet = ctx.createGain();
  const dry = ctx.createGain();

  wet.gain.value = 0.2; // 20% wet
  dry.gain.value = 0.8; // 80% dry

  // Comb filter delays (in seconds)
  const combDelays = [0.029, 0.037, 0.041];
  const combDecay = 0.5;

  // Create 3 parallel comb filters
  const combs = combDelays.map(delayTime => {
    const delay = ctx.createDelay(1.0);
    const feedback = ctx.createGain();
    const combOut = ctx.createGain();
    
    delay.delayTime.value = delayTime;
    feedback.gain.value = combDecay;
    
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(combOut);
    
    return { input: delay, output: combOut };
  });

  // Allpass filter
  const apDelay = ctx.createDelay(1.0);
  const apFeedback = ctx.createGain();
  const apFeedforward = ctx.createGain();
  const apSum = ctx.createGain();
  
  apDelay.delayTime.value = 0.013;
  apFeedback.gain.value = 0.7;
  apFeedforward.gain.value = -0.7;

  // Wire allpass
  apDelay.connect(apFeedback);
  apFeedback.connect(apDelay);
  apDelay.connect(apSum);
  apFeedforward.connect(apSum);

  // Connect everything
  input.connect(dry);
  dry.connect(output);

  // Input → combs → allpass → wet → output
  combs.forEach(comb => {
    input.connect(comb.input);
    comb.output.connect(apDelay);
    comb.output.connect(apFeedforward);
  });
  
  apSum.connect(wet);
  wet.connect(output);

  return { input, output };
}

/**
 * Bitcrush: mild downsample (hold n=2..4 samples)
 * Applied on lead only when complexity > 0.6 (10% chance per phrase)
 */
export function createBitcrusher(ctx: AudioContext, holdSamples: number = 3): {
  input: GainNode;
  output: GainNode;
  processor: ScriptProcessorNode;
} {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const bufferSize = 256;
  const processor = ctx.createScriptProcessor(bufferSize, 1, 1);

  let holdCounter = 0;
  let lastSample = 0;

  processor.onaudioprocess = (e) => {
    const inputData = e.inputBuffer.getChannelData(0);
    const outputData = e.outputBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      if (holdCounter === 0) {
        lastSample = inputData[i];
      }
      outputData[i] = lastSample;
      holdCounter = (holdCounter + 1) % holdSamples;
    }
  };

  input.connect(processor);
  processor.connect(output);

  return { input, output, processor };
}

/**
 * Phaser: 4-stage allpass sweep at 0.3Hz
 * Applied on pad at low depth
 */
export function createPhaser(ctx: AudioContext): {
  input: GainNode;
  output: GainNode;
  lfo: OscillatorNode;
  start: () => void;
  stop: () => void;
} {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const stages = 4;
  
  // Create LFO for frequency sweep
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.3; // 0.3Hz sweep
  lfoGain.gain.value = 200; // Sweep range ±200Hz

  // Create allpass filters
  const allpasses: BiquadFilterNode[] = [];
  for (let i = 0; i < stages; i++) {
    const ap = ctx.createBiquadFilter();
    ap.type = 'allpass';
    ap.frequency.value = 800; // Center frequency
    ap.Q.value = 0.7;
    allpasses.push(ap);
  }

  // Connect LFO to all allpass frequencies
  lfo.connect(lfoGain);
  allpasses.forEach(ap => {
    lfoGain.connect(ap.frequency);
  });

  // Chain allpass filters
  let current: AudioNode = input;
  allpasses.forEach(ap => {
    current.connect(ap);
    current = ap;
  });
  current.connect(output);

  const start = () => lfo.start();
  const stop = () => lfo.stop();

  return { input, output, lfo, start, stop };
}

/**
 * Create lowpass filter with frequency controlled by mix parameter
 * mix ∈ [0,1] → cutoff 5kHz..9kHz, 500ms ramp
 */
export function createMasterFilter(ctx: AudioContext): {
  filter: BiquadFilterNode;
  setMix: (mix: number) => void;
} {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 7000; // default mid-range
  filter.Q.value = 0.7;

  const setMix = (mix: number) => {
    const cutoff = 5000 + mix * 4000; // 5kHz..9kHz
    const t = ctx.currentTime;
    filter.frequency.setValueAtTime(filter.frequency.value, t);
    filter.frequency.linearRampToValueAtTime(cutoff, t + 0.5); // 500ms ramp
  };

  return { filter, setMix };
}
