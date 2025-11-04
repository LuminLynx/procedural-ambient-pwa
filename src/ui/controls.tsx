import React, { useState, useEffect } from 'react';

export type ControlsProps = {
  seed: number;
  setSeed: (seed: number) => void;
  enableScenes: boolean;
  setEnableScenes: (enable: boolean) => void;
  sceneDuration: number;
  setSceneDuration: (duration: number) => void;
  tempo: number;
  setTempo: (tempo: number) => void;
  complexity: number;
  setComplexity: (complexity: number) => void;
  space: number;
  setSpace: (space: number) => void;
  visualIntensity: number;
  setVisualIntensity: (intensity: number) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onReset: () => void;
  disabled?: boolean;
};

// Persist and load seed from localStorage
const SEED_STORAGE_KEY = 'procedural_ambient_seed';

export function loadSeedFromStorage(): number {
  const stored = localStorage.getItem(SEED_STORAGE_KEY);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return Math.floor(Math.random() * 1000000);
}

export function saveSeedToStorage(seed: number): void {
  localStorage.setItem(SEED_STORAGE_KEY, seed.toString());
}

export default function Controls({
  seed,
  setSeed,
  enableScenes,
  setEnableScenes,
  sceneDuration,
  setSceneDuration,
  tempo,
  setTempo,
  complexity,
  setComplexity,
  space,
  setSpace,
  visualIntensity,
  setVisualIntensity,
  isRecording,
  onStartRecording,
  onStopRecording,
  onReset,
  disabled = false
}: ControlsProps) {
  const handleSeedChange = (newSeed: number) => {
    setSeed(newSeed);
    saveSeedToStorage(newSeed);
  };

  return (
    <div className="controls-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px',
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      border: '1px solid #333'
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1em' }}>Controls</h3>
      
      {/* Seed */}
      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '0.9em', fontWeight: '500' }}>Seed</span>
        <input
          className="input"
          type="number"
          value={seed}
          onChange={e => handleSeedChange(parseInt(e.target.value) || 0)}
          disabled={disabled}
          style={{ width: '100%' }}
        />
      </label>

      {/* Enable Scenes */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={enableScenes}
          onChange={e => setEnableScenes(e.target.checked)}
          disabled={disabled}
        />
        <span style={{ fontSize: '0.9em' }}>Enable Scenes</span>
      </label>

      {/* Scene Duration */}
      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '0.9em', fontWeight: '500' }}>Scene Duration</span>
        <select
          className="input"
          value={sceneDuration}
          onChange={e => setSceneDuration(parseInt(e.target.value))}
          disabled={disabled || !enableScenes}
          style={{ width: '100%' }}
        >
          <option value={16}>16 bars</option>
          <option value={32}>32 bars</option>
          <option value={64}>64 bars</option>
        </select>
      </label>

      {/* Tempo */}
      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '0.9em', fontWeight: '500' }}>Tempo: {tempo} BPM</span>
        <input
          className="range"
          type="range"
          min={40}
          max={120}
          step={1}
          value={tempo}
          onChange={e => setTempo(parseInt(e.target.value))}
          disabled={disabled}
          style={{ width: '100%' }}
        />
      </label>

      {/* Complexity */}
      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '0.9em', fontWeight: '500' }}>Complexity: {complexity.toFixed(2)}</span>
        <input
          className="range"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={complexity}
          onChange={e => setComplexity(parseFloat(e.target.value))}
          disabled={disabled}
          style={{ width: '100%' }}
        />
      </label>

      {/* Space (Delay) */}
      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '0.9em', fontWeight: '500' }}>Space (Delay): {space.toFixed(2)}</span>
        <input
          className="range"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={space}
          onChange={e => setSpace(parseFloat(e.target.value))}
          disabled={disabled}
          style={{ width: '100%' }}
        />
      </label>

      {/* Visual Intensity */}
      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '0.9em', fontWeight: '500' }}>Visual Intensity: {visualIntensity.toFixed(2)}</span>
        <input
          className="range"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={visualIntensity}
          onChange={e => setVisualIntensity(parseFloat(e.target.value))}
          disabled={disabled}
          style={{ width: '100%' }}
        />
      </label>

      {/* Recording Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #333' }}>
        <span style={{ fontSize: '0.9em', fontWeight: '500' }}>Recording</span>
        {!isRecording ? (
          <button
            className="btn"
            onClick={onStartRecording}
            disabled={disabled}
            style={{ width: '100%' }}
          >
            Start Recording
          </button>
        ) : (
          <button
            className="btn"
            onClick={onStopRecording}
            style={{ width: '100%', backgroundColor: '#dc2626' }}
          >
            Stop Recording
          </button>
        )}
      </div>

      {/* Reset */}
      <button
        className="btn"
        onClick={onReset}
        disabled={disabled}
        style={{ width: '100%', marginTop: '4px' }}
      >
        Reset
      </button>
    </div>
  );
}
