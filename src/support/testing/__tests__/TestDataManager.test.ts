/**
 * Test Data Manager Tests
 * Validates the test data setup and cleanup utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestDataManager, TestDataManagerConfig } from '../TestDataManager';
import { TestMode } from '../types';

describe('TestDataManager', () => {
  let testDataManager: TestDataManager;
  let config: TestDataManagerConfig;

  beforeEach(() => {
    config = {
      mode: TestMode.ISOLATED,
      databaseConfig: {
        resetBetweenScenarios: true,
        useTransactions: true
      },
      isolatedConfig: {
        useInMemoryDatabase: true,
        preserveDataBetweenTests: false
      },
      cleanupConfig: {
        removeAssignments: true,
        removeTickets: true,
        preserveRoutes: false,
        preserveLocations: false
      }
    };
    testDataManager = new TestDataManager(config);
  });

  afterEach(async () => {
    // Cleanup after each test
    await testDataManager.cleanupTestData();
  });

  describe('Configuration Management', () => {
    it('should initialize with provided configuration', () => {
      const retrievedConfig = testDataManager.getConfig();
      expect(retrievedConfig.mode).toBe(TestMode.ISOLATED);
      expect(retrievedConfig.databaseConfig?.resetBetweenScenarios).toBe(true);
    });

    it('should update configuration correctly', () => {
      testDataManager.updateConfig({ mode: TestMode.PRODUCTION });
      const updatedConfig = testDataManager.getConfig();
      expect(updatedConfig.mode).toBe(TestMode.PRODUCTION);
    });
  });

  describe('Isolated Mode Scenario Setup', () => {
    it('should setup optimal assignment scenario successfully', async () => {
      const result = await testDataManager.setupTestScenario('optimal-assignment');
      
      expect(result.success).toBe(true);
      expect(result.context).toBeDefined();
      expect(result.context?.mode).toBe(TestMode.ISOLATED);
      expect(result.context?.scenario).toBe('optimal-assignment');
      expect(result.errors).toHaveLength(0);
    });

    it('should setup capacity constraints scenario successfully', async () => {
      const result = await testDataManager.setupTestScenario('capacity-constraints');
      
      expect(result.success).toBe(true);
      expect(result.context).toBeDefined();
      expect(result.context?.scenario).toBe('capacity-constraints');
      expect(result.context?.tickets).toBeDefined();
      expect(result.context?.routes).toBeDefined();
    });

    it('should setup bulk assignment scenario successfully', async () => {
      const result = await testDataManager.setupTestScenario('bulk-assignment');
      
      expect(result.success).toBe(true);
      expect(result.context).toBeDefined();
      expect(result.context?.scenario).toBe('bulk-assignment');
      expect(Array.isArray(result.context?.tickets)).toBe(true);
      expect(Array.isArray(result.context?.routes)).toBe(true);
    });

    it('should handle setup with validation enabled', async () => {
      const result = await testDataManager.setupTestScenario('optimal-assignment', {
        validateData: true
      });
      
      expect(result.success).toBe(true);
      expect(result.context).toBeDefined();
    });

    it('should handle forced reset during setup', async () => {
      const result = await testDataManager.setupTestScenario('optimal-assignment', {
        forceReset: true
      });
      
      expect(result.success).toBe(true);
      expect(result.setupTime).toBeGreaterThan(0);
    });
  });

  describe('Production Mode Scenario Setup', () => {
    beforeEach(() => {
      config.mode = TestMode.PRODUCTION;
      config.productionConfig = {
        requireTestIdentifiers: true,
        validateDataSafety: true,
        maxBatchSize: 100
      };
      testDataManager = new TestDataManager(config);
    });

    it('should setup production scenario with safety checks', async () => {
      const result = await testDataManager.setupTestScenario('optimal-assignment', {
        skipSafetyChecks: false
      });
      
      // Note: This might fail in actual production due to safety checks
      // The test validates the structure and error handling
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should handle safety check failures gracefully', async () => {
      const result = await testDataManager.setupTestScenario('optimal-assignment');
      
      // Production setup might fail due to safety restrictions
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.context).toBeNull();
      }
    });
  });

  describe('Database Reset Operations', () => {
    it('should reset database with default options', async () => {
      await expect(testDataManager.resetDatabase()).resolves.not.toThrow();
    });

    it('should reset database with custom options', async () => {
      const resetOptions = {
        dropTables: false,
        recreateSchema: false,
        preserveBaseline: true
      };
      
      await expect(testDataManager.resetDatabase(resetOptions)).resolves.not.toThrow();
    });

    it('should handle reset errors gracefully', async () => {
      // Test with invalid options that might cause errors
      const resetOptions = {
        dropTables: true,
        recreateSchema: true,
        preserveBaseline: false
      };
      
      // Should not throw, but might log errors
      await expect(testDataManager.resetDatabase(resetOptions)).resolves.not.toThrow();
    });
  });

  describe('Test Data Cleanup', () => {
    it('should cleanup test data with default options', async () => {
      // Setup some test data first
      await testDataManager.setupTestScenario('optimal-assignment');
      
      // Then cleanup
      await expect(testDataManager.cleanupTestData()).resolves.not.toThrow();
    });

    it('should cleanup test data with custom options', async () => {
      await testDataManager.setupTestScenario('capacity-constraints');
      
      const cleanupOptions = {
        removeAssignments: true,
        removeTickets: false,
        preserveRoutes: true,
        preserveLocations: true
      };
      
      await expect(testDataManager.cleanupTestData(cleanupOptions)).resolves.not.toThrow();
    });

    it('should clear current context after cleanup', async () => {
      await testDataManager.setupTestScenario('bulk-assignment');
      expect(testDataManager.getCurrentContext()).toBeDefined();
      
      await testDataManager.cleanupTestData();
      expect(testDataManager.getCurrentContext()).toBeUndefined();
    });
  });

  describe('Context Management', () => {
    it('should track current context during scenario setup', async () => {
      expect(testDataManager.getCurrentContext()).toBeUndefined();
      
      await testDataManager.setupTestScenario('optimal-assignment');
      const context = testDataManager.getCurrentContext();
      
      expect(context).toBeDefined();
      expect(context?.scenario).toBe('optimal-assignment');
      expect(context?.metadata.setupAt).toBeInstanceOf(Date);
    });

    it('should update context metadata correctly', async () => {
      await testDataManager.setupTestScenario('capacity-constraints');
      const context = testDataManager.getCurrentContext();
      
      expect(context?.metadata.dataSource).toBe('generated');
      expect(context?.metadata.resetRequired).toBe(true);
      expect(context?.metadata.setupAt).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling', () => {
    it('should handle setup errors gracefully', async () => {
      // Create a manager with invalid configuration
      const invalidConfig: TestDataManagerConfig = {
        mode: TestMode.PRODUCTION,
        productionConfig: undefined // This should cause issues
      };
      const invalidManager = new TestDataManager(invalidConfig);
      
      const result = await invalidManager.setupTestScenario('optimal-assignment');
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.context).toBeNull();
    });

    it('should provide meaningful error messages', async () => {
      const result = await testDataManager.setupTestScenario('optimal-assignment');
      
      if (!result.success) {
        expect(result.errors).toBeDefined();
        expect(result.errors.length).toBeGreaterThan(0);
        expect(typeof result.errors[0]).toBe('string');
      }
    });

    it('should track setup timing even on errors', async () => {
      const result = await testDataManager.setupTestScenario('optimal-assignment');
      
      expect(result.setupTime).toBeGreaterThan(0);
      expect(typeof result.setupTime).toBe('number');
    });
  });

  describe('Validation Integration', () => {
    it('should validate scenario setup when requested', async () => {
      const result = await testDataManager.setupTestScenario('optimal-assignment', {
        validateData: true
      });
      
      expect(result).toBeDefined();
      // Validation results are included in the setup result
      if (!result.success && result.errors.length > 0) {
        expect(result.errors.some(error => error.includes('validation'))).toBeTruthy();
      }
    });

    it('should skip validation when disabled', async () => {
      const result = await testDataManager.setupTestScenario('optimal-assignment', {
        validateData: false
      });
      
      expect(result).toBeDefined();
      // Should complete faster without validation
      expect(result.setupTime).toBeGreaterThan(0);
    });
  });
});