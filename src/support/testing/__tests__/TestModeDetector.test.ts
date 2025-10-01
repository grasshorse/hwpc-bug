import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestModeDetector } from '../TestModeDetector';
import { TestMode, TestContext, TestDefinition } from '../types';

describe('TestModeDetector', () => {
  let detector: TestModeDetector;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    detector = new TestModeDetector();
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('detectMode', () => {
    describe('environment variable detection', () => {
      it('should detect isolated mode from TEST_MODE environment variable', () => {
        process.env.TEST_MODE = 'isolated';
        
        const testContext: TestContext = {
          testName: 'test',
          tags: [],
          scenario: {},
          feature: {}
        };

        const result = detector.detectMode(testContext);
        
        expect(result.mode).toBe(TestMode.ISOLATED);
        expect(result.confidence).toBe(1.0);
        expect(result.source).toBe('environment');
      });

      it('should detect production mode from TEST_MODE environment variable', () => {
        process.env.TEST_MODE = 'production';
        
        const testContext: TestContext = {
          testName: 'test',
          tags: [],
          scenario: {},
          feature: {}
        };

        const result = detector.detectMode(testContext);
        
        expect(result.mode).toBe(TestMode.PRODUCTION);
        expect(result.confidence).toBe(1.0);
        expect(result.source).toBe('environment');
      });

      it('should detect dual mode from TEST_MODE environment variable', () => {
        process.env.TEST_MODE = 'dual';
        
        const testContext: TestContext = {
          testName: 'test',
          tags: [],
          scenario: {},
          feature: {}
        };

        const result = detector.detectMode(testContext);
        
        expect(result.mode).toBe(TestMode.DUAL);
        expect(result.confidence).toBe(1.0);
        expect(result.source).toBe('environment');
      });

      it('should handle case-insensitive TEST_MODE values', () => {
        process.env.TEST_MODE = 'PRODUCTION';
        
        const testContext: TestContext = {
          testName: 'test',
          tags: [],
          scenario: {},
          feature: {}
        };

        const result = detector.detectMode(testContext);
        
        expect(result.mode).toBe(TestMode.PRODUCTION);
        expect(result.confidence).toBe(1.0);
      });

      it('should fallback to default for invalid TEST_MODE values', () => {
        process.env.TEST_MODE = 'invalid';
        delete process.env.NODE_ENV; // Clear NODE_ENV to avoid interference
        
        const testContext: TestContext = {
          testName: 'test',
          tags: [],
          scenario: {},
          feature: {}
        };

        const result = detector.detectMode(testContext);
        
        expect(result.mode).toBe(TestMode.ISOLATED);
        expect(result.confidence).toBe(0.3);
        expect(result.fallbackReason).toContain('Invalid TEST_MODE value');
      });

      it('should infer production mode from NODE_ENV=production', () => {
        process.env.NODE_ENV = 'production';
        
        const testContext: TestContext = {
          testName: 'test',
          tags: [],
          scenario: {},
          feature: {}
        };

        const result = detector.detectMode(testContext);
        
        expect(result.mode).toBe(TestMode.PRODUCTION);
        expect(result.confidence).toBe(0.7);
        expect(result.source).toBe('environment');
      });

      it('should infer isolated mode from NODE_ENV=test', () => {
        process.env.NODE_ENV = 'test';
        
        const testContext: TestContext = {
          testName: 'test',
          tags: [],
          scenario: {},
          feature: {}
        };

        const result = detector.detectMode(testContext);
        
        expect(result.mode).toBe(TestMode.ISOLATED);
        expect(result.confidence).toBe(0.6);
        expect(result.source).toBe('environment');
      });
    });

    describe('tag-based detection', () => {
      it('should detect isolated mode from @isolated tag', () => {
        delete process.env.TEST_MODE;
        delete process.env.NODE_ENV;
        
        const testContext: TestContext = {
          testName: 'test',
          tags: ['@isolated', '@navigation'],
          scenario: {},
          feature: {}
        };

        const result = detector.detectMode(testContext);
        
        expect(result.mode).toBe(TestMode.ISOLATED);
        expect(result.confidence).toBe(0.9);
        expect(result.source).toBe('tags');
      });

      it('should detect production mode from @production tag', () => {
        delete process.env.TEST_MODE;
        delete process.env.NODE_ENV;
        
        const testContext: TestContext = {
          testName: 'test',
          tags: ['@production', '@api'],
          scenario: {},
          feature: {}
        };

        const result = detector.detectMode(testContext);
        
        expect(result.mode).toBe(TestMode.PRODUCTION);
        expect(result.confidence).toBe(0.9);
        expect(result.source).toBe('tags');
      });

      it('should detect dual mode from @dual tag', () => {
        delete process.env.TEST_MODE;
        delete process.env.NODE_ENV;
        
        const testContext: TestContext = {
          testName: 'test',
          tags: ['@dual', '@integration'],
          scenario: {},
          feature: {}
        };

        const result = detector.detectMode(testContext);
        
        expect(result.mode).toBe(TestMode.DUAL);
        expect(result.confidence).toBe(0.9);
        expect(result.source).toBe('tags');
      });

      it('should handle case-insensitive tag matching', () => {
        delete process.env.TEST_MODE;
        delete process.env.NODE_ENV;
        
        const testContext: TestContext = {
          testName: 'test',
          tags: ['@ISOLATED', '@Navigation'],
          scenario: {},
          feature: {}
        };

        const result = detector.detectMode(testContext);
        
        expect(result.mode).toBe(TestMode.ISOLATED);
        expect(result.confidence).toBe(0.9);
      });

      it('should infer dual mode for API tests', () => {
        delete process.env.TEST_MODE;
        delete process.env.NODE_ENV;
        
        const testContext: TestContext = {
          testName: 'test',
          tags: ['@api', '@regression'],
          scenario: {},
          feature: {}
        };

        const result = detector.detectMode(testContext);
        
        expect(result.mode).toBe(TestMode.DUAL);
        expect(result.confidence).toBe(0.4);
        expect(result.fallbackReason).toContain('API/Integration tests');
      });

      it('should infer isolated mode for navigation tests', () => {
        delete process.env.TEST_MODE;
        delete process.env.NODE_ENV;
        
        const testContext: TestContext = {
          testName: 'test',
          tags: ['@navigation', '@ui'],
          scenario: {},
          feature: {}
        };

        const result = detector.detectMode(testContext);
        
        expect(result.mode).toBe(TestMode.ISOLATED);
        expect(result.confidence).toBe(0.3);
        expect(result.fallbackReason).toContain('Navigation tests');
      });
    });

    describe('priority and fallback', () => {
      it('should prioritize environment variables over tags', () => {
        process.env.TEST_MODE = 'production';
        
        const testContext: TestContext = {
          testName: 'test',
          tags: ['@isolated'],
          scenario: {},
          feature: {}
        };

        const result = detector.detectMode(testContext);
        
        expect(result.mode).toBe(TestMode.PRODUCTION);
        expect(result.source).toBe('environment');
      });

      it('should use default mode when no indicators are present', () => {
        delete process.env.TEST_MODE;
        delete process.env.NODE_ENV;
        
        const testContext: TestContext = {
          testName: 'test',
          tags: ['@smoke'],
          scenario: {},
          feature: {}
        };

        const result = detector.detectMode(testContext);
        
        expect(result.mode).toBe(TestMode.ISOLATED);
        expect(result.source).toBe('default');
        expect(result.fallbackReason).toContain('No explicit mode specified');
      });
    });
  });

  describe('validateModeCompatibility', () => {
    it('should return true for dual mode tests with any mode', () => {
      const test: TestDefinition = {
        name: 'dual test',
        tags: ['@dual'],
        requirements: [],
        supportedModes: [TestMode.DUAL]
      };

      expect(detector.validateModeCompatibility(TestMode.ISOLATED, test)).toBe(true);
      expect(detector.validateModeCompatibility(TestMode.PRODUCTION, test)).toBe(true);
      expect(detector.validateModeCompatibility(TestMode.DUAL, test)).toBe(true);
    });

    it('should return true when mode is explicitly supported', () => {
      const test: TestDefinition = {
        name: 'isolated test',
        tags: ['@isolated'],
        requirements: [],
        supportedModes: [TestMode.ISOLATED]
      };

      expect(detector.validateModeCompatibility(TestMode.ISOLATED, test)).toBe(true);
      expect(detector.validateModeCompatibility(TestMode.PRODUCTION, test)).toBe(false);
    });

    it('should return false when mode is not supported', () => {
      const test: TestDefinition = {
        name: 'production only test',
        tags: ['@production'],
        requirements: [],
        supportedModes: [TestMode.PRODUCTION]
      };

      expect(detector.validateModeCompatibility(TestMode.ISOLATED, test)).toBe(false);
      expect(detector.validateModeCompatibility(TestMode.PRODUCTION, test)).toBe(true);
    });
  });

  describe('getDefaultMode', () => {
    it('should return isolated mode as default', () => {
      expect(detector.getDefaultMode()).toBe(TestMode.ISOLATED);
    });
  });

  describe('createTestDefinition', () => {
    it('should create test definition with explicit mode tags', () => {
      const definition = detector.createTestDefinition(
        'test name',
        ['@isolated', '@navigation'],
        ['req1', 'req2']
      );

      expect(definition.name).toBe('test name');
      expect(definition.tags).toEqual(['@isolated', '@navigation']);
      expect(definition.requirements).toEqual(['req1', 'req2']);
      expect(definition.supportedModes).toEqual([TestMode.ISOLATED]);
    });

    it('should create test definition with multiple mode tags', () => {
      const definition = detector.createTestDefinition(
        'dual test',
        ['@isolated', '@production', '@api']
      );

      expect(definition.supportedModes).toContain(TestMode.ISOLATED);
      expect(definition.supportedModes).toContain(TestMode.PRODUCTION);
    });

    it('should default to dual mode when no explicit mode tags', () => {
      const definition = detector.createTestDefinition(
        'generic test',
        ['@api', '@regression']
      );

      expect(definition.supportedModes).toEqual([TestMode.DUAL]);
    });

    it('should handle case-insensitive tag matching', () => {
      const definition = detector.createTestDefinition(
        'test',
        ['@ISOLATED', '@Production']
      );

      expect(definition.supportedModes).toContain(TestMode.ISOLATED);
      expect(definition.supportedModes).toContain(TestMode.PRODUCTION);
    });
  });
});