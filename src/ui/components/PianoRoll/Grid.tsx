import React from 'react';

interface GridProps {
  width: number;
  height: number;
  beatsPerBar: number;
  totalBars: number;
  pixelsPerBeat: number;
  noteHeight: number;
  numNotes: number;
}

export const Grid: React.FC<GridProps> = ({
  width,
  height,
  beatsPerBar,
  totalBars,
  pixelsPerBeat,
  noteHeight,
  numNotes
}) => {
  const totalBeats = beatsPerBar * totalBars;

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none'
      }}
    >
      {/* Vertical grid lines (beat divisions) */}
      {Array.from({ length: totalBeats + 1 }, (_, i) => (
        <line
          key={`v-${i}`}
          x1={i * pixelsPerBeat}
          y1={0}
          x2={i * pixelsPerBeat}
          y2={height}
          stroke={i % beatsPerBar === 0 ? '#444' : '#222'}
          strokeWidth={i % beatsPerBar === 0 ? 1.5 : 1}
        />
      ))}

      {/* Horizontal grid lines (note rows) */}
      {Array.from({ length: numNotes + 1 }, (_, i) => (
        <line
          key={`h-${i}`}
          x1={0}
          y1={i * noteHeight}
          x2={width}
          y2={i * noteHeight}
          stroke="#222"
          strokeWidth={1}
        />
      ))}
    </svg>
  );
};
