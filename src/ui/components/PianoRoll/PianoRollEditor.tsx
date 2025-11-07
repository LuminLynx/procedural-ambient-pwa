import React from 'react';
import { Pattern } from '../../../core/sequencer/Pattern';
import { Grid } from './Grid';
import { NoteRenderer } from './NoteRenderer';

interface PianoRollEditorProps {
  pattern: Pattern | null;
  lowestNote?: number;
  highestNote?: number;
}

export const PianoRollEditor: React.FC<PianoRollEditorProps> = ({
  pattern,
  lowestNote = 36, // C2
  highestNote = 96 // C7
}) => {
  const pixelsPerBeat = 40;
  const noteHeight = 16;
  const beatsPerBar = 4;
  const totalBars = 4;
  const numNotes = highestNote - lowestNote + 1;

  const pianoWidth = 60;
  const gridWidth = beatsPerBar * totalBars * pixelsPerBeat;
  const gridHeight = numNotes * noteHeight;

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const getNoteInfo = (midiNote: number) => {
    const octave = Math.floor(midiNote / 12) - 1;
    const noteName = noteNames[midiNote % 12];
    return { name: noteName, octave, isWhiteKey: !noteName.includes('#') };
  };

  return (
    <div style={{
      width: '100%',
      height: '300px',
      border: '1px solid #333',
      borderRadius: '4px',
      overflow: 'hidden',
      backgroundColor: '#0a0a0a'
    }}>
      {/* Header */}
      <div style={{
        height: '30px',
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px'
      }}>
        <span style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#fff'
        }}>
          Piano Roll {pattern ? `- ${pattern.name}` : '(No pattern selected)'}
        </span>
      </div>

      {/* Content */}
      <div style={{
        height: 'calc(100% - 30px)',
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Piano keys */}
        <div style={{
          width: `${pianoWidth}px`,
          height: gridHeight,
          backgroundColor: '#1a1a1a',
          borderRight: '1px solid #333',
          overflowY: 'hidden'
        }}>
          {Array.from({ length: numNotes }, (_, i) => {
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
                  fontSize: '10px',
                  color: isC ? '#fff' : '#666',
                  fontWeight: isC ? '600' : '400'
                }}
              >
                {isC && `${noteInfo.name}${noteInfo.octave}`}
              </div>
            );
          })}
        </div>

        {/* Grid and notes */}
        <div style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          position: 'relative',
          backgroundColor: '#0f0f0f'
        }}>
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
              />
            ))}

            {!pattern && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#666',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                Select a pattern to edit notes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
