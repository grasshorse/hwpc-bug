import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ModeValidator } from '../ModeValidator';
import { TestMode, TestDefinition } from '../types';

describe('ModeValidator', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateMode', () => {
    it('should validate compatible mode and test', () => {
      const test: TestDefinition = {
        name: 'isolated test',
        tags: ['@isolated'],
        requirements: [],
        supportedModes: [TestMode.ISOLATED]
      };

      const result = ModeValidator.validateMode(TestMode.ISOLATED, test, false);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.recommendedFallback).toBeNull();
    });

    it('should detect incompatible mode and test', () => {
      const test: TestDefinition = {
        name: 'production only test',
        tags: ['@production'],
        requirements: [],
        supportedModes: [TestMode.PRODUCTION]
      };

      const result = ModeValidator.validateMode(TestMode.ISOLATED, test, false);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Test "production only test" does not support isolated mode');
      expect(result.recommendedFallback).toBe(TestMode.PRODUCTION);
    });

    it('should validate dual mode tests with any mode', () => {
      const test: TestDefinition = {
        name: 'dual test',
        tags: ['@dual'],
        requirements: [],
        supportedModes: [TestMode.DUAL]
      };

      const isolatedResult = ModeValidator.validateMode(TestMode.ISOLATED, test, false);
      const productionResult = ModeValidator.validateMode(TestMode.PRODUCTION, test, false);
      const dualResult = ModeValidator.validateMode(TestMode.DUAL, test, false);

      expect(isolatedResult.isValid).toBe(true);
      expect(productionResult.isValid).toBe(true);
      expect(dualResult.isValid).toBe(true);
    });

    it('should include environment warnings for isolated mode', () => {
      const test: TestDefinition = {
        name: 'isolated test',
        tags: ['@isolated'],
        requirements: [],
        supportedModes: [TestMode.ISOLATED]
      };

      const result = ModeValidator.validateMode(TestMode.ISOLATED, test, true);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('database backup path');
    });

    it('should include environment warnings for production mode', () => {
      process.env.NODE_ENV = 'development';
      
      const test: TestDefinition = {
        name: 'production test',
        tags: ['@production'],
        requirements: [],
        supportedModes: [TestMode.PRODUCTION]
      };

      const result = ModeValidator.validateMode(TestMode.PRODUCTION, test, true);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Running production tests in development environment');
    });
  });

  describe('getFallbackMode', () => {
    it('should recommend dual mode as fallback when available', () => {
      const test: TestDefinition = {
        name: 'flexible test',
        tags: ['@dual', '@isolated'],
        requirements: [],
        supportedModes: [TestMode.DUAL, TestMode.ISOLATED]
      };

      const result = ModeValidator.getFallbackMode(TestMode.PRODUCTION, test, 'Test reason');

      expect(result.mode).toBe(TestMode.DUAL);
      expect(result.confidence).toBe(0.8);
      expect(result.reason).toContain('Falling back to dual mode');
    });

    it('should recommend isolated mode when dual not available', () => {
      const test: TestDefinition = {
        name: 'isolated test',
        tags: ['@isolated', '@production'],
        requirements: [],
        supportedModes: [TestMode.ISOLATED, TestMode.PRODUCTION]
      };

      const result = ModeValidator.getFallbackMode(TestMode.DUAL, test, 'Test reason');

      expect(result.mode).toBe(TestMode.ISOLATED);
      expect(result.confidence).toBe(0.9);
      expect(result.reason).toContain('Falling back to isolated mode');
    });

    it('should recommend production mode when only option', () => {
      const test: TestDefinition = {
        name: 'production only test',
        tags: ['@production'],
        requirements: [],
        supportedModes: [TestMode.PRODUCTION]
      };

      const result = ModeValidator.getFallbackMode(TestMode.ISOLATED, test, 'Test reason');

      expect(result.mode).toBe(TestMode.PRODUCTION);
      expect(result.confidence).toBe(0.6);
      expect(result.reason).toContain('Falling back to production mode');
    });

    it('should return no fallback when no alternatives available', () => {
      const test: TestDefinition = {
        name: 'isolated only test',
        tags: ['@isolated'],
        requirements: [],
        supportedModes: [TestMode.ISOLATED]
      };

      const result = ModeValidator.getFallbackMode(TestMode.ISOLATED, test, 'Test reason');

      expect(result.mode).toBe(TestMode.ISOLATED);
      expect(result.confidence).toBe(0.0);
      expect(result.reason).toContain('No suitable fallback mode available');
    });

    it('should not recommend same mode as fallback', () => {
      const test: TestDefinition = {
        name: 'dual test',
        tags: ['@dual'],
        requirements: [],
        supportedModes: [TestMode.DUAL, TestMode.ISOLATED]
      };

      const result = ModeValidator.getFallbackMode(TestMode.DUAL, test, 'Test reason');

      expect(result.mode).toBe(TestMode.ISOLATED);
      expect(result.mode).not.toBe(TestMode.DUAL);
    });
  });

  describe('environment validation', () => {
    it('should validate isolated mode environment requirements', () => {
      process.env.DATABASE_BACKUP_PATH = '/path/to/backup';
      
      const test: TestDefinition = {
        name: 'isolated test',
        tags: ['@isolated'],
        requirements: [],
        supportedModes: [TestMode.ISOLATED]
      };

      const result = ModeValidator.validateMode(TestMode.ISOLATED, test, true);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate production mode environment requirements', () => {
      process.env.NODE_ENV = 'production';
      process.env.PRODUCTION_TEST_DATA_PREFIX = 'looneyTunesTest';
      
      const test: TestDefinition = {
        name: 'production test',
        tags: ['@production'],
        requirements: [],
        supportedModes: [TestMode.PRODUCTION]
      };

      const result = ModeValidator.validateMode(TestMode.PRODUCTION, test, true);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should accumulate warnings for dual mode from both environments', () => {
      const test: TestDefinition = {
        name: 'dual test',
        tags: ['@dual'],
        requirements: [],
        supportedModes: [TestMode.DUAL]
      };

      const result = ModeValidator.validateMode(TestMode.DUAL, test, true);

      expect(result.isValid).toBe(true);
      // Should have warnings from both isolated and production validation
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle test with no supported modes', () => {
      const test: TestDefinition = {
        name: 'invalid test',
        tags: [],
        requirements: [],
        supportedModes: []
      };

      const result = ModeValidator.validateMode(TestMode.ISOLATED, test, false);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Test "invalid test" does not support isolated mode');
    });

    it('should handle test with multiple supported modes', () => {
      const test: TestDefinition = {
        name: 'flexible test',
        tags: ['@isolated', '@production'],
        requirements: [],
        supportedModes: [TestMode.ISOLATED, TestMode.PRODUCTION]
      };

      const isolatedResult = ModeValidator.validateMode(TestMode.ISOLATED, test, false);
      const productionResult = ModeValidator.validateMode(TestMode.PRODUCTION, test, false);

      expect(isolatedResult.isValid).toBe(true);
      expect(productionResult.isValid).toBe(true);
    });
  });
});