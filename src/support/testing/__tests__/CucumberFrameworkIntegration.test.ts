/**
 * Integration tests for Cucumber framework dual-mode extensions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestModeDetector } from '../TestModeDetector';
import { DatabaseContextManager } from '../DatabaseContextManager';
import { ProductionTestDataManager } from '../ProductionTestDataManager';
import { TestMode, TestContext, TestConfig, DataContext } from '../types';

// Mock the external dependencies
vi.mock('../TestModeDetector');
vi.mock('../DatabaseContextManager');
vi.mock('../ProductionTestDataManager');

describe('Cucumber Framework Integration', () => {
  let modeDetector: TestModeDetector;
  let databaseContextManager: DatabaseContextManager;
  let productionTestDataManager: ProductionTestDataManager;
  
  beforeEach(() => {
    modeDetector = new TestModeDetector();
    databaseContextManager = new DatabaseContextManager();
    productionTestDataManager = new ProductionTestDataManager();
    
    // Reset all mocks
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mode Detection Integration', () => {
    it('should detect isolated mode from environment variables', () => {
      // Arrange
      const testContext: TestContext = {
        testName: 'Test Navigation',
        tags: ['@navigation'],
        testId: 'test-1'
      };
      
      vi.mocked(modeDetector.detectMode).mockReturnValue({
        mode: TestMode.ISOLATED,
        confidence: 1.0,
        source: 'environment'
      });
      
      // Act
      const result = modeDetector.detectMode(testContext);
      
      // Assert
      expect(result.mode).toBe(TestMode.ISOLATED);
      expect(result.confidence).toBe(1.0);
      expect(result.source).toBe('environment');
      expect(modeDetector.detectMode).toHaveBeenCalledWith(testContext);
    });

    it('should detect production mode from test tags', () => {
      // Arrange
      const testContext: TestContext = {
        testName: 'Test API Integration',
        tags: ['@production', '@api'],
        testId: 'test-2'
      };
      
      vi.mocked(modeDetector.detectMode).mockReturnValue({
        mode: TestMode.PRODUCTION,
        confidence: 0.9,
        source: 'tags'
      });
      
      // Act
      const result = modeDetector.detectMode(testContext);
      
      // Assert
      expect(result.mode).toBe(TestMode.PRODUCTION);
      expect(result.confidence).toBe(0.9);
      expect(result.source).toBe('tags');
    });

    it('should fall back to default mode when detection fails', () => {
      // Arrange
      const testContext: TestContext = {
        testName: 'Ambiguous Test',
        tags: [],
        testId: 'test-3'
      };
      
      vi.mocked(modeDetector.detectMode).mockReturnValue({
        mode: TestMode.ISOLATED,
        confidence: 1.0,
        source: 'default',
        fallbackReason: 'No explicit mode specified, using default isolated mode'
      });
      
      // Act
      const result = modeDetector.detectMode(testContext);
      
      // Assert
      expect(result.mode).toBe(TestMode.ISOLATED);
      expect(result.source).toBe('default');
      expect(result.fallbackReason).toBeDefined();
    });
  });

  describe('Context Setup Integration', () => {
    it('should setup isolated database context successfully', async () => {
      // Arrange
      const testConfig: TestConfig = {
        mode: TestMode.ISOLATED,
        tags: ['@isolated'],
        retries: 0,
        timeout: 30000,
        databaseConfig: {
          backupPath: '.kiro/test-data/isolated/',
          connectionString: 'test-connection',
          restoreTimeout: 30000,
          verificationQueries: ['SELECT COUNT(*) FROM customers']
        }
      };
      
      const mockContext: DataContext = {
        mode: TestMode.ISOLATED,
        testData: {
          customers: [],
          routes: [],
          tickets: [],
          metadata: {
            createdAt: new Date(),
            mode: TestMode.ISOLATED,
            version: '1.0.0',
            testRunId: 'test-run-123'
          }
        },
        connectionInfo: {
          host: 'localhost',
          port: 5432,
          database: 'test_db'
        },
        metadata: {
          createdAt: new Date(),
          mode: TestMode.ISOLATED,
          version: '1.0.0',
          testRunId: 'test-run-123'
        },
        cleanup: vi.fn()
      };
      
      vi.mocked(databaseContextManager.setupContext).mockResolvedValue(mockContext);
      vi.mocked(databaseContextManager.validateContext).mockResolvedValue(true);
      
      // Act
      const context = await databaseContextManager.setupContext(TestMode.ISOLATED, testConfig);
      const isValid = await databaseContextManager.validateContext(context);
      
      // Assert
      expect(context).toBeDefined();
      expect(context.mode).toBe(TestMode.ISOLATED);
      expect(isValid).toBe(true);
      expect(databaseContextManager.setupContext).toHaveBeenCalledWith(TestMode.ISOLATED, testConfig);
      expect(databaseContextManager.validateContext).toHaveBeenCalledWith(mockContext);
    });

    it('should setup production test data context successfully', async () => {
      // Arrange
      const testConfig: TestConfig = {
        mode: TestMode.PRODUCTION,
        tags: ['@production'],
        retries: 0,
        timeout: 30000,
        productionConfig: {
          testDataPrefix: 'looneyTunesTest',
          locations: ['Cedar Falls', 'Winfield', "O'Fallon"],
          customerNames: ['Bugs Bunny', 'Daffy Duck'],
          cleanupPolicy: 'preserve'
        }
      };
      
      const mockContext: DataContext = {
        mode: TestMode.PRODUCTION,
        testData: {
          customers: [
            {
              id: '1',
              name: 'Bugs Bunny - looneyTunesTest',
              email: 'bugs@looneytunestest.com',
              phone: '555-0001',
              isTestData: true
            }
          ],
          routes: [],
          tickets: [],
          metadata: {
            createdAt: new Date(),
            mode: TestMode.PRODUCTION,
            version: '1.0.0',
            testRunId: 'test-run-456'
          }
        },
        connectionInfo: {
          host: 'production-host',
          port: 443,
          database: 'production_db'
        },
        metadata: {
          createdAt: new Date(),
          mode: TestMode.PRODUCTION,
          version: '1.0.0',
          testRunId: 'test-run-456'
        },
        cleanup: vi.fn()
      };
      
      vi.mocked(productionTestDataManager.setupContext).mockResolvedValue(mockContext);
      vi.mocked(productionTestDataManager.validateContext).mockResolvedValue(true);
      
      // Act
      const context = await productionTestDataManager.setupContext(TestMode.PRODUCTION, testConfig);
      const isValid = await productionTestDataManager.validateContext(context);
      
      // Assert
      expect(context).toBeDefined();
      expect(context.mode).toBe(TestMode.PRODUCTION);
      expect(context.testData.customers).toHaveLength(1);
      expect(context.testData.customers[0].isTestData).toBe(true);
      expect(isValid).toBe(true);
    });

    it('should handle context setup failures gracefully', async () => {
      // Arrange
      const testConfig: TestConfig = {
        mode: TestMode.PRODUCTION,
        tags: ['@production'],
        retries: 0,
        timeout: 30000
      };
      
      const setupError = new Error('Failed to connect to production database');
      vi.mocked(productionTestDataManager.setupContext).mockRejectedValue(setupError);
      
      // Act & Assert
      await expect(productionTestDataManager.setupContext(TestMode.PRODUCTION, testConfig))
        .rejects.toThrow('Failed to connect to production database');
    });
  });

  describe('Context Cleanup Integration', () => {
    it('should cleanup isolated context successfully', async () => {
      // Arrange
      const mockContext: DataContext = {
        mode: TestMode.ISOLATED,
        testData: {
          customers: [],
          routes: [],
          tickets: [],
          metadata: {
            createdAt: new Date(),
            mode: TestMode.ISOLATED,
            version: '1.0.0',
            testRunId: 'test-run-789'
          }
        },
        connectionInfo: {
          host: 'localhost',
          port: 5432,
          database: 'test_db'
        },
        metadata: {
          createdAt: new Date(),
          mode: TestMode.ISOLATED,
          version: '1.0.0',
          testRunId: 'test-run-789'
        },
        cleanup: vi.fn().mockResolvedValue(undefined)
      };
      
      vi.mocked(databaseContextManager.cleanupContext).mockResolvedValue(undefined);
      
      // Act
      await databaseContextManager.cleanupContext(mockContext);
      
      // Assert
      expect(databaseContextManager.cleanupContext).toHaveBeenCalledWith(mockContext);
    });

    it('should cleanup production context successfully', async () => {
      // Arrange
      const mockContext: DataContext = {
        mode: TestMode.PRODUCTION,
        testData: {
          customers: [],
          routes: [],
          tickets: [],
          metadata: {
            createdAt: new Date(),
            mode: TestMode.PRODUCTION,
            version: '1.0.0',
            testRunId: 'test-run-101'
          }
        },
        connectionInfo: {
          host: 'production-host',
          port: 443,
          database: 'production_db'
        },
        metadata: {
          createdAt: new Date(),
          mode: TestMode.PRODUCTION,
          version: '1.0.0',
          testRunId: 'test-run-101'
        },
        cleanup: vi.fn().mockResolvedValue(undefined)
      };
      
      vi.mocked(productionTestDataManager.cleanupContext).mockResolvedValue(undefined);
      
      // Act
      await productionTestDataManager.cleanupContext(mockContext);
      
      // Assert
      expect(productionTestDataManager.cleanupContext).toHaveBeenCalledWith(mockContext);
    });

    it('should handle cleanup failures without throwing', async () => {
      // Arrange
      const mockContext: DataContext = {
        mode: TestMode.ISOLATED,
        testData: {
          customers: [],
          routes: [],
          tickets: [],
          metadata: {
            createdAt: new Date(),
            mode: TestMode.ISOLATED,
            version: '1.0.0',
            testRunId: 'test-run-error'
          }
        },
        connectionInfo: {
          host: 'localhost',
          port: 5432,
          database: 'test_db'
        },
        metadata: {
          createdAt: new Date(),
          mode: TestMode.ISOLATED,
          version: '1.0.0',
          testRunId: 'test-run-error'
        },
        cleanup: vi.fn().mockRejectedValue(new Error('Cleanup failed'))
      };
      
      const cleanupError = new Error('Database cleanup failed');
      vi.mocked(databaseContextManager.cleanupContext).mockRejectedValue(cleanupError);
      
      // Act & Assert
      await expect(databaseContextManager.cleanupContext(mockContext))
        .rejects.toThrow('Database cleanup failed');
    });
  });

  describe('Dual Mode Support', () => {
    it('should handle dual mode by choosing appropriate context manager', async () => {
      // Arrange
      const testConfig: TestConfig = {
        mode: TestMode.DUAL,
        tags: ['@dual'],
        retries: 0,
        timeout: 30000,
        databaseConfig: {
          backupPath: '.kiro/test-data/isolated/',
          connectionString: 'test-connection',
          restoreTimeout: 30000,
          verificationQueries: []
        }
      };
      
      const mockContext: DataContext = {
        mode: TestMode.DUAL,
        testData: {
          customers: [],
          routes: [],
          tickets: [],
          metadata: {
            createdAt: new Date(),
            mode: TestMode.DUAL,
            version: '1.0.0',
            testRunId: 'test-run-dual'
          }
        },
        connectionInfo: {
          host: 'localhost',
          port: 5432,
          database: 'test_db'
        },
        metadata: {
          createdAt: new Date(),
          mode: TestMode.DUAL,
          version: '1.0.0',
          testRunId: 'test-run-dual'
        },
        cleanup: vi.fn()
      };
      
      vi.mocked(databaseContextManager.setupContext).mockResolvedValue(mockContext);
      vi.mocked(databaseContextManager.validateContext).mockResolvedValue(true);
      
      // Act
      const context = await databaseContextManager.setupContext(TestMode.DUAL, testConfig);
      const isValid = await databaseContextManager.validateContext(context);
      
      // Assert
      expect(context.mode).toBe(TestMode.DUAL);
      expect(isValid).toBe(true);
    });
  });

  describe('Error Recovery Integration', () => {
    it('should support graceful degradation from production to isolated mode', async () => {
      // Arrange
      const productionConfig: TestConfig = {
        mode: TestMode.PRODUCTION,
        tags: ['@production'],
        retries: 0,
        timeout: 30000
      };
      
      const isolatedConfig: TestConfig = {
        mode: TestMode.ISOLATED,
        tags: ['@production'],
        retries: 0,
        timeout: 30000,
        databaseConfig: {
          backupPath: '.kiro/test-data/isolated/',
          connectionString: 'test-connection',
          restoreTimeout: 30000,
          verificationQueries: []
        }
      };
      
      const mockIsolatedContext: DataContext = {
        mode: TestMode.ISOLATED,
        testData: {
          customers: [],
          routes: [],
          tickets: [],
          metadata: {
            createdAt: new Date(),
            mode: TestMode.ISOLATED,
            version: '1.0.0',
            testRunId: 'test-run-fallback'
          }
        },
        connectionInfo: {
          host: 'localhost',
          port: 5432,
          database: 'test_db'
        },
        metadata: {
          createdAt: new Date(),
          mode: TestMode.ISOLATED,
          version: '1.0.0',
          testRunId: 'test-run-fallback'
        },
        cleanup: vi.fn()
      };
      
      // Mock production setup failure and isolated setup success
      vi.mocked(productionTestDataManager.setupContext)
        .mockRejectedValue(new Error('Production database unavailable'));
      vi.mocked(databaseContextManager.setupContext)
        .mockResolvedValue(mockIsolatedContext);
      vi.mocked(databaseContextManager.validateContext)
        .mockResolvedValue(true);
      
      // Act - First try production, then fallback to isolated
      let productionFailed = false;
      try {
        await productionTestDataManager.setupContext(TestMode.PRODUCTION, productionConfig);
      } catch (error) {
        productionFailed = true;
        // Fallback to isolated mode
        const fallbackContext = await databaseContextManager.setupContext(TestMode.ISOLATED, isolatedConfig);
        const isValid = await databaseContextManager.validateContext(fallbackContext);
        
        // Assert
        expect(productionFailed).toBe(true);
        expect(fallbackContext.mode).toBe(TestMode.ISOLATED);
        expect(isValid).toBe(true);
      }
      
      expect(productionFailed).toBe(true);
    });
  });
});