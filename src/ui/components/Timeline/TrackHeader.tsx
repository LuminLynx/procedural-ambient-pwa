import React from 'react';
import { Track } from '../../../core/sequencer/Track';

interface TrackHeaderProps {
  track: Track;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  onVolumeChange: (volume: number) => void;
}

export const TrackHeader: React.FC<TrackHeaderProps> = ({
  track,
  onMuteToggle,
  onSoloToggle,
  onVolumeChange
}) => {
  return (
    <div style={{
      width: '200px',
      padding: '8px',
      borderRight: '1px solid #333',
      backgroundColor: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{
          fontSize: '14px',
          fontWeight: '500',
          color: '#fff',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {track.name}
        </span>
        <div style={{
          width: '16px',
          height: '16px',
          borderRadius: '2px',
          backgroundColor: track.color
        }} />
      </div>

      <div style={{
        display: 'flex',
        gap: '4px'
      }}>
        <button
          onClick={onMuteToggle}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: '600',
            border: '1px solid #444',
            borderRadius: '3px',
            backgroundColor: track.muted ? '#dc2626' : '#333',
            color: track.muted ? '#fff' : '#999',
            cursor: 'pointer'
          }}
        >
          M
        </button>
        <button
          onClick={onSoloToggle}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: '600',
            border: '1px solid #444',
            borderRadius: '3px',
            backgroundColor: track.solo ? '#eab308' : '#333',
            color: track.solo ? '#000' : '#999',
            cursor: 'pointer'
          }}
        >
          S
        </button>
      </div>

      <div>
        <label style={{
          fontSize: '11px',
          color: '#888',
          display: 'block',
          marginBottom: '4px'
        }}>
          Volume
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={track.volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{
          fontSize: '11px',
          color: '#666',
          textAlign: 'right'
        }}>
          {Math.round(track.volume * 100)}%
        </div>
      </div>
    </div>
  );
};
