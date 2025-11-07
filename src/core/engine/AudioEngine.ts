// Main Audio Engine - coordinates transport, tracks, and scheduling
import { Transport } from './Transport';
import { Track } from '../sequencer/Track';
import { Pattern } from '../sequencer/Pattern';
import { midiToFreq } from '../../utils/audio/conversion';

export interface AudioEngineConfig {
  sampleRate?: number;
  lookAhead?: number;
}

export class AudioEngine {
  ctx: AudioContext;
  transport: Transport;
  master: GainNode;
  
  private tracks: Map<string, Track> = new Map();
  private patterns: Map<string, Pattern> = new Map();
  private _initialized: boolean = false;
  
  constructor(config: AudioEngineConfig = {}) {
    this.ctx = new AudioContext({
      sampleRate: config.sampleRate
    });
    
    // Create master output
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(this.ctx.destination);
    
    // Create transport
    this.transport = new Transport(this.ctx, 120);
  }
  
  get initialized(): boolean {
    return this._initialized;
  }
  
  async initialize(): Promise<void> {
    if (this._initialized) return;
    
    // Resume audio context (required for autoplay policies)
    await this.ctx.resume();
    
    this._initialized = true;
  }
  
  // Track Management
  
  addTrack(track: Track): void {
    this.tracks.set(track.id, track);
    track.output.connect(this.master);
  }
  
  removeTrack(trackId: string): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.output.disconnect(this.master);
      track.destroy();
      this.tracks.delete(trackId);
    }
  }
  
  getTrack(trackId: string): Track | undefined {
    return this.tracks.get(trackId);
  }
  
  getAllTracks(): Track[] {
    return Array.from(this.tracks.values());
  }
  
  // Pattern Management
  
  addPattern(pattern: Pattern): void {
    this.patterns.set(pattern.id, pattern);
  }
  
  removePattern(patternId: string): void {
    this.patterns.delete(patternId);
  }
  
  getPattern(patternId: string): Pattern | undefined {
    return this.patterns.get(patternId);
  }
  
  getAllPatterns(): Pattern[] {
    return Array.from(this.patterns.values());
  }
  
  // Playback Control
  
  async play(): Promise<void> {
    if (!this._initialized) {
      await this.initialize();
    }
    this.transport.play();
  }
  
  pause(): void {
    this.transport.pause();
  }
  
  stop(): void {
    this.transport.stop();
  }
  
  setBpm(bpm: number): void {
    this.transport.setBpm(bpm);
  }
  
  setPosition(beats: number): void {
    this.transport.setPosition(beats);
  }
  
  // Solo/Mute Management
  
  updateSoloMute(): void {
    const hasSolo = Array.from(this.tracks.values()).some(t => t.solo);
    
    for (const track of this.tracks.values()) {
      if (hasSolo) {
        // If any track is soloed, only soloed tracks should be audible
        const shouldMute = !track.solo;
        // Temporarily override mute state for solo functionality
        const actualVolume = shouldMute ? 0 : track.volume;
        track.output.gain.setValueAtTime(actualVolume, this.ctx.currentTime);
      } else {
        // No solo, respect individual mute state
        track.setMute(track.muted);
      }
    }
  }
  
  // Utility
  
  getCurrentTime(): number {
    return this.ctx.currentTime;
  }
  
  getState() {
    return {
      initialized: this._initialized,
      transport: this.transport.getState(),
      trackCount: this.tracks.size,
      patternCount: this.patterns.size,
      sampleRate: this.ctx.sampleRate,
      currentTime: this.ctx.currentTime
    };
  }
  
  destroy(): void {
    this.transport.stop();
    
    // Clean up all tracks
    for (const track of this.tracks.values()) {
      track.destroy();
    }
    
    this.tracks.clear();
    this.patterns.clear();
    
    // Close audio context
    this.ctx.close();
  }
}
