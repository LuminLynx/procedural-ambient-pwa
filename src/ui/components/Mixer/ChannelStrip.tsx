import React from 'react';
import { Track } from '../../../core/sequencer/Track';

interface ChannelStripProps {
  track: Track;
  onVolumeChange: (volume: number) => void;
  onPanChange: (pan: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
}

export const ChannelStrip: React.FC<ChannelStripProps> = ({
  track,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle
}) => {
  return (
    <div style={{
      width: '80px',
      height: '100%',
      padding: '8px',
      backgroundColor: '#1a1a1a',
      borderRight: '1px solid #333',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {/* Track name */}
      <div style={{
        fontSize: '11px',
        fontWeight: '500',
        color: '#fff',
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        marginBottom: '8px'
      }}>
        {track.name}
      </div>

      {/* Fader */}
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
          value={track.volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
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
          {Math.round(track.volume * 100)}
        </div>
      </div>

      {/* Pan */}
      <div>
        <label style={{
          fontSize: '9px',
          color: '#888',
          display: 'block',
          textAlign: 'center',
          marginBottom: '4px'
        }}>
          PAN
        </label>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={track.pan}
          onChange={(e) => onPanChange(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{
          fontSize: '9px',
          color: '#666',
          textAlign: 'center'
        }}>
          {track.pan === 0 ? 'C' : track.pan > 0 ? `R${Math.round(track.pan * 100)}` : `L${Math.round(Math.abs(track.pan) * 100)}`}
        </div>
      </div>

      {/* Mute/Solo */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <button
          onClick={onMuteToggle}
          style={{
            padding: '6px',
            fontSize: '10px',
            fontWeight: '700',
            border: '1px solid #444',
            borderRadius: '3px',
            backgroundColor: track.muted ? '#dc2626' : '#333',
            color: track.muted ? '#fff' : '#999',
            cursor: 'pointer',
            transition: 'all 0.1s'
          }}
        >
          M
        </button>
        <button
          onClick={onSoloToggle}
          style={{
            padding: '6px',
            fontSize: '10px',
            fontWeight: '700',
            border: '1px solid #444',
            borderRadius: '3px',
            backgroundColor: track.solo ? '#eab308' : '#333',
            color: track.solo ? '#000' : '#999',
            cursor: 'pointer',
            transition: 'all 0.1s'
          }}
        >
          S
        </button>
      </div>

      {/* Color indicator */}
      <div style={{
        width: '100%',
        height: '4px',
        borderRadius: '2px',
        backgroundColor: track.color
      }} />
    </div>
  );
};
