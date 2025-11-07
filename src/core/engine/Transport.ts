// Transport system for playback control
import { TransportState } from '../../types/sequencer';
import { clamp } from '../../utils/common';

export type TransportCallback = (position: number) => void;
export type PlayStateCallback = (playing: boolean) => void;

export class Transport {
  private ctx: AudioContext;
  private _bpm: number = 120;
  private _playing: boolean = false;
  private _position: number = 0; // in beats
  private _loopStart: number = 0;
  private _loopEnd: number = 32;
  private _looping: boolean = false;
  
  // Scheduling
  private schedulerId: number | null = null;
  private scheduleAhead: number = 0.1; // seconds
  private lastScheduleTime: number = 0;
  
  // Callbacks
  private onPositionChange: TransportCallback[] = [];
  private onPlayStateChange: PlayStateCallback[] = [];
  
  constructor(ctx: AudioContext, bpm: number = 120) {
    this.ctx = ctx;
    this._bpm = bpm;
  }
  
  get playing(): boolean {
    return this._playing;
  }
  
  get position(): number {
    return this._position;
  }
  
  get bpm(): number {
    return this._bpm;
  }
  
  get looping(): boolean {
    return this._looping;
  }
  
  get loopStart(): number {
    return this._loopStart;
  }
  
  get loopEnd(): number {
    return this._loopEnd;
  }
  
  getState(): TransportState {
    return {
      playing: this._playing,
      position: this._position,
      bpm: this._bpm,
      looping: this._looping,
      loopStart: this._loopStart,
      loopEnd: this._loopEnd
    };
  }
  
  play(): void {
    if (this._playing) return;
    this._playing = true;
    this.lastScheduleTime = this.ctx.currentTime;
    this.schedule();
    this.onPlayStateChange.forEach(cb => cb(true));
  }
  
  pause(): void {
    if (!this._playing) return;
    this._playing = false;
    if (this.schedulerId !== null) {
      clearTimeout(this.schedulerId);
      this.schedulerId = null;
    }
    this.onPlayStateChange.forEach(cb => cb(false));
  }
  
  stop(): void {
    this.pause();
    this._position = 0;
    this.onPositionChange.forEach(cb => cb(0));
  }
  
  setBpm(bpm: number): void {
    this._bpm = clamp(bpm, 20, 999);
  }
  
  setPosition(beats: number): void {
    this._position = beats;
    this.onPositionChange.forEach(cb => cb(beats));
  }
  
  setLoop(start: number, end: number): void {
    this._loopStart = start;
    this._loopEnd = end;
    this._looping = true;
  }
  
  disableLoop(): void {
    this._looping = false;
  }
  
  subscribe(
    onPosition?: TransportCallback,
    onPlayState?: PlayStateCallback
  ): () => void {
    if (onPosition) {
      this.onPositionChange.push(onPosition);
    }
    if (onPlayState) {
      this.onPlayStateChange.push(onPlayState);
    }
    
    // Return unsubscribe function
    return () => {
      if (onPosition) {
        const idx = this.onPositionChange.indexOf(onPosition);
        if (idx >= 0) this.onPositionChange.splice(idx, 1);
      }
      if (onPlayState) {
        const idx = this.onPlayStateChange.indexOf(onPlayState);
        if (idx >= 0) this.onPlayStateChange.splice(idx, 1);
      }
    };
  }
  
  private schedule(): void {
    const currentTime = this.ctx.currentTime;
    const beatDuration = 60 / this._bpm;
    
    // Schedule events that fall within the lookahead window
    while (this.lastScheduleTime < currentTime + this.scheduleAhead) {
      // Advance position
      this._position += 1;
      this.lastScheduleTime += beatDuration;
      
      // Handle looping
      if (this._looping && this._position >= this._loopEnd) {
        this._position = this._loopStart;
      }
    }
    
    // Update UI position
    this.onPositionChange.forEach(cb => cb(this._position));
    
    // Schedule next tick
    if (this._playing) {
      this.schedulerId = window.setTimeout(
        () => this.schedule(),
        25 // 40 Hz update rate
      );
    }
  }
}
