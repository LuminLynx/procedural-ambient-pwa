import { useEffect, useState, useCallback } from 'react';
import { Transport } from '../../core/engine/Transport';

/**
 * Hook to manage transport state and controls
 */
export function useTransport(transport: Transport | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [bpm, setBpmState] = useState(120);

  useEffect(() => {
    if (!transport) return;

    // Subscribe to transport events
    const unsubscribe = transport.subscribe(
      (pos) => setPosition(pos),
      (playing) => setIsPlaying(playing)
    );

    // Sync initial state
    setIsPlaying(transport.playing);
    setPosition(transport.position);
    setBpmState(transport.bpm);

    return unsubscribe;
  }, [transport]);

  const play = useCallback(() => {
    transport?.play();
  }, [transport]);

  const pause = useCallback(() => {
    transport?.pause();
  }, [transport]);

  const stop = useCallback(() => {
    transport?.stop();
  }, [transport]);

  const setBpm = useCallback((newBpm: number) => {
    if (transport) {
      transport.setBpm(newBpm);
      setBpmState(newBpm);
    }
  }, [transport]);

  const setLoop = useCallback((start: number, end: number) => {
    transport?.setLoop(start, end);
  }, [transport]);

  const enableLoop = useCallback((enabled: boolean) => {
    if (!transport) return;
    if (enabled) {
      // Keep existing loop range or set default
      if (transport.loopEnd === 0) {
        transport.setLoop(transport.loopStart, 32);
      }
    } else {
      transport.disableLoop();
    }
  }, [transport]);

  return {
    isPlaying,
    position,
    bpm,
    play,
    pause,
    stop,
    setBpm,
    setLoop,
    enableLoop
  };
}
