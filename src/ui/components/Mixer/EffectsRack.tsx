import React from 'react';

interface EffectsRackProps {
  trackId: string;
}

export const EffectsRack: React.FC<EffectsRackProps> = ({ trackId }) => {
  // Placeholder for future effects implementation
  return (
    <div style={{
      padding: '8px',
      backgroundColor: '#0f0f0f',
      borderRadius: '4px',
      margin: '8px 0'
    }}>
      <div style={{
        fontSize: '11px',
        color: '#666',
        textAlign: 'center'
      }}>
        Effects (Coming in Sprint 5-6)
      </div>
    </div>
  );
};
