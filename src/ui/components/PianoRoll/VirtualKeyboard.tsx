import React, { useState, useCallback } from 'react';

interface VirtualKeyboardProps {
  onNotePlay?: (midiNote: number) => void;
  onNoteRelease?: (midiNote: number) => void;
  disabled?: boolean;
}

/**
 * Virtual Keyboard component for mobile touch input
 * Provides octave selection and note buttons for touch devices
 */
export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onNotePlay,
  onNoteRelease,
  disabled = false
}) => {
  const [currentOctave, setCurrentOctave] = useState(4);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const getMidiNote = (noteIndex: number): number => {
    return (currentOctave + 1) * 12 + noteIndex;
  };

  const isBlackKey = (noteName: string): boolean => {
    return noteName.includes('#');
  };

  const handleNoteStart = useCallback((noteIndex: number) => {
    if (disabled) return;
    
    const midiNote = getMidiNote(noteIndex);
    setActiveNotes(prev => new Set(prev).add(midiNote));
    onNotePlay?.(midiNote);
  }, [currentOctave, disabled, onNotePlay]);

  const handleNoteEnd = useCallback((noteIndex: number) => {
    const midiNote = getMidiNote(noteIndex);
    setActiveNotes(prev => {
      const next = new Set(prev);
      next.delete(midiNote);
      return next;
    });
    onNoteRelease?.(midiNote);
  }, [currentOctave, onNoteRelease]);

  const handleTouchStart = (e: React.TouchEvent, noteIndex: number) => {
    e.preventDefault();
    handleNoteStart(noteIndex);
  };

  const handleTouchEnd = (e: React.TouchEvent, noteIndex: number) => {
    e.preventDefault();
    handleNoteEnd(noteIndex);
  };

  const octaveUp = () => {
    if (currentOctave < 7) {
      setCurrentOctave(prev => prev + 1);
    }
  };

  const octaveDown = () => {
    if (currentOctave > 1) {
      setCurrentOctave(prev => prev - 1);
    }
  };

  return (
    <div className="virtual-keyboard" style={{
      width: '100%',
      padding: '12px',
      backgroundColor: '#1a1a1a',
      borderTop: '1px solid #333',
      touchAction: 'none'
    }}>
      {/* Octave Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '12px'
      }}>
        <button
          onClick={octaveDown}
          disabled={currentOctave <= 1 || disabled}
          style={{
            padding: '8px 16px',
            backgroundColor: currentOctave <= 1 ? '#333' : '#4a4a4a',
            color: currentOctave <= 1 ? '#666' : '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: currentOctave <= 1 ? 'default' : 'pointer',
            minWidth: '44px',
            minHeight: '44px'
          }}
        >
          ◀
        </button>
        <span style={{
          color: '#fff',
          fontSize: '16px',
          fontWeight: '600',
          minWidth: '80px',
          textAlign: 'center'
        }}>
          Octave {currentOctave}
        </span>
        <button
          onClick={octaveUp}
          disabled={currentOctave >= 7 || disabled}
          style={{
            padding: '8px 16px',
            backgroundColor: currentOctave >= 7 ? '#333' : '#4a4a4a',
            color: currentOctave >= 7 ? '#666' : '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: currentOctave >= 7 ? 'default' : 'pointer',
            minWidth: '44px',
            minHeight: '44px'
          }}
        >
          ▶
        </button>
      </div>

      {/* Piano Keys */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        height: '120px'
      }}>
        {/* White keys */}
        <div style={{
          display: 'flex',
          gap: '2px'
        }}>
          {noteNames.map((noteName, index) => {
            if (isBlackKey(noteName)) return null;
            
            const midiNote = getMidiNote(index);
            const isActive = activeNotes.has(midiNote);
            
            return (
              <button
                key={noteName}
                onTouchStart={(e) => handleTouchStart(e, index)}
                onTouchEnd={(e) => handleTouchEnd(e, index)}
                onMouseDown={() => handleNoteStart(index)}
                onMouseUp={() => handleNoteEnd(index)}
                onMouseLeave={() => {
                  if (activeNotes.has(midiNote)) {
                    handleNoteEnd(index);
                  }
                }}
                disabled={disabled}
                style={{
                  width: '44px',
                  height: '100%',
                  backgroundColor: isActive ? '#60a5fa' : '#f0f0f0',
                  border: '1px solid #333',
                  borderRadius: '0 0 6px 6px',
                  cursor: disabled ? 'default' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  paddingBottom: '8px',
                  fontSize: '12px',
                  color: isActive ? '#fff' : '#333',
                  fontWeight: '600',
                  transition: 'background-color 0.05s'
                }}
              >
                {noteName}
              </button>
            );
          })}
        </div>

        {/* Black keys overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '2px',
          paddingLeft: '23px'
        }}>
          {noteNames.map((noteName, index) => {
            if (!isBlackKey(noteName)) return null;
            
            const midiNote = getMidiNote(index);
            const isActive = activeNotes.has(midiNote);
            
            // Calculate offset for black keys
            const whiteKeysBefore = noteNames.slice(0, index).filter(n => !isBlackKey(n)).length;
            const leftOffset = whiteKeysBefore * 46 - 11; // 44px width + 2px gap - half black key width
            
            return (
              <button
                key={noteName}
                onTouchStart={(e) => handleTouchStart(e, index)}
                onTouchEnd={(e) => handleTouchEnd(e, index)}
                onMouseDown={() => handleNoteStart(index)}
                onMouseUp={() => handleNoteEnd(index)}
                onMouseLeave={() => {
                  if (activeNotes.has(midiNote)) {
                    handleNoteEnd(index);
                  }
                }}
                disabled={disabled}
                style={{
                  position: 'absolute',
                  left: `${leftOffset}px`,
                  width: '32px',
                  height: '70px',
                  backgroundColor: isActive ? '#3b82f6' : '#222',
                  border: '1px solid #111',
                  borderRadius: '0 0 4px 4px',
                  cursor: disabled ? 'default' : 'pointer',
                  fontSize: '10px',
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  paddingBottom: '6px',
                  zIndex: 1,
                  transition: 'background-color 0.05s'
                }}
              >
                {noteName.replace('#', '♯')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current note range indicator */}
      <div style={{
        textAlign: 'center',
        marginTop: '8px',
        color: '#666',
        fontSize: '12px'
      }}>
        {`C${currentOctave} - B${currentOctave} (MIDI ${getMidiNote(0)} - ${getMidiNote(11)})`}
      </div>
    </div>
  );
};
