/**
 * Unit tests for ErrorRecoveryManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorRecoveryManager, RetryConfig, FallbackConfig } from '../ErrorRecoveryManager';
import { TestError, ErrorCategory, ErrorSeverity } from '../TestError';
import { TestMode, TestConfig } from '../../types';

describe('ErrorRecoveryManager', () => {
  let recoveryManager: ErrorRecoveryManager;
  let mockTestConfig: TestConfig;
  let mockTestError: TestError;

  beforeEach(() => {
    const retryConfig: Partial<RetryConfig> = {
      maxAttempts: 2,
      baseDelayMs: 100,
      maxDelayMs: 1000,
      backoffMultiplier: 2
    };

    const fallbackConfig: Partial<FallbackConfig> = {
      enableModeFallback: true,
      fallbackChain: [TestMode.PRODUCTION, TestMode.ISOLATED],
      preserveTestData: true,
      notifyOnFallback: false // Disable for testing
    };

    recoveryManager = new ErrorRecoveryManager(retryConfig, fallbackConfig);

    mockTestConfig = {
      mode: TestMode.PRODUCTION,
      tags: ['@production'],
      retries: 3,
      timeout: 30000,
      productionConfig: {
        testDataPrefix: 'looneyTunesTest',
        locations: ['Cedar Falls'],
        customerNames: ['Bugs Bunny'],
        cleanupPolicy: 'preserve'
      }
    };

    mockTestError = TestError.dataContextError(
      'Failed to setup data context',
      'test-123',
      'Recovery Test',
      TestMode.PRODUCTION
    );
  });

  describe('constructor', () => {
    it('should create recovery manager with default configuration', () => {
      const defaultManager = new ErrorRecoveryManager();
      expect(defaultManager).toBeInstanceOf(ErrorRecoveryManager);
    });

    it('should create recovery manager with custom configuration', () => {
      const customRetryConfig: Partial<RetryConfig> = {
        maxAttempts: 5,
        baseDelayMs: 500
      };

      const customManager = new ErrorRecoveryManager(customRetryConfig);
      expect(customManager).toBeInstanceOf(ErrorRecoveryManager);
    });
  });

  describe('recoverFromError', () => {
    it('should return failure result for non-retryable errors', async () => {
      const nonRetryableError = new TestError(
        'Non-retryable error',
        ErrorCategory.VALIDATION,
        ErrorSeverity.LOW,
        {
          testId: 'test-123',
          testName: 'Test',
          mode: TestMode.ISOLATED,
          timestamp: new Date(),
          environment: {}
        },
        { retryable: false }
      );

      const mockOperation = vi.fn().mockResolvedValue('success');

      const result = await recoveryManager.recoverFromError(
        nonRetryableError,
        mockTestConfig,
        mockOperation
      );

      expect(result.success).toBe(false);
      expect(result.warnings).toContain('Error category validation is not retryable');
      expect(mockOperation).not.toHaveBeenCalled();
    });

    it('should attempt automated recovery for retryable errors', async () => {
      const retryableError = new TestError(
        'Retryable error',
        ErrorCategory.DATABASE_CONNECTION,
        ErrorSeverity.HIGH,
        {
          testId: 'test-123',
          testName: 'Test',
          mode: TestMode.ISOLATED,
          timestamp: new Date(),
          environment: {}
        },
        {
          retryable: true,
          recoveryActions: [
            {
              action: 'retry_connection',
              description: 'Retry database connection',
              automated: true
            }
          ]
        }
      );

      const mockOperation = vi.fn().mockResolvedValue('success');

      const result = await recoveryManager.recoverFromError(
        retryableError,
        mockTestConfig,
        mockOperation
      );

      expect(result.attemptsUsed).toBeGreaterThan(0);
      expect(result.recoveryActions).toContain('retry_connection');
    });

    it('should store recovery history', async () => {
      const testId = 'test-history-123';
      const historyError = new TestError(
        'History test error',
        ErrorCategory.NETWORK,
        ErrorSeverity.MEDIUM,
        {
          testId,
          testName: 'History Test',
          mode: TestMode.DUAL,
          timestamp: new Date(),
          environment: {}
        },
        { retryable: true }
      );

      const mockOperation = vi.fn().mockResolvedValue('success');

      await recoveryManager.recoverFromError(historyError, mockTestConfig, mockOperation);

      const history = recoveryManager.getRecoveryHistory(testId);
      expect(history).toHaveLength(1);
      expect(history[0].errors).toHaveLength(1);
      expect(history[0].errors[0].context.testId).toBe(testId);
    });
  });

  describe('recovery statistics', () => {
    it('should provide recovery statistics', async () => {
      // Perform some recovery operations first
      const error1 = TestError.networkError('Network error 1', 'test-1', 'Test 1', TestMode.ISOLATED);
      const error2 = TestError.databaseConnectionError('DB error 1', 'test-2', 'Test 2', TestMode.PRODUCTION, {});
      
      const mockOperation = vi.fn().mockResolvedValue('success');

      await recoveryManager.recoverFromError(error1, mockTestConfig, mockOperation);
      await recoveryManager.recoverFromError(error2, mockTestConfig, mockOperation);

      const stats = recoveryManager.getRecoveryStatistics();

      expect(stats.totalRecoveries).toBeGreaterThanOrEqual(2);
      expect(stats.successfulRecoveries).toBeGreaterThanOrEqual(0);
      expect(stats.failedRecoveries).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(stats.mostCommonErrors)).toBe(true);
      expect(Array.isArray(stats.mostSuccessfulActions)).toBe(true);
    });

    it('should clear recovery history', () => {
      recoveryManager.clearRecoveryHistory();
      const stats = recoveryManager.getRecoveryStatistics();
      
      expect(stats.totalRecoveries).toBe(0);
      expect(stats.successfulRecoveries).toBe(0);
      expect(stats.failedRecoveries).toBe(0);
    });
  });

  describe('retry with backoff', () => {
    it('should implement exponential backoff', async () => {
      const startTime = Date.now();
      let attemptCount = 0;

      const failingOperation = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve('success');
      });

      const networkError = TestError.networkError(
        'Network timeout',
        'test-backoff',
        'Backoff Test',
        TestMode.ISOLATED,
        'https://api.test.com'
      );

      const result = await recoveryManager.recoverFromError(
        networkError,
        mockTestConfig,
        failingOperation
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should have taken at least the base delay time
      expect(executionTime).toBeGreaterThanOrEqual(100); // baseDelayMs
      expect(attemptCount).toBe(2);
      expect(failingOperation).toHaveBeenCalledTimes(2);
    });
  });

  describe('specific recovery actions', () => {
    it('should handle retry_with_backoff action', async () => {
      const retryError = new TestError(
        'Retry test error',
        ErrorCategory.NETWORK,
        ErrorSeverity.MEDIUM,
        {
          testId: 'test-retry',
          testName: 'Retry Test',
          mode: TestMode.ISOLATED,
          timestamp: new Date(),
          environment: {}
        },
        {
          retryable: true,
          recoveryActions: [
            {
              action: 'retry_with_backoff',
              description: 'Retry with exponential backoff',
              automated: true
            }
          ]
        }
      );

      let callCount = 0;
      const mockOperation = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First attempt fails');
        }
        return Promise.resolve('success');
      });

      const result = await recoveryManager.recoverFromError(
        retryError,
        mockTestConfig,
        mockOperation
      );

      expect(result.attemptsUsed).toBeGreaterThan(0);
      expect(result.recoveryActions).toContain('retry_with_backoff');
    });

    it('should handle force_cleanup action', async () => {
      const cleanupError = TestError.cleanupError(
        'Cleanup failed',
        'test-cleanup',
        'Cleanup Test',
        TestMode.ISOLATED,
        {
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
            database: 'test_db'
          },
          metadata: {
            createdAt: new Date(),
            mode: TestMode.ISOLATED,
            version: '1.0.0',
            testRunId: 'test-run-123'
          },
          cleanup: vi.fn().mockResolvedValue(undefined)
        }
      );

      const mockOperation = vi.fn().mockResolvedValue('success');

      const result = await recoveryManager.recoverFromError(
        cleanupError,
        mockTestConfig,
        mockOperation
      );

      expect(result.attemptsUsed).toBeGreaterThan(0);
      expect(result.recoveryActions).toContain('force_cleanup');
    });
  });

  describe('error handling edge cases', () => {
    it('should handle recovery action failures gracefully', async () => {
      const problematicError = new TestError(
        'Problematic error',
        ErrorCategory.DATABASE_CONNECTION,
        ErrorSeverity.HIGH,
        {
          testId: 'test-problematic',
          testName: 'Problematic Test',
          mode: TestMode.ISOLATED,
          timestamp: new Date(),
          environment: {}
        },
        {
          retryable: true,
          recoveryActions: [
            {
              action: 'unknown_action',
              description: 'Unknown recovery action',
              automated: true
            }
          ]
        }
      );

      const mockOperation = vi.fn().mockResolvedValue('success');

      const result = await recoveryManager.recoverFromError(
        problematicError,
        mockTestConfig,
        mockOperation
      );

      expect(result.success).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle concurrent recovery attempts', async () => {
      const concurrentError = TestError.networkError(
        'Concurrent error',
        'test-concurrent',
        'Concurrent Test',
        TestMode.DUAL
      );

      const mockOperation = vi.fn().mockResolvedValue('success');

      // Start multiple recovery attempts simultaneously
      const recoveryPromises = [
        recoveryManager.recoverFromError(concurrentError, mockTestConfig, mockOperation),
        recoveryManager.recoverFromError(concurrentError, mockTestConfig, mockOperation),
        recoveryManager.recoverFromError(concurrentError, mockTestConfig, mockOperation)
      ];

      const results = await Promise.all(recoveryPromises);

      // All should complete without throwing errors
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('attemptsUsed');
      });
    });
  });
});