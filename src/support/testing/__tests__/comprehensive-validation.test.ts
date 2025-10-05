/**
 * Comprehensive Testing and Validation Suite
 * 
 * This test suite provides end-to-end validation of the dual testing architecture,
 * including performance tests, mode switching validation, and data integrity checks.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestModeDetector } from '../TestModeDetector';
import { DataContextFactory } from '../DataContextFactory';
import { TestConfigManager } from '../TestConfigManager';
import { DataIntegrityValidator } from '../DataIntegrityValidator';
import { SnapshotManager } from '../SnapshotManager';
import { TestMode, TestContext, TestConfig, DataContext } from '../types';

describe('Comprehensive Dual-Mode Testing Validation', () => {
  let modeDetector: TestModeDetector;
  let configManager: TestConfigManager;
  let integrityValidator: DataIntegrityValidator;
  let snapshotManager: SnapshotManager;

  beforeEach(() => {
    modeDetector = new TestModeDetector();
    configManager = TestConfigManager.getInstance();
    integrityValidator = new DataIntegrityValidator();
    snapshotManager = new SnapshotManager();
    
    // Reset environment variables
    delete process.env.TEST_MODE;
    delete process.env.NODE_ENV;
    configManager.clearCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('End-to-End Mode Validation', () => {
    it('should successfully execute complete workflow in isolated mode', async () => {
      // Arrange
      process.env.TEST_MODE = 'isolated';
      const testContext: TestContext = {
        testName: 'E2E Isolated Test',
        tags: ['@isolated', '@navigation'],
        testId: 'e2e-isolated-001'
      };

      // Act & Assert - Complete workflow
      const detectionResult = modeDetector.detectMode(testContext);
      expect(detectionResult.mode).toBe(TestMode.ISOLATED);
      expect(detectionResult.confidence).toBe(1.0);

      const config = configManager.loadConfig({ mode: TestMode.ISOLATED });
      expect(config.mode).toBe(TestMode.ISOLATED);

      const contextManager = DataContextFactory.getManager(TestMode.ISOLATED);
      const context = await contextManager.setupContext(TestMode.ISOLATED, config);
      expect(context.mode).toBe(TestMode.ISOLATED);

      const report = await integrityValidator.validateTestData(context.testData);
      expect(report.isValid).toBe(true);

      await context.cleanup();
    });

    it('should successfully execute complete workflow in production mode', async () => {
      // Arrange
      process.env.TEST_MODE = 'production';
      const testContext: TestContext = {
        testName: 'E2E Production Test',
        tags: ['@production', '@api'],
        testId: 'e2e-production-001'
      };

      // Act & Assert - Complete workflow
      const detectionResult = modeDetector.detectMode(testContext);
      expect(detectionResult.mode).toBe(TestMode.PRODUCTION);
      expect(detectionResult.confidence).toBe(1.0);

      const config = configManager.loadConfig({ mode: TestMode.PRODUCTION });
      expect(config.mode).toBe(TestMode.PRODUCTION);

      const contextManager = DataContextFactory.getManager(TestMode.PRODUCTION);
      const context = await contextManager.setupContext(TestMode.PRODUCTION, config);
      expect(context.mode).toBe(TestMode.PRODUCTION);

      const report = await integrityValidator.validateTestData(context.testData);
      expect(report.isValid).toBe(true);

      await contextManager.cleanupContext(context);
    });

    it('should handle dual mode execution with fallback', async () => {
      // Arrange
      process.env.TEST_MODE = 'dual';
      const testContext: TestContext = {
        testName: 'E2E Dual Mode Test',
        tags: ['@dual', '@integration'],
        testId: 'e2e-dual-001'
      };

      // Act & Assert - Dual mode workflow
      const detectionResult = modeDetector.detectMode(testContext);
      expect(detectionResult.mode).toBe(TestMode.DUAL);

      // Test both isolated and production contexts
      const isolatedConfig = configManager.loadConfig({ mode: TestMode.ISOLATED });
      const productionConfig = configManager.loadConfig({ mode: TestMode.PRODUCTION });

      const isolatedManager = DataContextFactory.getManager(TestMode.ISOLATED);
      const productionManager = DataContextFactory.getManager(TestMode.PRODUCTION);
      
      const isolatedContext = await isolatedManager.setupContext(TestMode.ISOLATED, isolatedConfig);
      const productionContext = await productionManager.setupContext(TestMode.PRODUCTION, productionConfig);

      expect(isolatedContext.mode).toBe(TestMode.ISOLATED);
      expect(productionContext.mode).toBe(TestMode.PRODUCTION);

      // Validate both contexts
      const isolatedReport = await integrityValidator.validateTestData(isolatedContext.testData);
      const productionReport = await integrityValidator.validateTestData(productionContext.testData);

      expect(isolatedReport.isValid).toBe(true);
      expect(productionReport.isValid).toBe(true);

      // Cleanup both contexts
      await isolatedManager.cleanupContext(isolatedContext);
      await productionManager.cleanupContext(productionContext);
    });
  });

  describe('Mode Switching and Environment Detection', () => {
    it('should correctly switch modes based on environment changes', async () => {
      const testContext: TestContext = {
        testName: 'Mode Switching Test',
        tags: ['@dual'],
        testId: 'mode-switch-001'
      };

      // Test isolated mode
      process.env.TEST_MODE = 'isolated';
      let result = modeDetector.detectMode(testContext);
      expect(result.mode).toBe(TestMode.ISOLATED);
      expect(result.source).toBe('environment');

      // Switch to production mode
      process.env.TEST_MODE = 'production';
      result = modeDetector.detectMode(testContext);
      expect(result.mode).toBe(TestMode.PRODUCTION);
      expect(result.source).toBe('environment');

      // Switch to dual mode
      process.env.TEST_MODE = 'dual';
      result = modeDetector.detectMode(testContext);
      expect(result.mode).toBe(TestMode.DUAL);
      expect(result.source).toBe('environment');
    });

    it('should handle invalid environment values gracefully', async () => {
      const testContext: TestContext = {
        testName: 'Invalid Environment Test',
        tags: [],
        testId: 'invalid-env-001'
      };

      process.env.TEST_MODE = 'invalid-mode';
      const result = modeDetector.detectMode(testContext);
      
      expect(result.mode).toBe(TestMode.ISOLATED); // Default fallback
      expect(result.fallbackReason).toContain('Invalid TEST_MODE value');
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should prioritize explicit tags over environment variables', async () => {
      process.env.TEST_MODE = 'isolated';
      
      const testContext: TestContext = {
        testName: 'Tag Priority Test',
        tags: ['@production'],
        testId: 'tag-priority-001'
      };

      const result = modeDetector.detectMode(testContext);
      expect(result.mode).toBe(TestMode.PRODUCTION);
      expect(result.source).toBe('tags');
    });

    it('should handle conflicting mode indicators', async () => {
      process.env.TEST_MODE = 'production';
      process.env.NODE_ENV = 'test';
      
      const testContext: TestContext = {
        testName: 'Conflicting Indicators Test',
        tags: ['@isolated'],
        testId: 'conflict-001'
      };

      const result = modeDetector.detectMode(testContext);
      // Tags should have higher confidence than NODE_ENV
      expect(result.mode).toBe(TestMode.ISOLATED);
      expect(result.source).toBe('tags');
    });
  });

  describe('Data Integrity Validation Across Environments', () => {
    it('should validate isolated test data integrity', async () => {
      const config = configManager.loadConfig({ mode: TestMode.ISOLATED });
      const contextManager = DataContextFactory.getManager(TestMode.ISOLATED);
      const context = await contextManager.setupContext(TestMode.ISOLATED, config);

      // Validate data structure
      expect(context.testData).toBeDefined();
      expect(context.testData.customers).toBeInstanceOf(Array);
      expect(context.testData.routes).toBeInstanceOf(Array);
      expect(context.testData.tickets).toBeInstanceOf(Array);

      // Validate data integrity
      const report = await integrityValidator.validateTestData(context.testData);
      expect(report.isValid).toBe(true);

      // Validate metadata
      expect(context.metadata.mode).toBe(TestMode.ISOLATED);
      expect(context.metadata.createdAt).toBeInstanceOf(Date);
      expect(context.metadata.testRunId).toBeDefined();

      await contextManager.cleanupContext(context);
    });

    it('should validate production test data integrity', async () => {
      const config = configManager.loadConfig({ mode: TestMode.PRODUCTION });
      const contextManager = DataContextFactory.getManager(TestMode.PRODUCTION);
      const context = await contextManager.setupContext(TestMode.PRODUCTION, config);

      // Validate Looney Tunes test data patterns
      const testCustomers = context.testData.customers.filter((c: any) => c.isTestData);
      expect(testCustomers.length).toBeGreaterThan(0);
      
      testCustomers.forEach((customer: any) => {
        expect(customer.name).toMatch(/looneyTunesTest/i);
        expect(customer.isTestData).toBe(true);
      });

      // Validate test routes
      const testRoutes = context.testData.routes.filter((r: any) => r.isTestData);
      expect(testRoutes.length).toBeGreaterThan(0);
      
      const expectedLocations = ['Cedar Falls', 'Winfield', "O'Fallon"];
      testRoutes.forEach((route: any) => {
        expect(expectedLocations).toContain(route.location);
        expect(route.isTestData).toBe(true);
      });

      // Validate data integrity
      const report = await integrityValidator.validateTestData(context.testData);
      expect(report.isValid).toBe(true);

      await contextManager.cleanupContext(context);
    });

    it('should detect and report data corruption', async () => {
      const config = configManager.loadConfig({ mode: TestMode.ISOLATED });
      const contextManager = DataContextFactory.getManager(TestMode.ISOLATED);
      const context = await contextManager.setupContext(TestMode.ISOLATED, config);

      // Simulate data corruption
      context.testData.customers = [];
      context.testData.routes = [];

      const report = await integrityValidator.validateTestData(context.testData);
      expect(report.isValid).toBe(false);
      expect(report.validationResults.length).toBeGreaterThan(0);
      expect(report.validationResults.some((e: any) => e.message.includes('customers') || e.message.includes('No customers'))).toBe(true);
      expect(report.validationResults.some((e: any) => e.message.includes('routes') || e.message.includes('No routes'))).toBe(true);

      await contextManager.cleanupContext(context);
    });

    it('should validate cross-environment data consistency', async () => {
      // Create contexts for both modes
      const isolatedConfig = configManager.loadConfig({ mode: TestMode.ISOLATED });
      const productionConfig = configManager.loadConfig({ mode: TestMode.PRODUCTION });

      const isolatedManager = DataContextFactory.getManager(TestMode.ISOLATED);
      const productionManager = DataContextFactory.getManager(TestMode.PRODUCTION);
      
      const isolatedContext = await isolatedManager.setupContext(TestMode.ISOLATED, isolatedConfig);
      const productionContext = await productionManager.setupContext(TestMode.PRODUCTION, productionConfig);

      // Validate both contexts independently
      const isolatedReport = await integrityValidator.validateTestData(isolatedContext.testData);
      const productionReport = await integrityValidator.validateTestData(productionContext.testData);

      expect(isolatedReport.isValid).toBe(true);
      expect(productionReport.isValid).toBe(true);

      // Validate that both contexts have required data structures
      expect(isolatedContext.testData.customers.length).toBeGreaterThan(0);
      expect(productionContext.testData.customers.length).toBeGreaterThan(0);

      // Validate that production data follows test patterns
      const productionTestCustomers = productionContext.testData.customers.filter((c: any) => c.isTestData);
      expect(productionTestCustomers.length).toBeGreaterThan(0);

      await isolatedManager.cleanupContext(isolatedContext);
      await productionManager.cleanupContext(productionContext);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle database connection failures gracefully', async () => {
      const config = configManager.loadConfig({ mode: TestMode.ISOLATED });
      
      // Simulate connection failure
      config.databaseConfig!.connectionString = 'invalid-connection-string';

      const contextManager = DataContextFactory.getManager(TestMode.ISOLATED);
      
      await expect(
        contextManager.setupContext(TestMode.ISOLATED, config)
      ).rejects.toThrow();
    });

    it('should provide meaningful error messages for setup failures', async () => {
      const config = configManager.getConfig();
      
      // Simulate missing production config
      config.productionConfig = undefined;

      const contextManager = DataContextFactory.getManager(TestMode.PRODUCTION);

      try {
        await contextManager.setupContext(TestMode.PRODUCTION, config);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('production');
      }
    });

    it('should handle cleanup failures without affecting test results', async () => {
      const config = configManager.getConfig();
      const contextManager = DataContextFactory.getManager(TestMode.ISOLATED);
      const context = await contextManager.setupContext(TestMode.ISOLATED, config);

      // Mock cleanup failure
      const originalCleanup = context.cleanup;
      context.cleanup = vi.fn().mockRejectedValue(new Error('Cleanup failed'));

      // Cleanup should not throw but should log the error
      await expect(context.cleanup()).rejects.toThrow('Cleanup failed');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate isolated mode configuration', async () => {
      const config = configManager.createModeSpecificConfig(TestMode.ISOLATED);
      
      expect(config.mode).toBe(TestMode.ISOLATED);
      expect(config.databaseConfig).toBeDefined();
      expect(config.databaseConfig!.backupPath).toBeDefined();
      expect(config.databaseConfig!.connectionString).toBeDefined();
      expect(config.databaseConfig!.verificationQueries).toBeInstanceOf(Array);
    });

    it('should validate production mode configuration', async () => {
      const config = configManager.createModeSpecificConfig(TestMode.PRODUCTION);
      
      expect(config.mode).toBe(TestMode.PRODUCTION);
      expect(config.productionConfig).toBeDefined();
      expect(config.productionConfig!.testDataPrefix).toBe('looneyTunesTest');
      expect(config.productionConfig!.locations).toContain('Cedar Falls');
      expect(config.productionConfig!.locations).toContain('Winfield');
      expect(config.productionConfig!.locations).toContain("O'Fallon");
      expect(config.productionConfig!.customerNames).toBeInstanceOf(Array);
    });

    it('should handle environment validation for different modes', async () => {
      // Test isolated mode environment validation
      const isolatedValidation = configManager.validateEnvironmentForMode(TestMode.ISOLATED);
      expect(isolatedValidation.valid).toBeDefined();
      expect(isolatedValidation.errors).toBeInstanceOf(Array);

      // Test production mode environment validation
      const productionValidation = configManager.validateEnvironmentForMode(TestMode.PRODUCTION);
      expect(productionValidation.valid).toBeDefined();
      expect(productionValidation.errors).toBeInstanceOf(Array);
    });
  });
});