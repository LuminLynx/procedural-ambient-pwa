// Test runner for all core component tests
import { TransportTests } from './transport.test';
import { PatternTests } from './pattern.test';

/**
 * Main test runner
 * Executes all test suites and reports results
 */
export function runAllTests(): boolean {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  Core Component Test Suite             ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  const suites = [
    { name: 'Transport', runner: new TransportTests() },
    { name: 'Pattern', runner: new PatternTests() }
  ];
  
  const results: Array<{ name: string; passed: boolean }> = [];
  
  for (const suite of suites) {
    const passed = suite.runner.runAll();
    results.push({ name: suite.name, passed });
  }
  
  // Print summary
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  Test Summary                          ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status} - ${result.name} Tests`);
  }
  
  const allPassed = results.every(r => r.passed);
  const totalPassed = results.filter(r => r.passed).length;
  const totalSuites = results.length;
  
  console.log(`\n  Overall: ${totalPassed}/${totalSuites} test suites passed\n`);
  
  if (allPassed) {
    console.log('  🎉 All tests passed!\n');
  } else {
    console.log('  ⚠️  Some tests failed. Please review.\n');
  }
  
  return allPassed;
}

// Run tests if executed directly
if (typeof window !== 'undefined') {
  // Browser environment - expose to window
  (window as any).runCoreTests = runAllTests;
  console.log('Tests loaded. Run window.runCoreTests() to execute.');
}
