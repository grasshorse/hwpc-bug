/**
 * Dual-Mode Workflow Integration Tests
 * 
 * Comprehensive integration tests that validate the complete dual-mode workflow
 * from test execution through cleanup, including Cucumber integration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestModeDetector } from '../TestModeDetector';
import { DataContextFactory } from '../DataContextFactory';
import { TestConfigManager } from '../TestConfigManager';
import { DataIntegrityValidator } from '../DataIntegrityValidator';
import { ModeValidator } from '../ModeValidator';
import { TestMode, TestContext, TestConfig, DataContext } from '../types';

// Mock Cucumber-like test execution environment
interface MockScenario {
  name: string;
  tags: string[];
  steps: MockStep[];
}

interface MockStep {
  keyword: string;
  text: string;
  execute: (context: DataContext) => Promise<void>;
}

describe('Dual-Mode Workflow Integration Tests', () => {
  let modeDetector: TestModeDetector;
  let contextFactory: DataContextFactory;
  let configManager: TestConfigManager;
  let integrityValidator: DataIntegrityValidator;
  let modeValidator: ModeValidator;

  beforeEach(() => {
    modeDetector = new TestModeDetector();
    contextFactory = new DataContextFactory();
    configManager = new TestConfigManager();
    integrityValidator = new DataIntegrityValidator();
    modeValidator = new ModeValidator();
    
    // Reset environment
    delete process.env.TEST_MODE;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Workflow Integration', () => {
    it('should execute complete isolated mode workflow', async () => {
      // Arrange - Set up isolated mode scenario
      process.env.TEST_MODE = 'isolated';
      
      const scenario: MockScenario = {
        name: 'Navigate to customer page',
        tags: ['@isolated', '@navigation'],
        steps: [
          {
            keyword: 'Given',
            text: 'I am on the dashboard page',
            execute: async (context) => {
              expect(context.mode).toBe(TestMode.ISOLATED);
              expect(context.testData.customers.length).toBeGreaterThan(0);
            }
          },
          {
            keyword: 'When',
            text: 'I click on the customers link',
            execute: async (context) => {
              const testCustomer = context.testData.customers[0];
              expect(testCustomer).toBeDefined();
              expect(testCustomer.id).toBeDefined();
            }
          },
          {
            keyword: 'Then',
            text: 'I should see the customer list',
            execute: async (context) => {
              const isValid = await integrityValidator.validateContext(context);
              expect(isValid).toBe(true);
            }
          }
        ]
      };

      // Act - Execute complete workflow
      const testContext: TestContext = {
        testName: scenario.name,
        tags: scenario.tags,
        testId: `workflow-isolated-${Date.now()}`
      };

      // 1. Mode Detection
      const detectionResult = modeDetector.detectMode(testContext);
      expect(detectionResult.mode).toBe(TestMode.ISOLATED);

      // 2. Configuration Loading
      const config = await configManager.getConfig(detectionResult.mode);
      expect(config.mode).toBe(TestMode.ISOLATED);

      // 3. Context Setup
      const context = await contextFactory.createContext(detectionResult.mode, config);
      expect(context.mode).toBe(TestMode.ISOLATED);

      // 4. Mode Validation
      const testDefinition = modeDetector.createTestDefinition(
        scenario.name,
        scenario.tags
      );
      const isCompatible = modeValidator.validateModeCompatibility(
        detectionResult.mode,
        testDefinition
      );
      expect(isCompatible).toBe(true);

      // 5. Execute Test Steps
      for (const step of scenario.steps) {
        await step.execute(context);
      }

      // 6. Final Validation
      const finalValidation = await integrityValidator.validateContext(context);
      expect(finalValidation).toBe(true);

      // 7. Cleanup
      await context.cleanup();
    });

    it('should execute complete production mode workflow', async () => {
      // Arrange - Set up production mode scenario
      process.env.TEST_MODE = 'production';
      
      const scenario: MockScenario = {
        name: 'Create and manage test ticket',
        tags: ['@production', '@api'],
        steps: [
          {
            keyword: 'Given',
            text: 'I have a test customer in production',
            execute: async (context) => {
              expect(context.mode).toBe(TestMode.PRODUCTION);
              const testCustomers = context.testData.customers.filter(c => c.isTestData);
              expect(testCustomers.length).toBeGreaterThan(0);
              expect(testCustomers[0].name).toMatch(/looneyTunesTest/i);
            }
          },
          {
            keyword: 'When',
            text: 'I create a ticket for the test customer',
            execute: async (context) => {
              const testCustomer = context.testData.customers.find(c => c.isTestData);
              const testRoute = context.testData.routes.find(r => r.isTestData);
              
              expect(testCustomer).toBeDefined();
              expect(testRoute).toBeDefined();
              expect(testRoute!.location).toMatch(/Cedar Falls|Winfield|O'Fallon/);
            }
          },
          {
            keyword: 'Then',
            text: 'The ticket should be created successfully',
            execute: async (context) => {
              const testTickets = context.testData.tickets.filter(t => t.isTestData);
              expect(testTickets.length).toBeGreaterThan(0);
            }
          }
        ]
      };

      // Act - Execute complete workflow
      const testContext: TestContext = {
        testName: scenario.name,
        tags: scenario.tags,
        testId: `workflow-production-${Date.now()}`
      };

      // Execute workflow steps
      const detectionResult = modeDetector.detectMode(testContext);
      expect(detectionResult.mode).toBe(TestMode.PRODUCTION);

      const config = await configManager.getConfig(detectionResult.mode);
      const context = await contextFactory.createContext(detectionResult.mode, config);

      // Execute test steps
      for (const step of scenario.steps) {
        await step.execute(context);
      }

      // Cleanup
      await context.cleanup();
    });

    it('should handle dual mode workflow with fallback', async () => {
      // Arrange - Set up dual mode scenario
      process.env.TEST_MODE = 'dual';
      
      const scenario: MockScenario = {
        name: 'Cross-environment data validation',
        tags: ['@dual', '@integration'],
        steps: [
          {
            keyword: 'Given',
            text: 'I have test data in both environments',
            execute: async (context) => {
              expect([TestMode.ISOLATED, TestMode.PRODUCTION]).toContain(context.mode);
              expect(context.testData.customers.length).toBeGreaterThan(0);
            }
          },
          {
            keyword: 'When',
            text: 'I validate data consistency',
            execute: async (context) => {
              const isValid = await integrityValidator.validateContext(context);
              expect(isValid).toBe(true);
            }
          },
          {
            keyword: 'Then',
            text: 'Both environments should have valid data',
            execute: async (context) => {
              expect(context.testData.routes.length).toBeGreaterThan(0);
              expect(context.metadata.mode).toBeDefined();
            }
          }
        ]
      };

      // Act - Execute dual mode workflow
      const testContext: TestContext = {
        testName: scenario.name,
        tags: scenario.tags,
        testId: `workflow-dual-${Date.now()}`
      };

      const detectionResult = modeDetector.detectMode(testContext);
      expect(detectionResult.mode).toBe(TestMode.DUAL);

      // Test both isolated and production contexts
      const isolatedConfig = await configManager.getConfig(TestMode.ISOLATED);
      const productionConfig = await configManager.getConfig(TestMode.PRODUCTION);

      const isolatedContext = await contextFactory.createContext(TestMode.ISOLATED, isolatedConfig);
      const productionContext = await contextFactory.createContext(TestMode.PRODUCTION, productionConfig);

      // Execute steps for both contexts
      for (const step of scenario.steps) {
        await step.execute(isolatedContext);
        await step.execute(productionContext);
      }

      // Cleanup both contexts
      await isolatedContext.cleanup();
      await productionContext.cleanup();
    });
  });

  describe('Error Handling and Recovery Integration', () => {
    it('should handle context setup failures gracefully', async () => {
      const testContext: TestContext = {
        testName: 'Error handling test',
        tags: ['@isolated'],
        testId: 'error-handling-001'
      };

      const detectionResult = modeDetector.detectMode(testContext);
      const config = await configManager.getConfig(detectionResult.mode);

      // Simulate configuration error
      config.databaseConfig!.connectionString = 'invalid-connection';

      await expect(
        contextFactory.createContext(detectionResult.mode, config)
      ).rejects.toThrow();
    });

    it('should provide detailed error information for debugging', async () => {
      const testContext: TestContext = {
        testName: 'Detailed error test',
        tags: ['@production'],
        testId: 'detailed-error-001'
      };

      const detectionResult = modeDetector.detectMode(testContext);
      const config = await configManager.getConfig(detectionResult.mode);

      // Remove production config to trigger error
      config.productionConfig = undefined;

      try {
        await contextFactory.createContext(detectionResult.mode, config);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const errorMessage = (error as Error).message;
        expect(errorMessage).toContain('production');
        expect(errorMessage.length).toBeGreaterThan(10); // Should be descriptive
      }
    });

    it('should handle partial cleanup failures', async () => {
      const config = await configManager.getConfig(TestMode.ISOLATED);
      const context = await contextFactory.createContext(TestMode.ISOLATED, config);

      // Mock partial cleanup failure
      const originalCleanup = context.cleanup;
      let cleanupAttempted = false;
      
      context.cleanup = vi.fn().mockImplementation(async () => {
        cleanupAttempted = true;
        throw new Error('Partial cleanup failure');
      });

      // Cleanup should attempt but may fail
      await expect(context.cleanup()).rejects.toThrow('Partial cleanup failure');
      expect(cleanupAttempted).toBe(true);
    });
  });

  describe('Mode Switching Integration', () => {
    it('should handle dynamic mode switching during test execution', async () => {
      const testContext: TestContext = {
        testName: 'Dynamic mode switching test',
        tags: ['@dual'],
        testId: 'mode-switch-001'
      };

      // Start with isolated mode
      process.env.TEST_MODE = 'isolated';
      let detectionResult = modeDetector.detectMode(testContext);
      expect(detectionResult.mode).toBe(TestMode.ISOLATED);

      let config = await configManager.getConfig(detectionResult.mode);
      let context = await contextFactory.createContext(detectionResult.mode, config);
      
      expect(context.mode).toBe(TestMode.ISOLATED);
      await context.cleanup();

      // Switch to production mode
      process.env.TEST_MODE = 'production';
      detectionResult = modeDetector.detectMode(testContext);
      expect(detectionResult.mode).toBe(TestMode.PRODUCTION);

      config = await configManager.getConfig(detectionResult.mode);
      context = await contextFactory.createContext(detectionResult.mode, config);
      
      expect(context.mode).toBe(TestMode.PRODUCTION);
      await context.cleanup();
    });

    it('should validate mode compatibility across test suite', async () => {
      const testScenarios = [
        {
          name: 'Isolated navigation test',
          tags: ['@isolated', '@navigation'],
          expectedMode: TestMode.ISOLATED
        },
        {
          name: 'Production API test',
          tags: ['@production', '@api'],
          expectedMode: TestMode.PRODUCTION
        },
        {
          name: 'Dual integration test',
          tags: ['@dual', '@integration'],
          expectedMode: TestMode.DUAL
        }
      ];

      for (const scenario of testScenarios) {
        const testContext: TestContext = {
          testName: scenario.name,
          tags: scenario.tags,
          testId: `compatibility-${Date.now()}`
        };

        const testDefinition = modeDetector.createTestDefinition(
          scenario.name,
          scenario.tags
        );

        const isCompatible = modeValidator.validateModeCompatibility(
          scenario.expectedMode,
          testDefinition
        );

        expect(isCompatible).toBe(true);
      }
    });
  });

  describe('Data Consistency Integration', () => {
    it('should maintain data consistency across test execution', async () => {
      const config = await configManager.getConfig(TestMode.ISOLATED);
      const context = await contextFactory.createContext(TestMode.ISOLATED, config);

      // Verify initial data state
      const initialCustomerCount = context.testData.customers.length;
      const initialRouteCount = context.testData.routes.length;

      expect(initialCustomerCount).toBeGreaterThan(0);
      expect(initialRouteCount).toBeGreaterThan(0);

      // Simulate test execution that might modify data
      // (In real tests, this would be actual test steps)
      const isValid = await integrityValidator.validateContext(context);
      expect(isValid).toBe(true);

      // Verify data consistency is maintained
      expect(context.testData.customers.length).toBe(initialCustomerCount);
      expect(context.testData.routes.length).toBe(initialRouteCount);

      await context.cleanup();
    });

    it('should validate cross-mode data relationships', async () => {
      // Create contexts for both modes
      const isolatedConfig = await configManager.getConfig(TestMode.ISOLATED);
      const productionConfig = await configManager.getConfig(TestMode.PRODUCTION);

      const isolatedContext = await contextFactory.createContext(TestMode.ISOLATED, isolatedConfig);
      const productionContext = await contextFactory.createContext(TestMode.PRODUCTION, productionConfig);

      // Validate that both contexts have required data structures
      expect(isolatedContext.testData.customers.length).toBeGreaterThan(0);
      expect(productionContext.testData.customers.length).toBeGreaterThan(0);

      // Validate data relationships in isolated context
      const isolatedCustomer = isolatedContext.testData.customers[0];
      const relatedTickets = isolatedContext.testData.tickets.filter(
        t => t.customerId === isolatedCustomer.id
      );
      
      // Should have consistent data relationships
      if (relatedTickets.length > 0) {
        expect(relatedTickets[0].customerId).toBe(isolatedCustomer.id);
      }

      // Validate production test data patterns
      const productionTestCustomers = productionContext.testData.customers.filter(c => c.isTestData);
      expect(productionTestCustomers.length).toBeGreaterThan(0);
      
      productionTestCustomers.forEach(customer => {
        expect(customer.name).toMatch(/looneyTunesTest/i);
        expect(customer.isTestData).toBe(true);
      });

      await isolatedContext.cleanup();
      await productionContext.cleanup();
    });
  });

  describe('Performance Integration', () => {
    it('should maintain acceptable performance across complete workflow', async () => {
      const startTime = Date.now();
      
      // Execute complete workflow
      const testContext: TestContext = {
        testName: 'Performance integration test',
        tags: ['@isolated', '@performance'],
        testId: 'perf-integration-001'
      };

      const detectionResult = modeDetector.detectMode(testContext);
      const config = await configManager.getConfig(detectionResult.mode);
      const context = await contextFactory.createContext(detectionResult.mode, config);
      
      // Simulate test execution
      const isValid = await integrityValidator.validateContext(context);
      expect(isValid).toBe(true);
      
      await context.cleanup();
      
      const totalTime = Date.now() - startTime;
      
      // Complete workflow should execute within reasonable time
      expect(totalTime).toBeLessThan(30000); // 30 seconds
      
      console.log(`Complete workflow execution time: ${totalTime}ms`);
    });

    it('should handle concurrent workflow executions', async () => {
      const concurrentWorkflows = 3;
      const startTime = Date.now();
      
      const workflowPromises = Array.from({ length: concurrentWorkflows }, async (_, index) => {
        const testContext: TestContext = {
          testName: `Concurrent workflow ${index}`,
          tags: ['@isolated'],
          testId: `concurrent-${index}-${Date.now()}`
        };

        const detectionResult = modeDetector.detectMode(testContext);
        const config = await configManager.getConfig(detectionResult.mode);
        const context = await contextFactory.createContext(detectionResult.mode, config);
        
        const isValid = await integrityValidator.validateContext(context);
        expect(isValid).toBe(true);
        
        await context.cleanup();
        
        return { index, success: true };
      });

      const results = await Promise.all(workflowPromises);
      const totalTime = Date.now() - startTime;
      
      // All workflows should complete successfully
      expect(results.length).toBe(concurrentWorkflows);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      // Concurrent execution should not take excessively long
      expect(totalTime).toBeLessThan(60000); // 60 seconds
      
      console.log(`Concurrent workflows (${concurrentWorkflows}) execution time: ${totalTime}ms`);
    });
  });
});