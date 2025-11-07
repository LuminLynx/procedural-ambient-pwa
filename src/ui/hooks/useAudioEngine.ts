import { useEffect, useState, useRef, useCallback } from 'react';
import { AudioEngine } from '../../core/engine/AudioEngine';

/**
 * Hook to manage AudioEngine instance and initialization
 */
export function useAudioEngine() {
  const engineRef = useRef<AudioEngine | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Create engine instance
    engineRef.current = new AudioEngine();
    
    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.transport.stop();
        engineRef.current.ctx.close();
      }
    };
  }, []);

  const initialize = useCallback(async () => {
    if (!engineRef.current) return;
    
    try {
      await engineRef.current.initialize();
      setInitialized(true);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to initialize audio engine:', err);
    }
  }, []);

  return {
    engine: engineRef.current,
    initialized,
    error,
    initialize
  };
}
