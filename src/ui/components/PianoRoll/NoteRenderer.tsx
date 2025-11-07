import React from 'react';
import { Note } from '../../../core/sequencer/Note';

interface NoteRendererProps {
  note: Note;
  pixelsPerBeat: number;
  noteHeight: number;
  lowestNote: number;
  onSelect?: () => void;
  selected?: boolean;
}

export const NoteRenderer: React.FC<NoteRendererProps> = ({
  note,
  pixelsPerBeat,
  noteHeight,
  lowestNote,
  onSelect,
  selected = false
}) => {
  const left = note.time * pixelsPerBeat;
  const width = note.duration * pixelsPerBeat;
  const top = (127 - note.pitch - (127 - lowestNote)) * noteHeight;
  
  // Color intensity based on velocity
  const intensity = Math.floor(note.velocity * 100);

  return (
    <div
      onClick={onSelect}
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${Math.max(width, 4)}px`,
        height: `${noteHeight - 2}px`,
        backgroundColor: selected ? `hsl(220, 90%, ${50 + intensity / 4}%)` : `hsl(160, 70%, ${30 + intensity / 3}%)`,
        border: selected ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.2)',
        borderRadius: '2px',
        cursor: 'pointer',
        transition: 'all 0.1s ease',
        opacity: 0.7 + note.velocity * 0.3
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = String(0.7 + note.velocity * 0.3);
      }}
    />
  );
};
