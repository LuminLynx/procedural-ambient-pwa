import React, { useRef, useEffect } from 'react';
import { Track } from '../../../core/sequencer/Track';
import { TrackHeader } from './TrackHeader';
import { ClipRenderer } from './ClipRenderer';

interface TimelineViewProps {
  tracks: Track[];
  position: number;
  bpm: number;
  onMuteToggle: (trackId: string) => void;
  onSoloToggle: (trackId: string) => void;
  onVolumeChange: (trackId: string, volume: number) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  tracks,
  position,
  bpm,
  onMuteToggle,
  onSoloToggle,
  onVolumeChange
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pixelsPerBeat = 40; // Zoom level
  const trackHeight = 80;
  const rulerHeight = 30;
  const maxBeats = 64; // 16 bars at 4/4

  // Auto-scroll to follow playhead
  useEffect(() => {
    if (scrollContainerRef.current) {
      const playheadPos = position * pixelsPerBeat;
      const container = scrollContainerRef.current;
      const visibleWidth = container.clientWidth;
      const scrollLeft = container.scrollLeft;

      // Scroll if playhead is going out of view
      if (playheadPos > scrollLeft + visibleWidth - 100) {
        container.scrollLeft = playheadPos - visibleWidth / 2;
      } else if (playheadPos < scrollLeft + 100) {
        container.scrollLeft = Math.max(0, playheadPos - 100);
      }
    }
  }, [position, pixelsPerBeat]);

  return (
    <div style={{
      width: '100%',
      height: '400px',
      border: '1px solid #333',
      borderRadius: '4px',
      overflow: 'hidden',
      backgroundColor: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Ruler */}
      <div style={{
        height: `${rulerHeight}px`,
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #333',
        display: 'flex'
      }}>
        <div style={{ width: '200px', borderRight: '1px solid #333' }} />
        <div
          ref={scrollContainerRef}
          style={{
            flex: 1,
            overflowX: 'auto',
            position: 'relative'
          }}
        >
          <div style={{
            width: `${maxBeats * pixelsPerBeat}px`,
            height: '100%',
            position: 'relative'
          }}>
            {/* Beat markers */}
            {Array.from({ length: maxBeats }, (_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${i * pixelsPerBeat}px`,
                  top: 0,
                  width: `${pixelsPerBeat}px`,
                  height: '100%',
                  borderLeft: i % 4 === 0 ? '1px solid #666' : '1px solid #333',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '4px'
                }}
              >
                {i % 4 === 0 && (
                  <span style={{ fontSize: '11px', color: '#888' }}>
                    {Math.floor(i / 4) + 1}
                  </span>
                )}
              </div>
            ))}

            {/* Playhead in ruler */}
            <div style={{
              position: 'absolute',
              left: `${position * pixelsPerBeat}px`,
              top: 0,
              width: '2px',
              height: '100%',
              backgroundColor: '#ef4444',
              pointerEvents: 'none',
              zIndex: 100
            }} />
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div style={{
        flex: 1,
        overflowY: 'auto'
      }}>
        {tracks.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#666'
          }}>
            No tracks yet. Add a track to get started.
          </div>
        ) : (
          tracks.map((track) => (
            <div
              key={track.id}
              style={{
                height: `${trackHeight}px`,
                borderBottom: '1px solid #222',
                display: 'flex'
              }}
            >
              <TrackHeader
                track={track}
                onMuteToggle={() => onMuteToggle(track.id)}
                onSoloToggle={() => onSoloToggle(track.id)}
                onVolumeChange={(vol) => onVolumeChange(track.id, vol)}
              />

              <div style={{
                flex: 1,
                position: 'relative',
                backgroundColor: '#0f0f0f'
              }}>
                {/* Grid lines */}
                <div style={{
                  position: 'absolute',
                  width: `${maxBeats * pixelsPerBeat}px`,
                  height: '100%',
                  pointerEvents: 'none'
                }}>
                  {Array.from({ length: maxBeats }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: `${i * pixelsPerBeat}px`,
                        top: 0,
                        width: '1px',
                        height: '100%',
                        backgroundColor: i % 4 === 0 ? '#333' : '#222'
                      }}
                    />
                  ))}
                </div>

                {/* Clips */}
                {track.clips.map((clip) => (
                  <ClipRenderer
                    key={clip.id}
                    clip={clip}
                    pixelsPerBeat={pixelsPerBeat}
                    trackHeight={trackHeight}
                  />
                ))}

                {/* Playhead */}
                <div style={{
                  position: 'absolute',
                  left: `${position * pixelsPerBeat}px`,
                  top: 0,
                  width: '2px',
                  height: '100%',
                  backgroundColor: '#ef4444',
                  pointerEvents: 'none',
                  zIndex: 10
                }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
