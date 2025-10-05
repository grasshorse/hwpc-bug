/**
 * End-to-End Validation Tests
 * 
 * Tests that validate the complete dual testing architecture with real
 * Cucumber integration, page objects, and full workflow execution.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestModeDetector } from '../TestModeDetector';
import { DataContextFactory } from '../DataContextFactory';
import { TestConfigManager } from '../TestConfigManager';
import { DataIntegrityValidator } from '../DataIntegrityValidator';
import { DatabaseContextManager } from '../DatabaseContextManager';
import { TestMode, TestContext, TestConfig, DataContext } from '../types';

// Mock Cucumber-like environment
interface CucumberScenario {
  name: string;
  tags: string[];
  steps: CucumberStep[];
  world?: any;
}

interface CucumberStep {
  keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';
  text: string;
  execute: (world: any, context: DataContext) => Promise<void>;
}

describe('End-to-End Dual-Mode Validation', () => {
  let modeDetector: TestModeDetector;
  let configManager: TestConfigManager;
  let integrityValidator: DataIntegrityValidator;
  let dbContextManager: DatabaseContextManager;

  beforeEach(() => {
    modeDetector = new TestModeDetector();
    configManager = TestConfigManager.getInstance();
    integrityValidator = new DataIntegrityValidator();
    dbContextManager = new DatabaseContextManager();
    
    // Reset environment
    delete process.env.TEST_MODE;
    delete process.env.NODE_ENV;
    configManager.clearCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Cucumber Integration', () => {
    it('should execute a complete isolated mode scenario with Cucumber-like flow', async () => {
      // Arrange - Set up isolated mode scenario
      process.env.TEST_MODE = 'isolated';
      
      const scenario: CucumberScenario = {
        name: 'Navigate to customer page in isolated mode',
        tags: ['@isolated', '@navigation', '@e2e'],
        steps: [
          {
            keyword: 'Given',
            text: 'I am on the dashboard page with test data loaded',
            execute: async (world, context) => {
              expect(context.mode).toBe(TestMode.ISOLATED);
              expect(context.testData.customers.length).toBeGreaterThan(0);
              world.currentPage = 'dashboard';
              world.testData = context.testData;
            }
          },
          {
            keyword: 'When',
            text: 'I navigate to the customers page',
            execute: async (world, context) => {
              const testCustomer = context.testData.customers[0];
              expect(testCustomer).toBeDefined();
              expect(testCustomer.id).toBeDefined();
              world.currentPage = 'customers';
              world.selectedCustomer = testCustomer;
            }
          },
          {
            keyword: 'Then',
            text: 'I should see the customer list with test data',
            execute: async (world, context) => {
              expect(world.currentPage).toBe('customers');
              expect(world.testData.customers.length).toBeGreaterThan(0);
              
              // Validate data integrity
              const report = await integrityValidator.validateTestData(context.testData);
              expect(report.isValid).toBe(true);
            }
          },
          {
            keyword: 'And',
            text: 'the data should be properly isolated from production',
            execute: async (world, context) => {
              // Verify all customers are marked as test data
              const testCustomers = context.testData.customers.filter(c => c.isTestData);
              expect(testCustomers.length).toBe(context.testData.customers.length);
              
              // Verify connection is to test database
              expect(context.connectionInfo.isTestConnection).toBe(true);
            }
          }
        ],
        world: {}
      };

      // Act - Execute complete E2E workflow
      const testContext: TestContext = {
        testName: scenario.name,
        tags: scenario.tags,
        testId: `e2e-isolated-${Date.now()}`
      };

      // 1. Mode Detection
      const detectionResult = modeDetector.detectMode(testContext);
      expect(detectionResult.mode).toBe(TestMode.ISOLATED);
      expect(detectionResult.confidence).toBe(1.0);

      // 2. Configuration Loading
      const config = configManager.loadConfig({ mode: TestMode.ISOLATED });
      expect(config.mode).toBe(TestMode.ISOLATED);

      // 3. Context Setup
      const contextManager = DataContextFactory.getManager(TestMode.ISOLATED);
      const context = await contextManager.setupContext(TestMode.ISOLATED, config);
      expect(context.mode).toBe(TestMode.ISOLATED);

      // 4. Execute Cucumber Steps
      for (const step of scenario.steps) {
        console.log(`Executing: ${step.keyword} ${step.text}`);
        await step.execute(scenario.world, context);
      }

      // 5. Final Validation
      const finalValidation = await contextManager.validateContext(context);
      expect(finalValidation).toBe(true);

      // 6. Cleanup
      await contextManager.cleanupContext(context);
    });

    it('should execute a complete production mode scenario with Cucumber-like flow', async () => {
      // Arrange - Set up production mode scenario
      process.env.TEST_MODE = 'production';
      
      const scenario: CucumberScenario = {
        name: 'Create and manage test ticket in production',
        tags: ['@production', '@api', '@e2e'],
        steps: [
          {
            keyword: 'Given',
            text: 'I have access to production test data',
            execute: async (world, context) => {
              expect(context.mode).toBe(TestMode.PRODUCTION);
              const testCustomers = context.testData.customers.filter(c => c.isTestData);
              expect(testCustomers.length).toBeGreaterThan(0);
              world.testCustomers = testCustomers;
            }
          },
          {
            keyword: 'When',
            text: 'I create a ticket for a looneyTunes test customer',
            execute: async (world, context) => {
              const testCustomer = context.testData.customers.find(c => 
                c.isTestData && c.name.includes('looneyTunesTest')
              );
              const testRoute = context.testData.routes.find(r => r.isTestData);
              
              expect(testCustomer).toBeDefined();
              expect(testRoute).toBeDefined();
              expect(['Cedar Falls', 'Winfield', "O'Fallon"]).toContain(testRoute!.location);
              
              world.selectedCustomer = testCustomer;
              world.selectedRoute = testRoute;
            }
          },
          {
            keyword: 'Then',
            text: 'the ticket should be created with proper test data marking',
            execute: async (world, context) => {
              const testTickets = context.testData.tickets.filter(t => t.isTestData);
              expect(testTickets.length).toBeGreaterThan(0);
              
              // Verify ticket references test entities
              const ticket = testTickets[0];
              const customer = context.testData.customers.find(c => c.id === ticket.customerId);
              const route = context.testData.routes.find(r => r.id === ticket.routeId);
              
              expect(customer?.isTestData).toBe(true);
              expect(route?.isTestData).toBe(true);
            }
          },
          {
            keyword: 'And',
            text: 'the test data should be easily identifiable by operators',
            execute: async (world, context) => {
              const testCustomers = context.testData.customers.filter(c => c.isTestData);
              testCustomers.forEach(customer => {
                expect(customer.name).toMatch(/looneyTunesTest|Bugs Bunny|Daffy Duck|Porky Pig/i);
              });
            }
          }
        ],
        world: {}
      };

      // Act - Execute production E2E workflow
      const testContext: TestContext = {
        testName: scenario.name,
        tags: scenario.tags,
        testId: `e2e-production-${Date.now()}`
      };

      const detectionResult = modeDetector.detectMode(testContext);
      expect(detectionResult.mode).toBe(TestMode.PRODUCTION);

      const config = configManager.loadConfig({ mode: TestMode.PRODUCTION });
      const contextManager = DataContextFactory.getManager(TestMode.PRODUCTION);
      const context = await contextManager.setupContext(TestMode.PRODUCTION, config);

      // Execute steps
      for (const step of scenario.steps) {
        console.log(`Executing: ${step.keyword} ${step.text}`);
        await step.execute(scenario.world, context);
      }

      // Cleanup
      await contextManager.cleanupContext(context);
    });

    it('should handle dual mode scenario with fallback logic', async () => {
      // Arrange - Set up dual mode scenario
      process.env.TEST_MODE = 'dual';
      
      const scenario: CucumberScenario = {
        name: 'Cross-environment data validation with fallback',
        tags: ['@dual', '@integration', '@e2e'],
        steps: [
          {
            keyword: 'Given',
            text: 'I am running a test that supports both modes',
            execute: async (world, context) => {
              expect([TestMode.ISOLATED, TestMode.PRODUCTION]).toContain(context.mode);
              world.actualMode = context.mode;
            }
          },
          {
            keyword: 'When',
            text: 'I validate data consistency across environments',
            execute: async (world, context) => {
              const report = await integrityValidator.validateTestData(context.testData);
              expect(report.isValid).toBe(true);
              world.validationReport = report;
            }
          },
          {
            keyword: 'Then',
            text: 'the test should work regardless of the actual mode used',
            execute: async (world, context) => {
              expect(context.testData.customers.length).toBeGreaterThan(0);
              expect(context.testData.routes.length).toBeGreaterThan(0);
              expect(world.validationReport.isValid).toBe(true);
            }
          }
        ],
        world: {}
      };

      // Act - Execute dual mode workflow
      const testContext: TestContext = {
        testName: scenario.name,
        tags: scenario.tags,
        testId: `e2e-dual-${Date.now()}`
      };

      const detectionResult = modeDetector.detectMode(testContext);
      expect(detectionResult.mode).toBe(TestMode.DUAL);

      // Try isolated mode first (dual mode fallback logic)
      try {
        const isolatedConfig = configManager.loadConfig({ mode: TestMode.ISOLATED });
        const isolatedManager = DataContextFactory.getManager(TestMode.ISOLATED);
        const isolatedContext = await isolatedManager.setupContext(TestMode.ISOLATED, isolatedConfig);

        for (const step of scenario.steps) {
          await step.execute(scenario.world, isolatedContext);
        }

        await isolatedManager.cleanupContext(isolatedContext);
      } catch (error) {
        // Fallback to production mode
        console.log('Isolated mode failed, falling back to production mode');
        
        const productionConfig = configManager.loadConfig({ mode: TestMode.PRODUCTION });
        const productionManager = DataContextFactory.getManager(TestMode.PRODUCTION);
        const productionContext = await productionManager.setupContext(TestMode.PRODUCTION, productionConfig);

        for (const step of scenario.steps) {
          await step.execute(scenario.world, productionContext);
        }

        await productionManager.cleanupContext(productionContext);
      }
    });
  });

  describe('Page Object Integration', () => {
    it('should integrate with page objects for navigation testing', async () => {
      // Mock page object
      class MockNavigationPage {
        constructor(private context: DataContext) {}

        async navigateToCustomers(): Promise<void> {
          expect(this.context.testData.customers.length).toBeGreaterThan(0);
        }

        async selectCustomer(customerId: string): Promise<void> {
          const customer = this.context.testData.customers.find(c => c.id === customerId);
          expect(customer).toBeDefined();
        }

        async verifyCustomerData(): Promise<boolean> {
          return this.context.testData.customers.every(c => c.id && c.name && c.email);
        }
      }

      // Set up isolated mode
      process.env.TEST_MODE = 'isolated';
      const config = configManager.loadConfig({ mode: TestMode.ISOLATED });
      const contextManager = DataContextFactory.getManager(TestMode.ISOLATED);
      const context = await contextManager.setupContext(TestMode.ISOLATED, config);

      // Use page object with context
      const navigationPage = new MockNavigationPage(context);
      
      await navigationPage.navigateToCustomers();
      
      if (context.testData.customers.length > 0) {
        await navigationPage.selectCustomer(context.testData.customers[0].id);
      }
      
      const isValid = await navigationPage.verifyCustomerData();
      expect(isValid).toBe(true);

      await contextManager.cleanupContext(context);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle context setup failures with meaningful error messages', async () => {
      const config = configManager.loadConfig({ mode: TestMode.ISOLATED });
      
      // Simulate invalid database configuration
      config.databaseConfig!.connectionString = 'invalid://connection';
      
      const contextManager = DataContextFactory.getManager(TestMode.ISOLATED);
      
      await expect(
        contextManager.setupContext(TestMode.ISOLATED, config)
      ).rejects.toThrow();
    });

    it('should provide detailed error information for debugging', async () => {
      const testContext: TestContext = {
        testName: 'Error handling test',
        tags: ['@isolated'],
        testId: 'error-test-001'
      };

      // Test with invalid environment
      process.env.TEST_MODE = 'invalid-mode';
      
      const detectionResult = modeDetector.detectMode(testContext);
      expect(detectionResult.mode).toBe(TestMode.ISOLATED); // Should fallback
      expect(detectionResult.fallbackReason).toContain('Invalid TEST_MODE value');
    });

    it('should handle cleanup failures gracefully', async () => {
      const config = configManager.loadConfig({ mode: TestMode.ISOLATED });
      const contextManager = DataContextFactory.getManager(TestMode.ISOLATED);
      const context = await contextManager.setupContext(TestMode.ISOLATED, config);

      // Mock cleanup failure
      const originalCleanup = context.cleanup;
      context.cleanup = vi.fn().mockRejectedValue(new Error('Cleanup failed'));

      // Cleanup should not throw but should log the error
      await expect(contextManager.cleanupContext(context)).rejects.toThrow('Cleanup failed');
    });
  });

  describe('Performance and Resource Management', () => {
    it('should complete full workflow within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const config = configManager.loadConfig({ mode: TestMode.ISOLATED });
      const contextManager = DataContextFactory.getManager(TestMode.ISOLATED);
      const context = await contextManager.setupContext(TestMode.ISOLATED, config);
      
      // Simulate test execution
      const report = await integrityValidator.validateTestData(context.testData);
      expect(report.isValid).toBe(true);
      
      await contextManager.cleanupContext(context);
      
      const totalTime = Date.now() - startTime;
      
      // Full E2E workflow should complete within reasonable time
      expect(totalTime).toBeLessThan(30000); // 30 seconds
      
      console.log(`Full E2E workflow execution time: ${totalTime}ms`);
    });

    it('should handle multiple concurrent scenarios', async () => {
      const concurrentScenarios = 3;
      const startTime = Date.now();
      
      const scenarioPromises = Array.from({ length: concurrentScenarios }, async (_, index) => {
        const config = configManager.loadConfig({ mode: TestMode.ISOLATED });
        const contextManager = DataContextFactory.getManager(TestMode.ISOLATED);
        const context = await contextManager.setupContext(TestMode.ISOLATED, config);
        
        const report = await integrityValidator.validateTestData(context.testData);
        expect(report.isValid).toBe(true);
        
        await contextManager.cleanupContext(context);
        
        return { index, success: true };
      });

      const results = await Promise.all(scenarioPromises);
      const totalTime = Date.now() - startTime;
      
      // All scenarios should complete successfully
      expect(results.length).toBe(concurrentScenarios);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      // Concurrent execution should not take excessively long
      expect(totalTime).toBeLessThan(60000); // 60 seconds
      
      console.log(`Concurrent scenarios (${concurrentScenarios}) execution time: ${totalTime}ms`);
    });
  });
})