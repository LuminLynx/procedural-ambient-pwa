// Note representation for sequencer
import { Note as NoteType } from '../../types/sequencer';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export class Note implements NoteType {
  id: string;
  pitch: number;
  time: number;
  duration: number;
  velocity: number;
  
  constructor(
    pitch: number,
    time: number,
    duration: number = 1,
    velocity: number = 0.8
  ) {
    this.id = generateId();
    this.pitch = pitch;
    this.time = time;
    this.duration = duration;
    this.velocity = velocity;
  }
  
  clone(): Note {
    const note = new Note(this.pitch, this.time, this.duration, this.velocity);
    return note;
  }
  
  transpose(semitones: number): void {
    this.pitch += semitones;
  }
}
