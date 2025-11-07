// Basic tests for Pattern and Note classes
import { Pattern } from '../core/sequencer/Pattern';
import { Note } from '../core/sequencer/Note';

/**
 * Test suite for Pattern and Note classes
 */
export class PatternTests {
  
  // Test: Pattern should be created with correct defaults
  testPatternCreation(): boolean {
    const pattern = new Pattern(16, 'Test Pattern');
    
    if (pattern.length !== 16) {
      console.error('❌ Pattern length should be 16');
      return false;
    }
    
    if (pattern.name !== 'Test Pattern') {
      console.error('❌ Pattern name should be "Test Pattern"');
      return false;
    }
    
    if (pattern.notes.length !== 0) {
      console.error('❌ Pattern should start with no notes');
      return false;
    }
    
    console.log('✅ Pattern creation test passed');
    return true;
  }
  
  // Test: Notes should be added and sorted by time
  testAddNote(): boolean {
    const pattern = new Pattern(16);
    
    const note1 = new Note(60, 4, 1, 0.8);
    const note2 = new Note(62, 2, 1, 0.8);
    const note3 = new Note(64, 6, 1, 0.8);
    
    pattern.addNote(note1);
    pattern.addNote(note2);
    pattern.addNote(note3);
    
    if (pattern.notes.length !== 3) {
      console.error('❌ Pattern should have 3 notes');
      return false;
    }
    
    // Check if sorted by time
    if (pattern.notes[0].time !== 2 || 
        pattern.notes[1].time !== 4 || 
        pattern.notes[2].time !== 6) {
      console.error('❌ Notes should be sorted by time');
      return false;
    }
    
    console.log('✅ Add note test passed');
    return true;
  }
  
  // Test: Remove note should work correctly
  testRemoveNote(): boolean {
    const pattern = new Pattern(16);
    
    const note1 = new Note(60, 0, 1, 0.8);
    const note2 = new Note(62, 2, 1, 0.8);
    
    pattern.addNote(note1);
    pattern.addNote(note2);
    
    pattern.removeNote(note1.id);
    
    if (pattern.notes.length !== 1) {
      console.error('❌ Pattern should have 1 note after removal');
      return false;
    }
    
    if (pattern.notes[0].id !== note2.id) {
      console.error('❌ Remaining note should be note2');
      return false;
    }
    
    console.log('✅ Remove note test passed');
    return true;
  }
  
  // Test: Transpose should shift all notes
  testTranspose(): boolean {
    const pattern = new Pattern(16);
    
    pattern.addNote(new Note(60, 0, 1, 0.8)); // C4
    pattern.addNote(new Note(64, 2, 1, 0.8)); // E4
    pattern.addNote(new Note(67, 4, 1, 0.8)); // G4
    
    pattern.transpose(2); // Transpose up 2 semitones
    
    if (pattern.notes[0].pitch !== 62 || 
        pattern.notes[1].pitch !== 66 || 
        pattern.notes[2].pitch !== 69) {
      console.error('❌ Notes should be transposed correctly');
      return false;
    }
    
    console.log('✅ Transpose test passed');
    return true;
  }
  
  // Test: Quantize should snap notes to grid
  testQuantize(): boolean {
    const pattern = new Pattern(16);
    
    pattern.addNote(new Note(60, 0.3, 1, 0.8));  // Should snap to 0.25
    pattern.addNote(new Note(62, 1.7, 1, 0.8));  // Should snap to 1.75
    pattern.addNote(new Note(64, 2.1, 1, 0.8));  // Should snap to 2
    
    pattern.quantize(16); // Quantize to 16th notes (1/16 = 0.0625)
    
    const tolerance = 0.001;
    
    if (Math.abs(pattern.notes[0].time - 0.3125) > tolerance) {
      console.error(`❌ First note should be quantized to ~0.3125, got ${pattern.notes[0].time}`);
      return false;
    }
    
    if (Math.abs(pattern.notes[1].time - 1.6875) > tolerance) {
      console.error(`❌ Second note should be quantized to ~1.6875, got ${pattern.notes[1].time}`);
      return false;
    }
    
    if (Math.abs(pattern.notes[2].time - 2.125) > tolerance) {
      console.error(`❌ Third note should be quantized to ~2.125, got ${pattern.notes[2].time}`);
      return false;
    }
    
    console.log('✅ Quantize test passed');
    return true;
  }
  
  // Test: Get notes in range
  testGetNotesInRange(): boolean {
    const pattern = new Pattern(16);
    
    pattern.addNote(new Note(60, 0, 1, 0.8));
    pattern.addNote(new Note(62, 2, 1, 0.8));
    pattern.addNote(new Note(64, 4, 1, 0.8));
    pattern.addNote(new Note(65, 6, 1, 0.8));
    
    const notes = pattern.getNotesInRange(2, 5);
    
    if (notes.length !== 2) {
      console.error('❌ Should find 2 notes in range [2, 5)');
      return false;
    }
    
    if (notes[0].time !== 2 || notes[1].time !== 4) {
      console.error('❌ Should find notes at time 2 and 4');
      return false;
    }
    
    console.log('✅ Get notes in range test passed');
    return true;
  }
  
  // Test: Pattern clone
  testClone(): boolean {
    const pattern = new Pattern(16, 'Original');
    pattern.addNote(new Note(60, 0, 1, 0.8));
    pattern.addNote(new Note(62, 2, 1, 0.8));
    
    const clone = pattern.clone();
    
    if (clone.id === pattern.id) {
      console.error('❌ Clone should have different ID');
      return false;
    }
    
    if (clone.length !== pattern.length) {
      console.error('❌ Clone should have same length');
      return false;
    }
    
    if (clone.notes.length !== pattern.notes.length) {
      console.error('❌ Clone should have same number of notes');
      return false;
    }
    
    // Modify clone and verify original is unchanged
    clone.transpose(5);
    
    if (pattern.notes[0].pitch !== 60) {
      console.error('❌ Original pattern should be unchanged after modifying clone');
      return false;
    }
    
    console.log('✅ Pattern clone test passed');
    return true;
  }
  
  // Run all tests
  runAll(): boolean {
    console.log('\n=== Running Pattern Tests ===\n');
    
    const results = [
      this.testPatternCreation(),
      this.testAddNote(),
      this.testRemoveNote(),
      this.testTranspose(),
      this.testQuantize(),
      this.testGetNotesInRange(),
      this.testClone()
    ];
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`\n=== Results: ${passed}/${total} tests passed ===\n`);
    
    return passed === total;
  }
}

// Example usage:
// const tests = new PatternTests();
// const allPassed = tests.runAll();
