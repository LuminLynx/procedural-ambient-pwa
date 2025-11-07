// Integration example showing new and old systems working together
import { AudioEngine } from '../core/engine';
import { AmbientEngine } from '../audio/engine';
import { Track } from '../core/sequencer';

/**
 * This example demonstrates how the new AudioEngine architecture
 * can coexist with the existing AmbientEngine.
 * 
 * This allows for gradual migration and testing of new features
 * without disrupting existing functionality.
 */
export class IntegratedMusicSystem {
  private newEngine: AudioEngine;
  private ambientEngine: AmbientEngine;
  private bridgeTrack: Track | null = null;
  
  constructor() {
    // Create new engine
    this.newEngine = new AudioEngine();
    
    // Create ambient engine with default settings
    this.ambientEngine = new AmbientEngine({
      scale: 'majorPent',
      rootHz: 220,
      bpm: 72,
      complexity: 0.35,
      mix: 0.4,
      drumLevel: 0.5,
      enableScenes: true,
      enableHarmonicLoop: true,
      sceneDurationBars: 32
    });
  }
  
  async initialize(): Promise<void> {
    await this.newEngine.initialize();
    
    // Create a bridge track in the new system that represents the ambient engine
    this.bridgeTrack = new Track(this.newEngine.ctx, {
      name: 'Ambient Engine',
      type: 'audio',
      color: '#9C27B0'
    });
    
    // Connect ambient engine to the bridge track
    this.ambientEngine.getMasterNode().connect(this.bridgeTrack.input);
    
    // Add bridge track to new engine
    this.newEngine.addTrack(this.bridgeTrack);
    
    // Sync transport BPM
    this.newEngine.setBpm(this.ambientEngine.params.bpm);
  }
  
  async startAmbient(): Promise<void> {
    await this.ambientEngine.start();
  }
  
  stopAmbient(): void {
    this.ambientEngine.stop();
  }
  
  async playNew(): Promise<void> {
    await this.newEngine.play();
  }
  
  pauseNew(): void {
    this.newEngine.pause();
  }
  
  stopNew(): void {
    this.newEngine.stop();
  }
  
  // Allow adding new tracks alongside the ambient engine
  addNewTrack(track: Track): void {
    this.newEngine.addTrack(track);
  }
  
  // Sync settings between systems
  setBpm(bpm: number): void {
    this.newEngine.setBpm(bpm);
    this.ambientEngine.setBpm(bpm);
  }
  
  setComplexity(complexity: number): void {
    this.ambientEngine.setComplexity(complexity);
  }
  
  setMix(mix: number): void {
    this.ambientEngine.setMix(mix);
  }
  
  // Get state for debugging
  getState() {
    return {
      newEngine: this.newEngine.getState(),
      ambientEngine: {
        running: this.ambientEngine.running,
        bpm: this.ambientEngine.params.bpm,
        complexity: this.ambientEngine.params.complexity,
        mix: this.ambientEngine.params.mix,
        scene: this.ambientEngine.getCurrentSceneName()
      }
    };
  }
  
  cleanup(): void {
    this.stopAmbient();
    this.stopNew();
    this.newEngine.destroy();
  }
}

/**
 * Example usage:
 * 
 * const system = new IntegratedMusicSystem();
 * await system.initialize();
 * 
 * // Start the ambient engine
 * await system.startAmbient();
 * 
 * // Add new tracks to the system
 * const newTrack = new Track(system.newEngine.ctx, { name: 'Lead' });
 * system.addNewTrack(newTrack);
 * 
 * // Control both systems
 * system.setBpm(90);
 * system.setComplexity(0.5);
 */
