# Core Sequencer Architecture

This directory contains the foundational classes for the multi-track sequencer system outlined in the TECHNICAL-ROADMAP.md.

## Overview

The sequencer architecture consists of several key components:

### Core Components

1. **Transport** (`src/core/engine/Transport.ts`)
   - Controls playback (play, pause, stop)
   - Manages BPM and position
   - Handles looping
   - Event system for position and playback state changes
   - **Note**: Current implementation uses interval-based scheduling. Future enhancement could use time-based calculation for more precise timing.

2. **Track** (`src/core/sequencer/Track.ts`)
   - Represents a single track in the arrangement
   - Manages audio routing (input/output nodes)
   - Controls volume, pan, mute, solo
   - Contains clips

3. **Pattern** (`src/core/sequencer/Pattern.ts`)
   - Container for musical notes
   - Supports quantization (with boundary checking), humanization, transpose
   - Fixed length (in beats)

4. **Note** (`src/core/sequencer/Note.ts`)
   - Represents a single musical note
   - Contains pitch (MIDI note number), time, duration, velocity

5. **Clip** (`src/core/sequencer/Clip.ts`)
   - Represents a region on the timeline
   - References a pattern (optional)
   - Has position and duration

## Type Definitions

Type definitions are located in `src/types/`:

- `audio.ts` - Audio-related types (envelopes, effects, parameters)
- `sequencer.ts` - Sequencer types (notes, patterns, clips, transport state)

## Usage Example

```typescript
import { Transport } from './core/engine';
import { Track, Pattern, Note, Clip } from './core/sequencer';

// Create audio context and transport
const ctx = new AudioContext();
const transport = new Transport(ctx, 120); // 120 BPM

// Create a track
const track = new Track(ctx, {
  name: 'Lead',
  type: 'instrument',
  color: '#FF6B6B'
});

// Create a pattern with notes
const pattern = new Pattern(16, 'Melody');
pattern.addNote(new Note(60, 0, 1, 0.8)); // C4 at beat 0
pattern.addNote(new Note(64, 2, 1, 0.8)); // E4 at beat 2

// Add clip to track
const clip = new Clip(0, 16, 'Intro', pattern.id);
track.addClip(clip);

// Subscribe to transport events
transport.subscribe(
  (position) => console.log('Position:', position),
  (playing) => console.log('Playing:', playing)
);

// Control playback
transport.play();
transport.pause();
transport.stop();
```

## Integration with Existing Code

The new architecture is designed to work alongside the existing `AmbientEngine`. The existing engine will continue to function as-is, while new features can be built using these components.

Future steps include:
- Creating a unified `AudioEngine` that coordinates both systems
- Implementing effects chain system
- Adding synthesizer and sampler instruments
- Building UI components for the sequencer

## Testing

See `src/examples/sequencer-demo.ts` for a working example of how to use these components.

## Next Steps (from TECHNICAL-ROADMAP.md)

Sprint 1-2 (Current):
- [x] Create Track and Pattern classes
- [x] Implement Transport and Scheduler
- [x] Type definitions
- [ ] Build basic multi-track UI (future)

Sprint 3-4:
- [ ] Piano roll editor
- [ ] Timeline view with clips
- [ ] Mixer view

See TECHNICAL-ROADMAP.md for the complete implementation plan.
