import React, { useState, useRef, useEffect } from 'react';

interface SimpleAudioPlayerProps {
  audioBuffer: AudioBuffer | null;
  fileName: string;
}

export const SimpleAudioPlayer: React.FC<SimpleAudioPlayerProps> = ({ audioBuffer, fileName }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  useEffect(() => {
    // Create audio context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContextClass();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.connect(audioContextRef.current.destination);
    gainNodeRef.current.gain.value = volume;

    return () => {
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  useEffect(() => {
    let animationFrame: number;
    
    if (isPlaying && audioContextRef.current) {
      const updateTime = () => {
        const elapsed = audioContextRef.current!.currentTime - startTimeRef.current + pauseTimeRef.current;
        setCurrentTime(elapsed);
        
        if (audioBuffer && elapsed >= audioBuffer.duration) {
          setIsPlaying(false);
          setCurrentTime(0);
          pauseTimeRef.current = 0;
        } else {
          animationFrame = requestAnimationFrame(updateTime);
        }
      };
      animationFrame = requestAnimationFrame(updateTime);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, audioBuffer]);

  const play = () => {
    if (!audioBuffer || !audioContextRef.current || !gainNodeRef.current) return;

    // Stop existing source
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
    }

    // Create new source
    sourceRef.current = audioContextRef.current.createBufferSource();
    sourceRef.current.buffer = audioBuffer;
    sourceRef.current.connect(gainNodeRef.current);

    // Start from pause position
    sourceRef.current.start(0, pauseTimeRef.current);
    startTimeRef.current = audioContextRef.current.currentTime;
    
    sourceRef.current.onended = () => {
      if (pauseTimeRef.current + (audioContextRef.current!.currentTime - startTimeRef.current) >= audioBuffer.duration) {
        setIsPlaying(false);
        setCurrentTime(0);
        pauseTimeRef.current = 0;
      }
    };

    setIsPlaying(true);
  };

  const pause = () => {
    if (sourceRef.current && audioContextRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      pauseTimeRef.current += audioContextRef.current.currentTime - startTimeRef.current;
      setIsPlaying(false);
    }
  };

  const stop = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
    }
    setIsPlaying(false);
    setCurrentTime(0);
    pauseTimeRef.current = 0;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!audioBuffer) return null;

  return (
    <div style={{
      padding: '16px',
      backgroundColor: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      marginTop: '16px'
    }}>
      <div style={{ marginBottom: '12px', fontSize: '14px', color: '#94a3b8' }}>
        Now Playing: <strong style={{ color: '#e5e7eb' }}>{fileName}</strong>
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <button
          onClick={isPlaying ? pause : play}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: isPlaying ? '#ef4444' : '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <button
          onClick={stop}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6b7280',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          ⏹ Stop
        </button>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px',
        color: '#94a3b8'
      }}>
        <span>{formatTime(currentTime)}</span>
        <div style={{
          flex: 1,
          height: '4px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${(currentTime / audioBuffer.duration) * 100}%`,
            backgroundColor: '#a78bfa',
            transition: 'width 0.1s linear'
          }} />
        </div>
        <span>{formatTime(audioBuffer.duration)}</span>
      </div>

      <div style={{
        marginTop: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <label style={{ fontSize: '13px', color: '#94a3b8' }}>
          🔊 Volume:
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ fontSize: '13px', color: '#94a3b8', minWidth: '35px' }}>
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  );
};
