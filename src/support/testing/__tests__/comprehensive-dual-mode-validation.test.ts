/**
 * Comprehensive Dual-Mode Testing Validation Suite
 * 
 * This test suite implements task 12 from the dual testing architecture spec:
 * - End-to-end tests that validate both testing modes
 * - Performance tests for database loading and restoration
 * - Tests for mode switching and environment detection
 * - Validation tests for test data integrity across environments
 * - Comprehensive integration tests for the complete dual-mode workflow
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestModeDetector } from '../TestModeDetector';
import { DataContextFactory } from '../DataContextFactory';
import { TestConfigManager } from '../TestConfigManager';
import { DataIntegrityValidator } from '../DataIntegrityValidator';
import { TestMode, TestContext, DataContext, ModeDetectionResult } from '../types';

describe('Comprehensive Dual-Mode Testing Validation', () => {
  let modeDetector: TestModeDetector;
  let configManager: TestConfigManager;
  let integrityValidator: DataIntegrityValidator;

  beforeEach(() => {
    modeDetector = new TestModeDetector();
    configManager = TestConfigManager.getInstance();
    integrityValidator = new DataIntegrityValidator();
    
    // Reset environment variables
    delete process.env.TEST_MODE;
    delete process.env.NODE_ENV;
    configManager.clearCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('End-to-End Mode Validation', () => {
    it('should execute complete isolated mode workflow', async () => {
      // Arrange
      process.env.TEST_MODE = 'isolated';
      const testContext: TestContext = {
        testName: 'E2E Isolated Navigation Test',
        tags: ['@isolated', '@navigation', '@e2e'],
        testId: 'e2e-isolated-001'
      };

      // Act & Assert - Complete workflow
      const detectionResult = modeDetector.detectMode(testContext);
      expect(detectionResult.mode).toBe(TestMode.ISOLATED);
      expect(detectionResult.confidence).toBeGreaterThan(0.9);

      // 2. Configuration Loading
      const config = configManager.loadConfig({ mode: TestMode.ISOLATED });
      expect(config.mode).toBe(TestMode.ISOLATED);

      // 3. Context Setup
      const contextManager = DataContextFactory.getManager(TestMode.ISOLATED);
      const context = await contextManager.setupContext(TestMode.ISOLATED, config);
      expect(context.mode).toBe(TestMode.ISOLATED);

      // 4. Data Validation
      const report = await integrityValidator.validateTestData(context.testData);
      expect(report.isValid).toBe(true);
      expect(context.testData.customers.length).toBeGreaterThan(0);
      expect(context.testData.routes.length).toBeGreaterThan(0);

      // 5. Verify isolated database connection
      expect(context.connectionInfo.isTestConnection).toBe(true);
      expect(context.metadata.mode).toBe(TestMode.ISOLATED);

      // 6. Cleanup
      await contextManager.cleanupContext(context);
    });

    it('should execute complete production mode workflow', async () => {
      // Arrange
      process.env.TEST_MODE = 'production';
      const testContext: TestContext = {
        testName: 'E2E Production Navigation Test',
        tags: ['@production', '@navigation', '@e2e'],
        testId: 'e2e-production-001'
      };

      // Act & Assert - Complete workflow
      const detectionResult = modeDetector.detectMode(testContext);
      expect(detectionResult.mode).toBe(TestMode.PRODUCTION);
      expect(detectionResult.confidence).toBeGreaterThan(0.9);

      // 2. Configuration Loading
      const config = configManager.loadConfig({ mode: TestMode.PRODUCTION });
      expect(config.mode).toBe(TestMode.PRODUCTION);

      // 3. Context Setup
      const contextManager = DataContextFactory.getManager(TestMode.PRODUCTION);
      const context = await contextManager.setupContext(TestMode.PRODUCTION, config);
      expect(context.mode).toBe(TestMode.PRODUCTION);

      // 4. Validate production test data patterns
      const testCustomers = context.testData.customers.filter(c => c.isTestData);
      expect(testCustomers.length).toBeGreaterThan(0);
      
      testCustomers.forEach(customer => {
        expect(customer.name).toMatch(/looneyTunesTest|Bugs Bunny|Daffy Duck|Porky Pig/i);
        expect(customer.isTestData).toBe(true);
      });

      // 5. Validate test routes
      const testRoutes = context.testData.routes.filter(r => r.isTestData);
      expect(testRoutes.length).toBeGreaterThan(0);
      
      const expectedLocations = ['Cedar Falls', 'Winfield', "O'Fallon"];
      testRoutes.forEach(route => {
        expect(expectedLocations).toContain(route.location);
        expect(route.isTestData).toBe(true);
      });

      // 6. Data integrity validation
      const report = await integrityValidator.validateTestData(context.testData);
      expect(report.isValid).toBe(true);

      // 7. Cleanup
      await contextManager.cleanupContext(context);
    });

    it('should handle dual mode with intelligent fallback', async () => {
      // Arrange
      process.env.TEST_MODE = 'dual';
      const testContext: TestContext = {
        testName: 'E2E Dual Mode Test with Fallback',
        tags: ['@dual', '@integration', '@e2e'],
        testId: 'e2e-dual-001'
      };

      // Act & Assert - Dual mode workflow
      const detectionResult = modeDetector.detectMode(testContext);
      expect(detectionResult.mode).toBe(TestMode.DUAL);

      // Try isolated mode first (dual mode fallback logic)
      let contextUsed: DataContext | null = null;
      let modeUsed: TestMode | null = null;

      try {
        const isolatedConfig = configManager.loadConfig({ mode: TestMode.ISOLATED });
        const isolatedManager = DataContextFactory.getManager(TestMode.ISOLATED);
        contextUsed = await isolatedManager.setupContext(TestMode.ISOLATED, isolatedConfig);
        modeUsed = TestMode.ISOLATED;
        
        expect(contextUsed.mode).toBe(TestMode.ISOLATED);
        
        // Validate isolated context
        const report = await integrityValidator.validateTestData(contextUsed.testData);
        expect(report.isValid).toBe(true);
        
        await isolatedManager.cleanupContext(contextUsed);
      } catch (error) {
        console.log('Isolated mode failed, falling back to production mode');
        
        // Fallback to production mode
        const productionConfig = configManager.loadConfig({ mode: TestMode.PRODUCTION });
        const productionManager = DataContextFactory.getManager(TestMode.PRODUCTION);
        contextUsed = await productionManager.setupContext(TestMode.PRODUCTION, productionConfig);
        modeUsed = TestMode.PRODUCTION;
        
        expect(contextUsed.mode).toBe(TestMode.PRODUCTION);
        
        // Validate production context
        const report = await integrityValidator.validateTestData(contextUsed.testData);
        expect(report.isValid).toBe(true);
        
        await productionManager.cleanupContext(contextUsed);
      }

      // Verify that one of the modes was successfully used
      expect(modeUsed).not.toBeNull();
      expect([TestMode.ISOLATED, TestMode.PRODUCTION]).toContain(modeUsed!);
    });
  });

  describe('Performance Testing for Database Operations', () => {
    it('should load database snapshots within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const config = configManager.loadConfig({ mode: TestMode.ISOLATED });
      const contextManager = DataContextFactory.getManager(TestMode.ISOLATED);
      const context = await contextManager.setupContext(TestMode.ISOLATED, config);
      
      const loadTime = Date.now() - startTime;
      
      // Database loading should complete within 10 seconds
      expect(loadTime).toBeLessThan(10000);
      expect(context.testData.customers.length).toBeGreaterThan(0);
      
      console.log(`Database load time: ${loadTime}ms`);
      
      await contextManager.cleanupContext(context);
    });

    it('should restore database state efficiently', async () => {
      const config = configManager.loadConfig({ mode: TestMode.ISOLATED });
      const contextManager = DataContextFactory.getManager(TestMode.ISOLATED);
      
      // Measure multiple restore operations
      const restoreTimes: number[] = [];
      
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        
        const context = await contextManager.setupContext(TestMode.ISOLATED, config);
        const restoreTime = Date.now() - startTime;
        restoreTimes.push(restoreTime);
        
        // Verify data is loaded correctly
        expect(context.testData.customers.length).toBeGreaterThan(0);
        
        await contextManager.cleanupContext(context);
      }
      
      // Calculate average restore time
      const avgRestoreTime = restoreTimes.reduce((a, b) => a + b, 0) / restoreTimes.length;
      
      // Average restore time should be reasonable
      expect(avgRestoreTime).toBeLessThan(8000); // 8 seconds
      
      console.log(`Average database restore time: ${avgRestoreTime}ms`);
      console.log(`Restore times: ${restoreTimes.join(', ')}ms`);
    });

    it('should handle concurrent database operations efficiently', async () => {
      const config = configManager.loadConfig({ mode: TestMode.ISOLATED });
      const contextManager = DataContextFactory.getManager(TestMode.ISOLATED);
      
      const concurrentOperations = 3;
      const startTime = Date.now();
      
      // Create multiple contexts concurrently
      const contextPromises = Array.from({ length: concurrentOperations }, () =>
        contextManager.setupContext(TestMode.ISOLATED, config)
      );
      
      const contexts = await Promise.all(contextPromises);
      const totalTime = Date.now() - startTime;
      
      // Verify all contexts are valid
      contexts.forEach(context => {
        expect(context.mode).toBe(TestMode.ISOLATED);
        expect(context.testData.customers.length).toBeGreaterThan(0);
      });
      
      // Concurrent operations should not take significantly longer than sequential
      expect(totalTime).toBeLessThan(concurrentOperations * 15000); // Allow some overhead
      
      console.log(`Concurrent operations (${concurrentOperations}) time: ${totalTime}ms`);
      
      // Cleanup all contexts
      await Promise.all(contexts.map(context => contextManager.cleanupContext(context)));
    });

    it('should measure memory usage during database operations', async () => {
      const initialMemory = process.memoryUsage();
      
      const config = configManager.loadConfig({ mode: TestMode.ISOLATED });
      const contextManager = DataContextFactory.getManager(TestMode.ISOLATED);
      const context = await contextManager.setupContext(TestMode.ISOLATED, config);
      
      const peakMemory = process.memoryUsage();
      const memoryIncrease = peakMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB for test data)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      console.log(`Memory increase during database load: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
      
      await contextManager.cleanupContext(context);
      
      // Allow garbage collection
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryLeak = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory leak should be minimal (less than 5MB)
      expect(memoryLeak).toBeLessThan(5 * 1024 * 1024);
      
      console.log(`Memory leak after cleanup: ${Math.round(memoryLeak / 1024 / 1024)}MB`);
    });
  });

  describe('Mode Switching and Environment Detection', () => {
    it('should detect mode changes dynamically', async () => {
      const testContext: TestContext = {
        testName: 'Dynamic Mode Detection Test',
        tags: [], // No tags to test environment detection
        testId: 'mode-detection-001'
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

      // Test tag-based detection (should override environment)
      const taggedContext: TestContext = {
        testName: 'Tagged Test',
        tags: ['@production'],
        testId: 'tagged-001'
      };
      
      process.env.TEST_MODE = 'isolated'; // Set different environment
      result = modeDetector.detectMode(taggedContext);
      expect(result.mode).toBe(TestMode.PRODUCTION);
      expect(result.source).toBe('tags');
    });

    it('should handle invalid environment values gracefully', async () => {
      const testContext: TestContext = {
        testName: 'Invalid Environment Test',
        tags: [],
        testId: 'invalid-env-001'
      };

      // Test invalid TEST_MODE
      process.env.TEST_MODE = 'invalid-mode';
      const result = modeDetector.detectMode(testContext);
      
      expect(result.mode).toBe(TestMode.ISOLATED); // Should fallback to default
      expect(result.fallbackReason).toContain('Invalid TEST_MODE value');
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should validate mode compatibility with test requirements', async () => {
      // Test isolated-only scenario
      const isolatedOnlyContext: TestContext = {
        testName: 'Isolated Only Test',
        tags: ['@isolated'],
        testId: 'isolated-only-001'
      };

      const isolatedResult = modeDetector.detectMode(isolatedOnlyContext);
      expect(isolatedResult.mode).toBe(TestMode.ISOLATED);

      // Test production-only scenario
      const productionOnlyContext: TestContext = {
        testName: 'Production Only Test',
        tags: ['@production'],
        testId: 'production-only-001'
      };

      const productionResult = modeDetector.detectMode(productionOnlyContext);
      expect(productionResult.mode).toBe(TestMode.PRODUCTION);

      // Test dual mode scenario
      const dualContext: TestContext = {
        testName: 'Dual Mode Test',
        tags: ['@dual'],
        testId: 'dual-001'
      };

      const dualResult = modeDetector.detectMode(dualContext);
      expect(dualResult.mode).toBe(TestMode.DUAL);
    });
  });

  describe('Test Data Integrity Validation', () => {
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

      // Validate data relationships
      if (context.testData.tickets.length > 0) {
        const ticket = context.testData.tickets[0];
        const customer = context.testData.customers.find(c => c.id === ticket.customerId);
        const route = context.testData.routes.find(r => r.id === ticket.routeId);
        
        expect(customer).toBeDefined();
        expect(route).toBeDefined();
      }

      // Validate metadata
      expect(context.metadata.mode).toBe(TestMode.ISOLATED);
      expect(context.metadata.createdAt).toBeInstanceOf(Date);
      expect(context.metadata.testRunId).toBeDefined();

      await contextManager.cleanupContext(context);
    });

    it('should validate production test data patterns', async () => {
      const config = configManager.loadConfig({ mode: TestMode.PRODUCTION });
      const contextManager = DataContextFactory.getManager(TestMode.PRODUCTION);
      const context = await contextManager.setupContext(TestMode.PRODUCTION, config);

      // Validate Looney Tunes test data patterns
      const testCustomers = context.testData.customers.filter(c => c.isTestData);
      expect(testCustomers.length).toBeGreaterThan(0);
      
      testCustomers.forEach(customer => {
        expect(customer.name).toMatch(/looneyTunesTest|Bugs Bunny|Daffy Duck|Porky Pig|Tweety|Sylvester/i);
        expect(customer.isTestData).toBe(true);
        expect(customer.email).toMatch(/@.*\.com$/);
        expect(customer.phone).toMatch(/^\d{3}-\d{3}-\d{4}$/);
      });

      // Validate test routes
      const testRoutes = context.testData.routes.filter(r => r.isTestData);
      expect(testRoutes.length).toBeGreaterThan(0);
      
      const expectedLocations = ['Cedar Falls', 'Winfield', "O'Fallon"];
      testRoutes.forEach(route => {
        expect(expectedLocations).toContain(route.location);
        expect(route.isTestData).toBe(true);
        expect(route.name).toBeDefined();
      });

      // Validate test tickets
      const testTickets = context.testData.tickets.filter(t => t.isTestData);
      if (testTickets.length > 0) {
        testTickets.forEach(ticket => {
          expect(ticket.isTestData).toBe(true);
          expect(ticket.customerId).toBeDefined();
          expect(ticket.routeId).toBeDefined();
          expect(ticket.status).toBeDefined();
        });
      }

      await contextManager.cleanupContext(context);
    });

    it('should detect and report data corruption', async () => {
      const config = configManager.loadConfig({ mode: TestMode.ISOLATED });
      const contextManager = DataContextFactory.getManager(TestMode.ISOLATED);
      const context = await contextManager.setupContext(TestMode.ISOLATED, config);

      // Simulate data corruption
      const originalCustomers = [...context.testData.customers];
      const originalRoutes = [...context.testData.routes];
      
      context.testData.customers = [];
      context.testData.routes = [];

      const report = await integrityValidator.validateTestData(context.testData);
      expect(report.isValid).toBe(false);
      expect(report.validationResults.length).toBeGreaterThan(0);
      
      const hasCustomerError = report.validationResults.some(e => 
        e.message.includes('customers') || e.message.includes('No customers')
      );
      const hasRouteError = report.validationResults.some(e => 
        e.message.includes('routes') || e.message.includes('No routes')
      );
      
      expect(hasCustomerError || hasRouteError).toBe(true);

      // Restore data for cleanup
      context.testData.customers = originalCustomers;
      context.testData.routes = originalRoutes;

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
      const productionTestCustomers = productionContext.testData.customers.filter(c => c.isTestData);
      expect(productionTestCustomers.length).toBeGreaterThan(0);

      // Validate data structure consistency
      expect(isolatedContext.testData.customers[0]).toHaveProperty('id');
      expect(isolatedContext.testData.customers[0]).toHaveProperty('name');
      expect(isolatedContext.testData.customers[0]).toHaveProperty('email');
      expect(isolatedContext.testData.customers[0]).toHaveProperty('isTestData');

      expect(productionContext.testData.customers[0]).toHaveProperty('id');
      expect(productionContext.testData.customers[0]).toHaveProperty('name');
      expect(productionContext.testData.customers[0]).toHaveProperty('email');
      expect(productionContext.testData.customers[0]).toHaveProperty('isTestData');

      await isolatedManager.cleanupContext(isolatedContext);
      await productionManager.cleanupContext(productionContext);
    });
  });

  describe('Comprehensive Integration Tests', () => {
    it('should execute complete dual-mode workflow with Cucumber-like integration', async () => {
      // Mock Cucumber scenario
      const scenario = {
        name: 'Complete dual-mode navigation test',
        tags: ['@dual', '@navigation', '@integration'],
        steps: [
          {
            keyword: 'Given',
            text: 'I have a dual-mode test environment',
            execute: async (context: DataContext) => {
              expect([TestMode.ISOLATED, TestMode.PRODUCTION]).toContain(context.mode);
              expect(context.testData.customers.length).toBeGreaterThan(0);
            }
          },
          {
            keyword: 'When',
            text: 'I navigate to the customer page',
            execute: async (context: DataContext) => {
              const customer = context.testData.customers[0];
              expect(customer).toBeDefined();
              expect(customer.id).toBeDefined();
              expect(customer.name).toBeDefined();
            }
          },
          {
            keyword: 'Then',
            text: 'I should see valid customer data',
            execute: async (context: DataContext) => {
              const report = await integrityValidator.validateTestData(context.testData);
              expect(report.isValid).toBe(true);
            }
          },
          {
            keyword: 'And',
            text: 'the data should be appropriate for the test mode',
            execute: async (context: DataContext) => {
              if (context.mode === TestMode.PRODUCTION) {
                const testCustomers = context.testData.customers.filter(c => c.isTestData);
                expect(testCustomers.length).toBeGreaterThan(0);
                testCustomers.forEach(customer => {
                  expect(customer.name).toMatch(/looneyTunesTest/i);
                });
              } else if (context.mode === TestMode.ISOLATED) {
                expect(context.connectionInfo.isTestConnection).toBe(true);
              }
            }
          }
        ]
      };

      // Execute scenario in both modes
      const modes = [TestMode.ISOLATED, TestMode.PRODUCTION];
      
      for (const mode of modes) {
        console.log(`Executing scenario in ${mode} mode`);
        
        const config = configManager.loadConfig({ mode });
        const contextManager = DataContextFactory.getManager(mode);
        const context = await contextManager.setupContext(mode, config);

        // Execute all steps
        for (const step of scenario.steps) {
          console.log(`  ${step.keyword} ${step.text}`);
          await step.execute(context);
        }

        await contextManager.cleanupContext(context);
      }
    });

    it('should handle error scenarios gracefully across all modes', async () => {
      const errorScenarios = [
        {
          name: 'Invalid database configuration',
          mode: TestMode.ISOLATED,
          setup: (config: TestConfig) => {
            config.databaseConfig!.backupPath = 'non-existent-backup.sql';
          }
        },
        {
          name: 'Missing production configuration',
          mode: TestMode.PRODUCTION,
          setup: (config: TestConfig) => {
            config.productionConfig = undefined;
          }
        }
      ];

      for (const errorScenario of errorScenarios) {
        console.log(`Testing error scenario: ${errorScenario.name}`);
        
        const config = configManager.loadConfig({ mode: errorScenario.mode });
        errorScenario.setup(config);
        
        const contextManager = DataContextFactory.getManager(errorScenario.mode);
        
        await expect(
          contextManager.setupContext(errorScenario.mode, config)
        ).rejects.toThrow();
      }
    });

    it('should maintain performance standards across complete workflow', async () => {
      const performanceTargets = {
        modeDetection: 100, // 100ms
        configLoading: 500, // 500ms
        contextSetup: 10000, // 10 seconds
        dataValidation: 2000, // 2 seconds
        cleanup: 3000 // 3 seconds
      };

      const testContext: TestContext = {
        testName: 'Performance validation test',
        tags: ['@isolated', '@performance'],
        testId: 'perf-validation-001'
      };

      // Measure mode detection
      let startTime = Date.now();
      const detectionResult = modeDetector.detectMode(testContext);
      const detectionTime = Date.now() - startTime;
      expect(detectionTime).toBeLessThan(performanceTargets.modeDetection);

      // Measure config loading
      startTime = Date.now();
      const config = configManager.loadConfig({ mode: detectionResult.mode });
      const configTime = Date.now() - startTime;
      expect(configTime).toBeLessThan(performanceTargets.configLoading);

      // Measure context setup
      startTime = Date.now();
      const contextManager = DataContextFactory.getManager(detectionResult.mode);
      const context = await contextManager.setupContext(detectionResult.mode, config);
      const setupTime = Date.now() - startTime;
      expect(setupTime).toBeLessThan(performanceTargets.contextSetup);

      // Measure data validation
      startTime = Date.now();
      const report = await integrityValidator.validateTestData(context.testData);
      const validationTime = Date.now() - startTime;
      expect(validationTime).toBeLessThan(performanceTargets.dataValidation);
      expect(report.isValid).toBe(true);

      // Measure cleanup
      startTime = Date.now();
      await contextManager.cleanupContext(context);
      const cleanupTime = Date.now() - startTime;
      expect(cleanupTime).toBeLessThan(performanceTargets.cleanup);

      console.log('Performance Metrics:', {
        detectionTime,
        configTime,
        setupTime,
        validationTime,
        cleanupTime
      });
    });
  });
});
    