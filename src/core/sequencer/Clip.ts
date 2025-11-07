// Clip representation for timeline
import { Clip as ClipType } from '../../types/sequencer';
import { generateId } from '../../utils/common';

export class Clip implements ClipType {
  id: string;
  name: string;
  position: number;
  duration: number;
  patternId?: string;
  
  constructor(
    position: number,
    duration: number,
    name?: string,
    patternId?: string
  ) {
    this.id = generateId();
    this.name = name || 'Clip';
    this.position = position;
    this.duration = duration;
    this.patternId = patternId;
  }
  
  overlaps(other: Clip): boolean {
    return (
      (this.position < other.position + other.duration) &&
      (this.position + this.duration > other.position)
    );
  }
  
  contains(beat: number): boolean {
    return beat >= this.position && beat < this.position + this.duration;
  }
  
  clone(): Clip {
    return new Clip(this.position, this.duration, this.name, this.patternId);
  }
}
