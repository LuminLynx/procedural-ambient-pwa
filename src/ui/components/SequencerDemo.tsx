import React, { useState } from 'react';
import { useAudioEngine, useTransport, useTrack, useKeyboardShortcuts } from '../hooks';
import { TimelineView, MixerView, PianoRollEditor } from '../components';
import { Pattern } from '../../core/sequencer/Pattern';
import { Note } from '../../core/sequencer/Note';
import { Clip } from '../../core/sequencer/Clip';

/**
 * Demo component showcasing Sprint 3-4 UI components
 * Integrates Timeline, Mixer, Piano Roll, and keyboard shortcuts
 */
export const SequencerDemo: React.FC = () => {
  const { engine, initialized, initialize } = useAudioEngine();
  const transport = engine?.transport || null;
  const { isPlaying, position, bpm, play, pause, stop, setBpm } = useTransport(transport);
  const {
    tracks,
    addTrack,
    updateTrackVolume,
    updateTrackPan,
    toggleMute,
    toggleSolo
  } = useTrack(engine);

  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [view, setView] = useState<'timeline' | 'mixer' | 'pianoroll'>('timeline');

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onPlayPause: () => {
      if (isPlaying) pause();
      else play();
    },
    onStop: () => stop()
  });

  // Initialize audio engine on first interaction
  const handleInit = async () => {
    if (!initialized) {
      await initialize();
    }
  };

  // Create demo track with pattern
  const handleAddDemoTrack = async () => {
    await handleInit();
    
    if (!engine) return;

    // Create a new track
    const track = addTrack('Demo Track', 'midi');
    if (!track) return;

    // Create a pattern with some notes
    const pattern = new Pattern(16); // 4 bars
    pattern.name = 'Demo Pattern';

    // Add some notes (C major scale melody)
    const notes = [
      { pitch: 60, time: 0, duration: 1, velocity: 0.8 },   // C
      { pitch: 62, time: 1, duration: 1, velocity: 0.7 },   // D
      { pitch: 64, time: 2, duration: 1, velocity: 0.75 },  // E
      { pitch: 65, time: 3, duration: 1, velocity: 0.8 },   // F
      { pitch: 67, time: 4, duration: 2, velocity: 0.9 },   // G
      { pitch: 69, time: 6, duration: 1, velocity: 0.7 },   // A
      { pitch: 71, time: 7, duration: 1, velocity: 0.75 },  // B
      { pitch: 72, time: 8, duration: 4, velocity: 1.0 },   // C
    ];

    notes.forEach(n => {
      const note = new Note(n.pitch, n.time, n.duration, n.velocity);
      pattern.addNote(note);
    });

    // Add pattern to engine
    engine.addPattern(pattern);

    // Create a clip and add to track
    const clip = new Clip(0, 16); // Start at beat 0, 4 bars long
    clip.patternId = pattern.id;
    track.addClip(clip);

    setSelectedPattern(pattern);
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#fff' }}>
          🎹 Sequencer UI Demo (Sprint 3-4)
        </h2>
        <p style={{ margin: '0 0 16px 0', color: '#888', fontSize: '14px' }}>
          This demo showcases the new Timeline, Mixer, and Piano Roll components built in Sprint 3-4.
          Use keyboard shortcuts: <strong>Space</strong> to play/pause, <strong>Escape</strong> to stop.
        </p>

        {/* Transport Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {!initialized && (
            <button
              onClick={handleInit}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Initialize Audio
            </button>
          )}

          {initialized && (
            <>
              <button
                onClick={isPlaying ? pause : play}
                style={{
                  padding: '10px 20px',
                  backgroundColor: isPlaying ? '#ef4444' : '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>

              <button
                onClick={stop}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                ⏹ Stop
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 12px'
              }}>
                <label style={{ color: '#888', fontSize: '14px' }}>BPM:</label>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  min="20"
                  max="999"
                  style={{
                    width: '70px',
                    padding: '6px',
                    backgroundColor: '#2a2a2a',
                    color: '#fff',
                    border: '1px solid #444',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{
                padding: '8px 12px',
                backgroundColor: '#2a2a2a',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '14px'
              }}>
                Position: {position.toFixed(1)}
              </div>

              <button
                onClick={handleAddDemoTrack}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#8b5cf6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                + Add Demo Track
              </button>
            </>
          )}
        </div>
      </div>

      {/* View Tabs */}
      {initialized && (
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '16px',
          borderBottom: '1px solid #333'
        }}>
          {(['timeline', 'mixer', 'pianoroll'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '10px 20px',
                backgroundColor: view === v ? '#1a1a1a' : 'transparent',
                color: view === v ? '#fff' : '#888',
                border: 'none',
                borderBottom: view === v ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                textTransform: 'capitalize'
              }}
            >
              {v === 'pianoroll' ? 'Piano Roll' : v}
            </button>
          ))}
        </div>
      )}

      {/* Views */}
      {initialized && (
        <div style={{ marginTop: '16px' }}>
          {view === 'timeline' && (
            <TimelineView
              tracks={tracks}
              position={position}
              bpm={bpm}
              onMuteToggle={toggleMute}
              onSoloToggle={toggleSolo}
              onVolumeChange={updateTrackVolume}
            />
          )}

          {view === 'mixer' && (
            <MixerView
              tracks={tracks}
              onVolumeChange={updateTrackVolume}
              onPanChange={updateTrackPan}
              onMuteToggle={toggleMute}
              onSoloToggle={toggleSolo}
            />
          )}

          {view === 'pianoroll' && (
            <PianoRollEditor
              pattern={selectedPattern}
              lowestNote={48}
              highestNote={84}
            />
          )}
        </div>
      )}

      {!initialized && (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: '#666',
          border: '2px dashed #333',
          borderRadius: '8px'
        }}>
          <p style={{ fontSize: '18px', margin: '0 0 8px 0' }}>
            Click "Initialize Audio" to start
          </p>
          <p style={{ fontSize: '14px', margin: 0 }}>
            The audio engine needs user interaction to start due to browser policies
          </p>
        </div>
      )}
    </div>
  );
};
