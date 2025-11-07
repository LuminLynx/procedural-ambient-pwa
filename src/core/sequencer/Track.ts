// Track class for multi-track support
import { TrackType, TrackConfig } from '../../types/audio';
import { Clip } from './Clip';
import { generateId, clamp } from '../../utils/common';

export class Track {
  id: string;
  name: string;
  type: TrackType;
  clips: Clip[];
  
  // Audio nodes
  private ctx: AudioContext;
  private _input: GainNode;
  private _output: GainNode;
  
  // Controls
  private _volume: number = 0.8;
  private _pan: number = 0;
  private _muted: boolean = false;
  private _solo: boolean = false;
  private _armed: boolean = false;
  
  // Visual
  color: string;
  height: number = 100;
  collapsed: boolean = false;
  
  constructor(ctx: AudioContext, config: TrackConfig = {}) {
    this.id = generateId();
    this.name = config.name || 'New Track';
    this.type = config.type || 'audio';
    this.color = config.color || '#4CAF50';
    this.clips = [];
    
    this.ctx = ctx;
    
    // Setup audio routing
    this._input = ctx.createGain();
    this._output = ctx.createGain();
    
    this._input.connect(this._output);
    
    this.setVolume(this._volume);
  }
  
  get input(): GainNode {
    return this._input;
  }
  
  get output(): GainNode {
    return this._output;
  }
  
  get volume(): number {
    return this._volume;
  }
  
  get pan(): number {
    return this._pan;
  }
  
  get muted(): boolean {
    return this._muted;
  }
  
  get solo(): boolean {
    return this._solo;
  }
  
  get armed(): boolean {
    return this._armed;
  }
  
  addClip(clip: Clip): void {
    this.clips.push(clip);
    this.clips.sort((a, b) => a.position - b.position);
  }
  
  removeClip(clipId: string): void {
    this.clips = this.clips.filter(c => c.id !== clipId);
  }
  
  getClip(clipId: string): Clip | undefined {
    return this.clips.find(c => c.id === clipId);
  }
  
  setVolume(volume: number): void {
    this._volume = clamp(volume, 0, 1);
    const actualVolume = this._muted ? 0 : this._volume;
    this._output.gain.setValueAtTime(
      actualVolume,
      this.ctx.currentTime
    );
  }
  
  setPan(pan: number): void {
    this._pan = clamp(pan, -1, 1);
    // Pan implementation would require StereoPannerNode
    // For now, just store the value
  }
  
  setMute(muted: boolean): void {
    this._muted = muted;
    this.setVolume(this._volume); // Reapply volume with mute state
  }
  
  setSolo(solo: boolean): void {
    this._solo = solo;
  }
  
  setArmed(armed: boolean): void {
    this._armed = armed;
  }
  
  getClipsAt(time: number): Clip[] {
    return this.clips.filter(clip => clip.contains(time));
  }
  
  destroy(): void {
    try {
      this._input.disconnect();
      this._output.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}
