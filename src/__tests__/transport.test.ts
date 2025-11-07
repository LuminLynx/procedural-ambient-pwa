// Basic tests for Transport class
// These are example tests showing the testing approach
// In a real implementation, you would use a testing framework like Jest or Vitest

import { Transport } from '../core/engine/Transport';

/**
 * Mock AudioContext for testing
 */
class MockAudioContext {
  currentTime: number = 0;
  sampleRate: number = 44100;
  
  createGain(): any {
    return {
      gain: { value: 1, setValueAtTime: () => {} },
      connect: () => {},
      disconnect: () => {}
    };
  }
}

/**
 * Test suite for Transport class
 */
export class TransportTests {
  private ctx: any;
  
  constructor() {
    this.ctx = new MockAudioContext();
  }
  
  // Test: Transport should start in stopped state
  testInitialState(): boolean {
    const transport = new Transport(this.ctx, 120);
    
    if (transport.playing !== false) {
      console.error('❌ Transport should start in stopped state');
      return false;
    }
    
    if (transport.position !== 0) {
      console.error('❌ Transport should start at position 0');
      return false;
    }
    
    if (transport.bpm !== 120) {
      console.error('❌ Transport should have BPM of 120');
      return false;
    }
    
    console.log('✅ Initial state test passed');
    return true;
  }
  
  // Test: Play should change playing state
  testPlay(): boolean {
    const transport = new Transport(this.ctx, 120);
    let callbackFired = false;
    
    transport.subscribe(undefined, (playing) => {
      callbackFired = playing;
    });
    
    transport.play();
    
    if (!transport.playing) {
      console.error('❌ Transport should be playing after play()');
      return false;
    }
    
    if (!callbackFired) {
      console.error('❌ Play callback should have fired');
      return false;
    }
    
    console.log('✅ Play test passed');
    return true;
  }
  
  // Test: Pause should stop playback but preserve position
  testPause(): boolean {
    const transport = new Transport(this.ctx, 120);
    
    transport.play();
    // Simulate some time passing
    // (In real test, would need to actually advance time)
    
    transport.pause();
    
    if (transport.playing) {
      console.error('❌ Transport should not be playing after pause()');
      return false;
    }
    
    console.log('✅ Pause test passed');
    return true;
  }
  
  // Test: Stop should reset position
  testStop(): boolean {
    const transport = new Transport(this.ctx, 120);
    
    transport.play();
    transport.setPosition(10);
    transport.stop();
    
    if (transport.playing) {
      console.error('❌ Transport should not be playing after stop()');
      return false;
    }
    
    if (transport.position !== 0) {
      console.error('❌ Transport position should reset to 0 after stop()');
      return false;
    }
    
    console.log('✅ Stop test passed');
    return true;
  }
  
  // Test: BPM should be clamped to valid range
  testBpmClamping(): boolean {
    const transport = new Transport(this.ctx, 120);
    
    transport.setBpm(10); // Too low
    const minBpm = transport.bpm;
    if (minBpm !== 20) {
      console.error(`❌ BPM should be clamped to minimum of 20, got ${minBpm}`);
      return false;
    }
    
    transport.setBpm(1000); // Too high
    const maxBpm = transport.bpm;
    if (maxBpm !== 999) {
      console.error(`❌ BPM should be clamped to maximum of 999, got ${maxBpm}`);
      return false;
    }
    
    transport.setBpm(120); // Valid
    const validBpm = transport.bpm;
    if (validBpm !== 120) {
      console.error(`❌ Valid BPM should be set correctly, got ${validBpm}`);
      return false;
    }
    
    console.log('✅ BPM clamping test passed');
    return true;
  }
  
  // Test: Loop should work correctly
  testLoop(): boolean {
    const transport = new Transport(this.ctx, 120);
    
    transport.setLoop(0, 8);
    
    if (!transport.looping) {
      console.error('❌ Looping should be enabled after setLoop()');
      return false;
    }
    
    if (transport.loopStart !== 0 || transport.loopEnd !== 8) {
      console.error('❌ Loop points should be set correctly');
      return false;
    }
    
    transport.disableLoop();
    
    if (transport.looping) {
      console.error('❌ Looping should be disabled after disableLoop()');
      return false;
    }
    
    console.log('✅ Loop test passed');
    return true;
  }
  
  // Run all tests
  runAll(): boolean {
    console.log('\n=== Running Transport Tests ===\n');
    
    const results = [
      this.testInitialState(),
      this.testPlay(),
      this.testPause(),
      this.testStop(),
      this.testBpmClamping(),
      this.testLoop()
    ];
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`\n=== Results: ${passed}/${total} tests passed ===\n`);
    
    return passed === total;
  }
}

// Example usage:
// const tests = new TransportTests();
// const allPassed = tests.runAll();
