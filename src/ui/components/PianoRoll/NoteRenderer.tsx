import React, { useCallback } from 'react';
import { Note } from '../../../core/sequencer/Note';

interface NoteRendererProps {
  note: Note;
  pixelsPerBeat: number;
  noteHeight: number;
  lowestNote: number;
  highestNote?: number;
  onSelect?: () => void;
  selected?: boolean;
  isMobile?: boolean;
}

export const NoteRenderer: React.FC<NoteRendererProps> = ({
  note,
  pixelsPerBeat,
  noteHeight,
  lowestNote,
  highestNote = 96,
  onSelect,
  selected = false,
  isMobile = false
}) => {
  const left = note.time * pixelsPerBeat;
  const width = note.duration * pixelsPerBeat;
  // Calculate top position based on highest note
  const noteRow = highestNote - note.pitch;
  const top = noteRow * noteHeight;
  
  // Color intensity based on velocity
  const intensity = Math.floor(note.velocity * 100);

  // Minimum touch target size for mobile
  const minHeight = isMobile ? Math.max(noteHeight - 2, 40) : noteHeight - 2;
  const minWidth = isMobile ? Math.max(width, 40) : Math.max(width, 4);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
  }, [onSelect]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    onSelect?.();
  }, [onSelect]);

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${minWidth}px`,
        height: `${minHeight}px`,
        backgroundColor: selected 
          ? `hsl(220, 90%, ${50 + intensity / 4}%)` 
          : `hsl(160, 70%, ${30 + intensity / 3}%)`,
        border: selected 
          ? '2px solid #60a5fa' 
          : '1px solid rgba(255,255,255,0.2)',
        borderRadius: isMobile ? '4px' : '2px',
        cursor: 'pointer',
        transition: 'all 0.1s ease',
        opacity: 0.7 + note.velocity * 0.3,
        // Enhanced touch handling
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        // Visual feedback for touch
        boxShadow: selected ? '0 2px 8px rgba(96, 165, 250, 0.4)' : 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
        if (!selected) {
          e.currentTarget.style.boxShadow = '0 1px 4px rgba(255,255,255,0.2)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = String(0.7 + note.velocity * 0.3);
        if (!selected) {
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    />
  );
};
