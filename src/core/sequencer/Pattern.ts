// Pattern class for sequencer
import { Pattern as PatternType } from '../../types/sequencer';
import { Note } from './Note';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class Pattern implements PatternType {
  id: string;
  name: string;
  length: number; // in beats
  notes: Note[];
  
  constructor(length: number = 16, name?: string) {
    this.id = generateId();
    this.name = name || 'Pattern';
    this.length = length;
    this.notes = [];
  }
  
  addNote(note: Note): void {
    this.notes.push(note);
    this.notes.sort((a, b) => a.time - b.time);
  }
  
  removeNote(noteId: string): void {
    this.notes = this.notes.filter(n => n.id !== noteId);
  }
  
  getNote(noteId: string): Note | undefined {
    return this.notes.find(n => n.id === noteId);
  }
  
  transpose(semitones: number): void {
    this.notes.forEach(note => {
      note.transpose(semitones);
    });
  }
  
  quantize(subdivision: number): void {
    const gridSize = 1 / subdivision; // e.g., 1/16 = 0.0625
    this.notes.forEach(note => {
      note.time = Math.round(note.time / gridSize) * gridSize;
    });
  }
  
  humanize(amount: number): void {
    this.notes.forEach(note => {
      // Randomize timing
      note.time += (Math.random() - 0.5) * amount * 0.05;
      // Randomize velocity
      note.velocity += (Math.random() - 0.5) * amount * 0.2;
      note.velocity = clamp(note.velocity, 0, 1);
    });
  }
  
  getNotesInRange(start: number, end: number): Note[] {
    return this.notes.filter(note => 
      note.time >= start && note.time < end
    );
  }
  
  clone(): Pattern {
    const pattern = new Pattern(this.length, this.name);
    pattern.notes = this.notes.map(note => note.clone());
    return pattern;
  }
  
  clear(): void {
    this.notes = [];
  }
}
