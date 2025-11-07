// Example demonstrating the new sequencer components
import { Transport } from '../core/engine';
import { Track, Pattern, Note, Clip } from '../core/sequencer';

/**
 * Example usage of the new sequencer architecture.
 * This demonstrates how to create tracks, patterns, and use the transport.
 */
export function createSequencerExample(ctx: AudioContext) {
  // Create transport
  const transport = new Transport(ctx, 120);
  
  // Create a track
  const track = new Track(ctx, {
    name: 'Lead Synth',
    type: 'instrument',
    color: '#FF6B6B'
  });
  
  // Create a pattern with some notes
  const pattern = new Pattern(16, 'Main Melody');
  
  // Add notes to pattern (C major scale)
  const notes = [
    new Note(60, 0, 1, 0.8),   // C
    new Note(62, 1, 1, 0.7),   // D
    new Note(64, 2, 1, 0.8),   // E
    new Note(65, 3, 1, 0.7),   // F
    new Note(67, 4, 2, 0.9),   // G (longer note)
  ];
  
  notes.forEach(note => pattern.addNote(note));
  
  // Create a clip that uses this pattern
  const clip = new Clip(0, 16, 'Intro', pattern.id);
  track.addClip(clip);
  
  // Subscribe to transport changes
  const unsubscribe = transport.subscribe(
    (position) => {
      console.log('Transport position:', position);
      
      // Get clips at current position
      const activeClips = track.getClipsAt(position);
      if (activeClips.length > 0) {
        console.log('Active clips:', activeClips.map(c => c.name));
      }
    },
    (playing) => {
      console.log('Transport playing:', playing);
    }
  );
  
  return {
    transport,
    track,
    pattern,
    cleanup: () => {
      unsubscribe();
      track.destroy();
      transport.stop();
    }
  };
}
