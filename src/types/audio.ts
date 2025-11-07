// Core audio type definitions

export interface AudioParameter {
  value: number;
  min: number;
  max: number;
  default: number;
}

export interface ADSREnvelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export type TrackType = 'audio' | 'instrument' | 'midi' | 'master';

export interface TrackConfig {
  name?: string;
  type?: TrackType;
  color?: string;
}

export interface AudioEffect {
  id: string;
  name: string;
  bypassed: boolean;
  input: AudioNode;
  output: AudioNode;
}
