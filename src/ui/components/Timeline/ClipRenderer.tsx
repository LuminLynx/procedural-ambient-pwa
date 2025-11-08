import React from 'react';
import { Clip } from '../../../core/sequencer/Clip';

interface ClipRendererProps {
  clip: Clip;
  pixelsPerBeat: number;
  trackHeight: number;
  onSelect?: () => void;
  selected?: boolean;
}

export const ClipRenderer: React.FC<ClipRendererProps> = ({
  clip,
  pixelsPerBeat,
  trackHeight,
  onSelect,
  selected = false
}) => {
  const left = clip.position * pixelsPerBeat;
  const width = clip.duration * pixelsPerBeat;

  return (
    <div
      onClick={onSelect}
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: '4px',
        width: `${width}px`,
        height: `${trackHeight - 8}px`,
        backgroundColor: selected ? '#3b82f6' : '#444',
        border: selected ? '2px solid #60a5fa' : '1px solid #666',
        borderRadius: '4px',
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        transition: 'all 0.1s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = selected ? '#2563eb' : '#555';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = selected ? '#3b82f6' : '#444';
      }}
    >
      <span style={{
        fontSize: '12px',
        color: '#fff',
        fontWeight: '500',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        Clip {clip.id.substring(0, 4)}
      </span>
    </div>
  );
};
