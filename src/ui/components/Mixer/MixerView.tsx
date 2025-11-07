import React from 'react';
import { Track } from '../../../core/sequencer/Track';
import { ChannelStrip } from './ChannelStrip';

interface MixerViewProps {
  tracks: Track[];
  onVolumeChange: (trackId: string, volume: number) => void;
  onPanChange: (trackId: string, pan: number) => void;
  onMuteToggle: (trackId: string) => void;
  onSoloToggle: (trackId: string) => void;
}

export const MixerView: React.FC<MixerViewProps> = ({
  tracks,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle
}) => {
  return (
    <div style={{
      width: '100%',
      height: '300px',
      border: '1px solid #333',
      borderRadius: '4px',
      overflow: 'hidden',
      backgroundColor: '#0a0a0a'
    }}>
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
          Mixer
        </span>
      </div>

      <div style={{
        height: 'calc(100% - 30px)',
        display: 'flex',
        overflowX: 'auto'
      }}>
        {tracks.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666'
          }}>
            No tracks to mix
          </div>
        ) : (
          <>
            {tracks.map((track) => (
              <ChannelStrip
                key={track.id}
                track={track}
                onVolumeChange={(vol) => onVolumeChange(track.id, vol)}
                onPanChange={(pan) => onPanChange(track.id, pan)}
                onMuteToggle={() => onMuteToggle(track.id)}
                onSoloToggle={() => onSoloToggle(track.id)}
              />
            ))}

            {/* Master channel */}
            <div style={{
              width: '80px',
              height: '100%',
              padding: '8px',
              backgroundColor: '#2a1a1a',
              borderLeft: '2px solid #ef4444',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#fff',
                textAlign: 'center',
                marginBottom: '8px'
              }}>
                MASTER
              </div>
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  defaultValue="0.8"
                  disabled
                  style={{
                    flex: 1,
                    writingMode: 'vertical-lr' as any,
                    WebkitAppearance: 'slider-vertical',
                    width: '20px'
                  }}
                />
                <div style={{
                  fontSize: '10px',
                  color: '#888'
                }}>
                  80
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
