import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestModeDetector, ModeValidator, TestMode, TestContext } from '../index';

describe('Testing Infrastructure Integration', () => {
  let detector: TestModeDetector;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    detector = new TestModeDetector();
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should provide complete workflow from detection to validation', () => {
    // Set up environment for production testing
    process.env.TEST_MODE = 'production';
    
    // Create test context
    const testContext: TestContext = {
      testName: 'API Integration Test',
      tags: ['@api', '@integration', '@production'],
      scenario: { name: 'Test API endpoints' },
      feature: { name: 'HWPC API' }
    };

    // Detect mode
    const modeResult = detector.detectMode(testContext);
    expect(modeResult.mode).toBe(TestMode.PRODUCTION);
    expect(modeResult.source).toBe('environment');

    // Create test definition
    const testDefinition = detector.createTestDefinition(
      testContext.testName,
      testContext.tags,
      ['3.1', '3.2', '3.4']
    );

    // Validate compatibility
    const isCompatible = detector.validateModeCompatibility(modeResult.mode, testDefinition);
    expect(isCompatible).toBe(true);

    // Validate mode with environment checks
    const validation = ModeValidator.validateMode(modeResult.mode, testDefinition, true);
    expect(validation.isValid).toBe(true);

    // Test fallback scenario
    const fallback = ModeValidator.getFallbackMode(
      TestMode.DUAL, 
      testDefinition, 
      'Testing fallback mechanism'
    );
    expect(fallback.mode).toBe(TestMode.PRODUCTION);
    expect(fallback.confidence).toBeGreaterThan(0);
  });

  it('should handle isolated mode workflow', () => {
    // Clear environment and use tag-based detection
    delete process.env.TEST_MODE;
    delete process.env.NODE_ENV;
    
    const testContext: TestContext = {
      testName: 'Navigation Test',
      tags: ['@isolated', '@navigation', '@ui'],
      scenario: { name: 'Test page navigation' },
      feature: { name: 'HWPC Navigation' }
    };

    // Detect mode from tags
    const modeResult = detector.detectMode(testContext);
    expect(modeResult.mode).toBe(TestMode.ISOLATED);
    expect(modeResult.source).toBe('tags');

    // Create and validate test definition
    const testDefinition = detector.createTestDefinition(
      testContext.testName,
      testContext.tags,
      ['1.1', '1.2', '1.3']
    );

    const validation = ModeValidator.validateMode(modeResult.mode, testDefinition, false);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should handle dual mode with fallback scenarios', () => {
    delete process.env.TEST_MODE;
    delete process.env.NODE_ENV;
    
    const testContext: TestContext = {
      testName: 'Comprehensive Test',
      tags: ['@dual', '@comprehensive'],
      scenario: { name: 'Test all functionality' },
      feature: { name: 'HWPC Complete' }
    };

    const modeResult = detector.detectMode(testContext);
    expect(modeResult.mode).toBe(TestMode.DUAL);

    const testDefinition = detector.createTestDefinition(
      testContext.testName,
      testContext.tags
    );

    // Dual mode should be compatible with any requested mode
    expect(detector.validateModeCompatibility(TestMode.ISOLATED, testDefinition)).toBe(true);
    expect(detector.validateModeCompatibility(TestMode.PRODUCTION, testDefinition)).toBe(true);
    expect(detector.validateModeCompatibility(TestMode.DUAL, testDefinition)).toBe(true);
  });

  it('should provide meaningful error messages and fallbacks', () => {
    const testDefinition = detector.createTestDefinition(
      'Production Only Test',
      ['@production'],
      ['2.1', '2.2']
    );

    // Try to run isolated mode on production-only test
    const validation = ModeValidator.validateMode(TestMode.ISOLATED, testDefinition, false);
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors[0]).toContain('does not support isolated mode');
    expect(validation.recommendedFallback).toBe(TestMode.PRODUCTION);

    // Test the fallback mechanism
    const fallback = ModeValidator.getFallbackMode(
      TestMode.ISOLATED,
      testDefinition,
      'Mode incompatibility detected'
    );
    
    expect(fallback.mode).toBe(TestMode.PRODUCTION);
    expect(fallback.reason).toContain('Falling back to production mode');
  });
});