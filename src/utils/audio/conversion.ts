// Audio conversion utilities
import { clamp } from '../common';

/**
 * Convert MIDI note number to frequency in Hz
 * @param note MIDI note number (0-127, where 60 = C4 = 261.63 Hz)
 * @returns Frequency in Hz
 */
export function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/**
 * Convert frequency to MIDI note number
 * @param freq Frequency in Hz
 * @returns MIDI note number (may be fractional for detuned notes)
 */
export function freqToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440);
}

/**
 * Convert decibels to linear gain
 * @param db Decibels
 * @returns Linear gain (0-1+)
 */
export function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Convert linear gain to decibels
 * @param gain Linear gain
 * @returns Decibels
 */
export function gainToDb(gain: number): number {
  return 20 * Math.log10(Math.max(gain, 0.00001));
}

/**
 * Linear interpolation between two values
 * @param a Start value
 * @param b End value
 * @param t Interpolation factor (0-1)
 * @returns Interpolated value
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Convert beats to seconds based on BPM
 * @param beats Number of beats
 * @param bpm Tempo in beats per minute
 * @returns Duration in seconds
 */
export function beatsToSeconds(beats: number, bpm: number): number {
  return (beats * 60) / bpm;
}

/**
 * Convert seconds to beats based on BPM
 * @param seconds Duration in seconds
 * @param bpm Tempo in beats per minute
 * @returns Number of beats
 */
export function secondsToBeats(seconds: number, bpm: number): number {
  return (seconds * bpm) / 60;
}

// Re-export clamp for convenience
export { clamp };
