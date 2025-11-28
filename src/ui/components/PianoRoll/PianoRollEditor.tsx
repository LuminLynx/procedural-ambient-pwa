import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Pattern } from '../../../core/sequencer/Pattern';
import { Note } from '../../../core/sequencer/Note';
import { Grid } from './Grid';
import { NoteRenderer } from './NoteRenderer';
import { VirtualKeyboard } from './VirtualKeyboard';
import { useMobileDetection } from '../../hooks/useMobileDetection';

interface PianoRollEditorProps {
  pattern: Pattern | null;
  lowestNote?: number;
  highestNote?: number;
  onPatternChange?: (pattern: Pattern) => void;
}

// Touch gesture states
type GestureState = 'idle' | 'tap' | 'drag' | 'longpress';

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  noteId: string | null;
  gesture: GestureState;
}

export const PianoRollEditor: React.FC<PianoRollEditorProps> = ({
  pattern,
  lowestNote = 36, // C2
  highestNote = 96, // C7
  onPatternChange
}) => {
  const { isMobile, isTouchDevice } = useMobileDetection();
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [touchState, setTouchState] = useState<TouchState | null>(null);
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);
  
  // Responsive sizing - increase dimensions on mobile for better touch targets
  const pixelsPerBeat = isMobile ? 50 : 40;
  const noteHeight = isMobile ? 44 : 16; // 44px+ for mobile touch targets
  const beatsPerBar = 4;
  const totalBars = 4;
  const numNotes = highestNote - lowestNote + 1;

  const pianoWidth = isMobile ? 80 : 60; // Wider piano keys on mobile
  const gridWidth = beatsPerBar * totalBars * pixelsPerBeat;
  const gridHeight = numNotes * noteHeight;

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const getNoteInfo = (midiNote: number) => {
    const octave = Math.floor(midiNote / 12) - 1;
    const noteName = noteNames[midiNote % 12];
    return { name: noteName, octave, isWhiteKey: !noteName.includes('#') };
  };

  // Long press threshold in ms
  const LONG_PRESS_DURATION = 500;
  // Minimum movement in px to consider as drag
  const DRAG_THRESHOLD = 10;

  // Clean up long press timer
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Convert touch/mouse position to grid coordinates
  const getGridPosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft;
    const scrollTop = containerRef.current.scrollTop;
    
    const x = clientX - rect.left + scrollLeft;
    const y = clientY - rect.top + scrollTop;
    
    const beat = x / pixelsPerBeat;
    const noteIndex = Math.floor(y / noteHeight);
    const pitch = highestNote - noteIndex;
    
    return { beat, pitch, x, y };
  }, [pixelsPerBeat, noteHeight, highestNote]);

  // Find note at position
  const findNoteAtPosition = useCallback((x: number, y: number): Note | null => {
    if (!pattern) return null;
    
    const gridPos = getGridPosition(x, y);
    if (!gridPos) return null;
    
    for (const note of pattern.notes) {
      const noteLeft = note.time * pixelsPerBeat;
      const noteRight = noteLeft + note.duration * pixelsPerBeat;
      const noteRow = highestNote - note.pitch;
      const noteTop = noteRow * noteHeight;
      const noteBottom = noteTop + noteHeight;
      
      if (x >= noteLeft && x <= noteRight && 
          y >= noteTop && y <= noteBottom) {
        return note;
      }
    }
    
    return null;
  }, [pattern, pixelsPerBeat, noteHeight, highestNote, getGridPosition]);

  // Handle tap gesture - create a new note
  const handleTapCreate = useCallback((x: number, y: number) => {
    if (!pattern || !onPatternChange) return;
    
    const gridPos = getGridPosition(x, y);
    if (!gridPos) return;
    
    // Quantize to beat grid
    const time = Math.floor(gridPos.beat);
    const pitch = gridPos.pitch;
    
    // Check bounds
    if (time < 0 || time >= beatsPerBar * totalBars || 
        pitch < lowestNote || pitch > highestNote) {
      return;
    }
    
    // Create new note
    const newNote = new Note(pitch, time, 1, 0.8);
    const updatedPattern = pattern.clone();
    updatedPattern.addNote(newNote);
    onPatternChange(updatedPattern);
  }, [pattern, onPatternChange, getGridPosition, beatsPerBar, totalBars, lowestNote, highestNote]);

  // Handle long press - delete note
  const handleLongPressDelete = useCallback((noteId: string) => {
    if (!pattern || !onPatternChange) return;
    
    const updatedPattern = pattern.clone();
    updatedPattern.removeNote(noteId);
    onPatternChange(updatedPattern);
    setSelectedNoteId(null);
  }, [pattern, onPatternChange]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = touch.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
    const y = touch.clientY - rect.top + (containerRef.current?.scrollTop || 0);
    
    const note = findNoteAtPosition(x, y);
    
    setTouchState({
      startX: x,
      startY: y,
      startTime: Date.now(),
      noteId: note?.id || null,
      gesture: 'tap'
    });
    
    if (note) {
      setSelectedNoteId(note.id);
      
      // Start long press timer
      longPressTimerRef.current = setTimeout(() => {
        setTouchState(prev => prev ? { ...prev, gesture: 'longpress' } : null);
        handleLongPressDelete(note.id);
      }, LONG_PRESS_DURATION);
    }
  }, [findNoteAtPosition, handleLongPressDelete]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = touch.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
    const y = touch.clientY - rect.top + (containerRef.current?.scrollTop || 0);
    
    const dx = Math.abs(x - touchState.startX);
    const dy = Math.abs(y - touchState.startY);
    
    // Cancel long press if user moves finger
    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      
      setTouchState(prev => prev ? { ...prev, gesture: 'drag' } : null);
      
      // If dragging a note, update its position
      if (touchState.noteId && pattern && onPatternChange) {
        const gridPos = getGridPosition(touch.clientX, touch.clientY);
        if (gridPos) {
          const note = pattern.getNote(touchState.noteId);
          if (note) {
            const newTime = Math.max(0, Math.floor(gridPos.beat));
            const newPitch = Math.max(lowestNote, Math.min(highestNote, gridPos.pitch));
            
            if (note.time !== newTime || note.pitch !== newPitch) {
              const updatedPattern = pattern.clone();
              const updatedNote = updatedPattern.getNote(touchState.noteId);
              if (updatedNote) {
                updatedNote.time = newTime;
                updatedNote.pitch = newPitch;
                onPatternChange(updatedPattern);
              }
            }
          }
        }
      }
    }
  }, [touchState, pattern, onPatternChange, getGridPosition, lowestNote, highestNote]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    if (!touchState) return;
    
    const elapsed = Date.now() - touchState.startTime;
    
    // If it was a quick tap without movement on empty grid, create a note
    if (touchState.gesture === 'tap' && !touchState.noteId && elapsed < 300) {
      handleTapCreate(touchState.startX, touchState.startY);
    }
    
    setTouchState(null);
  }, [touchState, handleTapCreate]);

  // Virtual keyboard note handler
  const handleVirtualKeyboardNote = useCallback((midiNote: number) => {
    if (!pattern || !onPatternChange) return;
    
    // Add a note at the end of existing notes or at position 0
    const lastNoteTime = pattern.notes.length > 0 
      ? Math.max(...pattern.notes.map(n => n.time + n.duration))
      : 0;
    
    const time = lastNoteTime % (beatsPerBar * totalBars);
    const newNote = new Note(midiNote, time, 1, 0.8);
    
    const updatedPattern = pattern.clone();
    updatedPattern.addNote(newNote);
    onPatternChange(updatedPattern);
  }, [pattern, onPatternChange, beatsPerBar, totalBars]);

  return (
    <div 
      className="piano-roll-container"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #333',
        borderRadius: '4px',
        overflow: 'hidden',
        backgroundColor: '#0a0a0a'
      }}
    >
      {/* Header */}
      <div style={{
        height: isMobile ? '44px' : '30px',
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px'
      }}>
        <span style={{
          fontSize: isMobile ? '14px' : '13px',
          fontWeight: '600',
          color: '#fff'
        }}>
          Piano Roll {pattern ? `- ${pattern.name}` : '(No pattern selected)'}
        </span>
        
        {/* Mobile keyboard toggle */}
        {isTouchDevice && (
          <button
            onClick={() => setShowVirtualKeyboard(!showVirtualKeyboard)}
            style={{
              padding: '6px 12px',
              backgroundColor: showVirtualKeyboard ? '#3b82f6' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
              minHeight: '32px'
            }}
          >
            🎹 {showVirtualKeyboard ? 'Hide' : 'Show'} Keyboard
          </button>
        )}
      </div>

      {/* Content - stacks vertically on mobile */}
      <div style={{
        height: isMobile ? 'auto' : 'calc(100% - 30px)',
        minHeight: isMobile ? '300px' : 'auto',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        overflow: 'hidden'
      }}>
        {/* Piano keys */}
        <div style={{
          width: isMobile ? '100%' : `${pianoWidth}px`,
          height: isMobile ? '60px' : gridHeight,
          backgroundColor: '#1a1a1a',
          borderRight: isMobile ? 'none' : '1px solid #333',
          borderBottom: isMobile ? '1px solid #333' : 'none',
          overflow: isMobile ? 'auto' : 'hidden',
          display: isMobile ? 'flex' : 'block',
          flexDirection: isMobile ? 'row' : 'column'
        }}>
          {isMobile ? (
            // Horizontal scrollable piano keys for mobile
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              height: '100%'
            }}>
              {Array.from({ length: numNotes }, (_, i) => {
                const midiNote = lowestNote + i;
                const noteInfo = getNoteInfo(midiNote);
                const isC = noteInfo.name === 'C';
                
                return (
                  <div
                    key={midiNote}
                    style={{
                      minWidth: '44px',
                      height: '100%',
                      borderRight: '1px solid #222',
                      backgroundColor: noteInfo.isWhiteKey ? '#2a2a2a' : '#1a1a1a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      color: isC ? '#fff' : '#666',
                      fontWeight: isC ? '600' : '400'
                    }}
                  >
                    {isC ? `${noteInfo.name}${noteInfo.octave}` : noteInfo.name}
                  </div>
                );
              })}
            </div>
          ) : (
            // Vertical piano keys for desktop
            Array.from({ length: numNotes }, (_, i) => {
              const midiNote = highestNote - i;
              const noteInfo = getNoteInfo(midiNote);
              const isC = noteInfo.name === 'C';
              
              return (
                <div
                  key={midiNote}
                  style={{
                    height: `${noteHeight}px`,
                    borderBottom: '1px solid #222',
                    backgroundColor: noteInfo.isWhiteKey ? '#2a2a2a' : '#1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '4px',
                    fontSize: isMobile ? '12px' : '10px',
                    color: isC ? '#fff' : '#666',
                    fontWeight: isC ? '600' : '400'
                  }}
                >
                  {isC && `${noteInfo.name}${noteInfo.octave}`}
                </div>
              );
            })
          )}
        </div>

        {/* Grid and notes */}
        <div 
          ref={containerRef}
          onTouchStart={isTouchDevice ? handleTouchStart : undefined}
          onTouchMove={isTouchDevice ? handleTouchMove : undefined}
          onTouchEnd={isTouchDevice ? handleTouchEnd : undefined}
          style={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'auto',
            position: 'relative',
            backgroundColor: '#0f0f0f',
            touchAction: 'pan-x pan-y',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div style={{
            width: `${gridWidth}px`,
            height: `${gridHeight}px`,
            position: 'relative'
          }}>
            <Grid
              width={gridWidth}
              height={gridHeight}
              beatsPerBar={beatsPerBar}
              totalBars={totalBars}
              pixelsPerBeat={pixelsPerBeat}
              noteHeight={noteHeight}
              numNotes={numNotes}
            />

            {/* Notes */}
            {pattern?.notes.map((note) => (
              <NoteRenderer
                key={note.id}
                note={note}
                pixelsPerBeat={pixelsPerBeat}
                noteHeight={noteHeight}
                lowestNote={lowestNote}
                highestNote={highestNote}
                onSelect={() => setSelectedNoteId(note.id)}
                selected={selectedNoteId === note.id}
                isMobile={isMobile}
              />
            ))}

            {!pattern && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#666',
                fontSize: isMobile ? '16px' : '14px',
                textAlign: 'center',
                padding: '20px'
              }}>
                {isTouchDevice 
                  ? 'Tap on grid to add notes. Long-press to delete.'
                  : 'Select a pattern to edit notes'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Virtual Keyboard for mobile */}
      {isTouchDevice && showVirtualKeyboard && (
        <VirtualKeyboard
          onNotePlay={handleVirtualKeyboardNote}
          disabled={!pattern}
        />
      )}

      {/* Mobile touch instructions */}
      {isTouchDevice && pattern && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#1a1a1a',
          borderTop: '1px solid #333',
          fontSize: '11px',
          color: '#666',
          textAlign: 'center'
        }}>
          Tap: Add note | Drag: Move note | Long-press: Delete note
        </div>
      )}
    </div>
  );
};
