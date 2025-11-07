import { useState, useCallback } from 'react';
import { AudioEngine } from '../../core/engine/AudioEngine';
import { Track } from '../../core/sequencer/Track';

/**
 * Hook to manage track operations
 */
export function useTrack(engine: AudioEngine | null) {
  const [tracks, setTracks] = useState<Track[]>([]);

  const addTrack = useCallback((name: string, type: 'audio' | 'midi' = 'audio') => {
    if (!engine) return null;

    const track = new Track(engine.ctx, { name, type });
    engine.addTrack(track);
    track.output.connect(engine.master);
    
    setTracks(prev => [...prev, track]);
    return track;
  }, [engine]);

  const removeTrack = useCallback((trackId: string) => {
    if (!engine) return;

    engine.removeTrack(trackId);
    setTracks(prev => prev.filter(t => t.id !== trackId));
  }, [engine]);

  const updateTrackVolume = useCallback((trackId: string, volume: number) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      track.setVolume(volume);
    }
  }, [tracks]);

  const updateTrackPan = useCallback((trackId: string, pan: number) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      track.setPan(pan);
    }
  }, [tracks]);

  const toggleMute = useCallback((trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      track.setMute(!track.muted);
      setTracks([...tracks]); // Force re-render
    }
  }, [tracks]);

  const toggleSolo = useCallback((trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      track.setSolo(!track.solo);
      setTracks([...tracks]); // Force re-render
    }
  }, [tracks]);

  return {
    tracks,
    addTrack,
    removeTrack,
    updateTrackVolume,
    updateTrackPan,
    toggleMute,
    toggleSolo
  };
}
