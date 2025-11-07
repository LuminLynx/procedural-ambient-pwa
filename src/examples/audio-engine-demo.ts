// Example demonstrating the AudioEngine with tracks and patterns
import { AudioEngine } from '../core/engine';
import { Track, Pattern, Note, Clip } from '../core/sequencer';
import { midiToFreq } from '../utils/audio/conversion';

/**
 * Example showing how to use the complete AudioEngine system.
 * This creates a simple musical sequence with multiple tracks.
 */
export async function createMusicExample() {
  // Create the audio engine
  const engine = new AudioEngine();
  await engine.initialize();
  
  // Create a bass track
  const bassTrack = new Track(engine.ctx, {
    name: 'Bass',
    type: 'instrument',
    color: '#2196F3'
  });
  bassTrack.setVolume(0.7);
  engine.addTrack(bassTrack);
  
  // Create a melody track
  const melodyTrack = new Track(engine.ctx, {
    name: 'Melody',
    type: 'instrument',
    color: '#FF6B6B'
  });
  melodyTrack.setVolume(0.6);
  engine.addTrack(melodyTrack);
  
  // Create bass pattern (simple root note pattern)
  const bassPattern = new Pattern(8, 'Bass Line');
  bassPattern.addNote(new Note(36, 0, 1, 0.9));  // C1
  bassPattern.addNote(new Note(36, 2, 1, 0.7));  // C1
  bassPattern.addNote(new Note(43, 4, 1, 0.8));  // G1
  bassPattern.addNote(new Note(36, 6, 1, 0.7));  // C1
  engine.addPattern(bassPattern);
  
  // Create melody pattern (simple melodic phrase)
  const melodyPattern = new Pattern(16, 'Melody Phrase');
  melodyPattern.addNote(new Note(60, 0, 1.5, 0.8));   // C4
  melodyPattern.addNote(new Note(62, 2, 1, 0.7));     // D4
  melodyPattern.addNote(new Note(64, 3, 1, 0.8));     // E4
  melodyPattern.addNote(new Note(65, 4, 2, 0.9));     // F4
  melodyPattern.addNote(new Note(64, 6, 0.5, 0.6));   // E4
  melodyPattern.addNote(new Note(62, 7, 1, 0.7));     // D4
  melodyPattern.addNote(new Note(60, 8, 4, 0.8));     // C4
  engine.addPattern(melodyPattern);
  
  // Add clips to tracks
  const bassClip1 = new Clip(0, 8, 'Bass Intro', bassPattern.id);
  const bassClip2 = new Clip(8, 8, 'Bass Verse', bassPattern.id);
  bassTrack.addClip(bassClip1);
  bassTrack.addClip(bassClip2);
  
  const melodyClip1 = new Clip(0, 16, 'Melody Main', melodyPattern.id);
  melodyTrack.addClip(melodyClip1);
  
  // Set up transport at 90 BPM
  engine.setBpm(90);
  
  // Subscribe to transport position to trigger note playback
  // (In a real implementation, this would be handled by instrument classes)
  let lastBeat = -1;
  const unsubscribe = engine.transport.subscribe(
    (position) => {
      const currentBeat = Math.floor(position);
      
      // Only trigger on new beats
      if (currentBeat !== lastBeat) {
        lastBeat = currentBeat;
        
        // Find active clips and play their notes
        for (const track of engine.getAllTracks()) {
          const activeClips = track.getClipsAt(position);
          
          for (const clip of activeClips) {
            if (!clip.patternId) continue;
            
            const pattern = engine.getPattern(clip.patternId);
            if (!pattern) continue;
            
            // Get beat position within the clip
            const beatInClip = (currentBeat - clip.position) % pattern.length;
            
            // Get notes at this beat
            const notes = pattern.getNotesInRange(beatInClip, beatInClip + 1);
            
            // Play notes (simplified - just creates a tone)
            for (const note of notes) {
              playTone(
                engine.ctx,
                track.output,
                midiToFreq(note.pitch),
                note.duration * 60 / engine.transport.bpm,
                note.velocity
              );
            }
          }
        }
      }
    }
  );
  
  // Return control interface
  return {
    engine,
    bassTrack,
    melodyTrack,
    play: () => engine.play(),
    pause: () => engine.pause(),
    stop: () => engine.stop(),
    cleanup: () => {
      unsubscribe();
      engine.destroy();
    }
  };
}

/**
 * Simple tone generator for demonstration
 */
function playTone(
  ctx: AudioContext,
  destination: AudioNode,
  frequency: number,
  duration: number,
  velocity: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.value = frequency;
  
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(velocity * 0.3, now + 0.01);
  gain.gain.linearRampToValueAtTime(velocity * 0.2, now + 0.1);
  gain.gain.setValueAtTime(velocity * 0.2, now + duration * 0.8);
  gain.gain.linearRampToValueAtTime(0.001, now + duration);
  
  osc.connect(gain);
  gain.connect(destination);
  
  osc.start(now);
  osc.stop(now + duration);
}
