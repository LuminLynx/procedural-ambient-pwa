// Sequencer type definitions

export interface Note {
  id: string;
  pitch: number; // MIDI note number
  time: number; // in beats
  duration: number; // in beats
  velocity: number; // 0-1
}

export interface Clip {
  id: string;
  name: string;
  position: number; // in beats
  duration: number; // in beats
  patternId?: string;
}

export interface Pattern {
  id: string;
  name: string;
  length: number; // in beats
  notes: Note[];
}

export interface TransportState {
  playing: boolean;
  position: number; // in beats
  bpm: number;
  looping: boolean;
  loopStart: number;
  loopEnd: number;
}
