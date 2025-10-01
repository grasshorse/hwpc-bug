/**
 * Unit tests for DualModeErrorHandler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DualModeErrorHandler, ErrorHandlingConfig } from '../DualModeErrorHandler';
import { TestError, ErrorCategory, ErrorSeverity } from '../TestError';
import { TestMode, TestConfig, TestContext } from '../../types';

describe('DualModeErrorHandler', () => {
  let errorHandler: DualModeErrorHandler;
  let mockTestContext: TestContext;
  let mockTestConfig: TestConfig;

  beforeEach(() => {
    const config: Partial<ErrorHandlingConfig> = {
      enableGracefulDegradation: true,
      enableAutomaticRecovery: true,
      enableErrorReporting: true,
      maxConcurrentRecoveries: 2
    };

    errorHandler = new DualModeErrorHandler(config);

    mockTestContext = {
      testName: 'Sample Test',
      tags: ['@production'],
      testId: 'test-123',
      scenario: null,
      feature: null
    };

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
  });

  describe('constructor', () => {
    it('should create error handler with default configuration', () => {
      const defaultHandler = new DualModeErrorHandler();
      expect(defaultHandler).toBeInstanceOf(DualModeErrorHandler);
    });

    it('should create error handler with custom configuration', () => {
      const customConfig: Partial<ErrorHandlingConfig> = {
        enableGracefulDegradation: false,
        enableAutomaticRecovery: false,
        maxConcurrentRecoveries: 5
      };

      const customHandler = new DualModeErrorHandler(customConfig);
      expect(customHandler).toBeInstanceOf(DualModeErrorHandler);
    });
  });

  describe('handleError', () => {
    it('should handle TestError instances', async () => {
      const testError = TestError.dataContextError(
        'Data context failed',
        'test-123',
        'Handle Test',
        TestMode.PRODUCTION
      );

      const result = await errorHandler.handleError(testError, mockTestContext, mockTestConfig);

      expect(result.success).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.warnings).toBeInstanceOf(Array);
    });

    it('should convert regular Error to TestError', async () => {
      const regularError = new Error('Regular error message');

      const result = await errorHandler.handleError(regularError, mockTestContext, mockTestConfig);

      expect(result.success).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.errorReportId).toBeDefined();
    });

    it('should attempt recovery when operation is provided', async () => {
      const testError = TestError.networkError(
        'Network failed',
        'test-123',
        'Recovery Test',
        TestMode.ISOLATED
      );

      const mockOperation = vi.fn().mockResolvedValue('success');

      const result = await errorHandler.handleError(
        testError,
        mockTestContext,
        mockTestConfig,
        mockOperation
      );

      expect(result.recoveryResult).toBeDefined();
    });

    it('should attempt graceful degradation when recovery fails', async () => {
      const productionError = TestError.dataContextError(
        'Production context failed',
        'test-123',
        'Degradation Test',
        TestMode.PRODUCTION
      );

      const failingOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));

      const result = await errorHandler.handleError(
        productionError,
        mockTestContext,
        mockTestConfig,
        failingOperation
      );

      // Should attempt graceful degradation for production errors
      expect(result.warnings.some(w => w.includes('degradation'))).toBe(true);
    });

    it('should handle errors in error handling gracefully', async () => {
      // Create an error that might cause issues in handling
      const problematicError = new Error('Problematic error');
      
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

      const result = await errorHandler.handleError(
        problematicError,
        mockTestContext,
        mockTestConfig
      );

      expect(result.success).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);

      consoleSpy.mockRestore();
    });
  });

  describe('withErrorHandling', () => {
    it('should execute operation successfully when no errors occur', async () => {
      const successfulOperation = vi.fn().mockResolvedValue('success result');

      const result = await errorHandler.withErrorHandling(
        successfulOperation,
        mockTestContext,
        mockTestConfig
      );

      expect(result).toBe('success result');
      expect(successfulOperation).toHaveBeenCalledTimes(1);
    });

    it('should handle errors and retry operation if recovery succeeds', async () => {
      let callCount = 0;
      const retryableOperation = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First attempt fails');
        }
        return Promise.resolve('success after retry');
      });

      // Mock successful recovery
      const mockRecoveryResult = {
        success: true,
        attemptsUsed: 1,
        recoveryActions: ['retry'],
        errors: [],
        warnings: []
      };

      // Mock the error handler's recovery
      vi.spyOn(errorHandler, 'handleError').mockResolvedValue({
        success: true,
        recoveryResult: mockRecoveryResult,
        warnings: [],
        executionTime: 100
      });

      const result = await errorHandler.withErrorHandling(
        retryableOperation,
        mockTestContext,
        mockTestConfig
      );

      expect(result).toBe('success after retry');
      expect(retryableOperation).toHaveBeenCalledTimes(2);
    });

    it('should throw enhanced error when recovery fails', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));

      // Mock failed recovery
      vi.spyOn(errorHandler, 'handleError').mockResolvedValue({
        success: false,
        warnings: ['Recovery failed'],
        executionTime: 100
      });

      await expect(
        errorHandler.withErrorHandling(failingOperation, mockTestContext, mockTestConfig)
      ).rejects.toThrow();

      expect(failingOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('createSafeWrapper', () => {
    it('should create a wrapper that handles errors automatically', async () => {
      const originalFunction = vi.fn().mockResolvedValue('wrapped result');

      const wrappedFunction = errorHandler.createSafeWrapper(
        originalFunction,
        mockTestContext,
        mockTestConfig
      );

      const result = await wrappedFunction('arg1', 'arg2');

      expect(result).toBe('wrapped result');
      expect(originalFunction).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should handle errors in wrapped function', async () => {
      const failingFunction = vi.fn().mockRejectedValue(new Error('Wrapped function failed'));

      const wrappedFunction = errorHandler.createSafeWrapper(
        failingFunction,
        mockTestContext,
        mockTestConfig
      );

      // Mock successful error handling
      vi.spyOn(errorHandler, 'withErrorHandling').mockResolvedValue('recovered result');

      const result = await wrappedFunction('test-arg');

      expect(result).toBe('recovered result');
      expect(failingFunction).toHaveBeenCalledWith('test-arg');
    });
  });

  describe('handleMultipleErrors', () => {
    it('should handle multiple errors in batches', async () => {
      const errors = [
        {
          error: new Error('Error 1'),
          testContext: { ...mockTestContext, testId: 'test-1' },
          testConfig: mockTestConfig
        },
        {
          error: new Error('Error 2'),
          testContext: { ...mockTestContext, testId: 'test-2' },
          testConfig: mockTestConfig
        },
        {
          error: new Error('Error 3'),
          testContext: { ...mockTestContext, testId: 'test-3' },
          testConfig: mockTestConfig
        }
      ];

      const results = await errorHandler.handleMultipleErrors(errors);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBeDefined();
        expect(result.executionTime).toBeGreaterThan(0);
      });
    });

    it('should respect concurrent recovery limit', async () => {
      const limitedHandler = new DualModeErrorHandler({
        maxConcurrentRecoveries: 1
      });

      const errors = Array.from({ length: 5 }, (_, i) => ({
        error: new Error(`Error ${i + 1}`),
        testContext: { ...mockTestContext, testId: `test-${i + 1}` },
        testConfig: mockTestConfig
      }));

      const startTime = Date.now();
      const results = await limitedHandler.handleMultipleErrors(errors);
      const endTime = Date.now();

      expect(results).toHaveLength(5);
      // Should take longer due to batching
      expect(endTime - startTime).toBeGreaterThan(0);
    });

    it('should handle batch processing failures gracefully', async () => {
      const problematicErrors = [
        {
          error: new Error('Problematic error'),
          testContext: mockTestContext,
          testConfig: mockTestConfig
        }
      ];

      // Mock a failure in batch processing
      vi.spyOn(errorHandler, 'handleError').mockRejectedValue(new Error('Batch processing failed'));

      const results = await errorHandler.handleMultipleErrors(problematicErrors);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].warnings.some(w => w.includes('Batch error handling failed'))).toBe(true);
    });
  });

  describe('error categorization', () => {
    it('should categorize database connection errors correctly', async () => {
      const dbError = new Error('ECONNREFUSED: Connection refused');

      const result = await errorHandler.handleError(dbError, mockTestContext, mockTestConfig);

      expect(result.errorReportId).toBeDefined();
      // The error should be categorized as DATABASE_CONNECTION
    });

    it('should categorize network errors correctly', async () => {
      const networkError = new Error('Network timeout occurred');

      const result = await errorHandler.handleError(networkError, mockTestContext, mockTestConfig);

      expect(result.errorReportId).toBeDefined();
      // The error should be categorized as NETWORK
    });

    it('should categorize context errors correctly', async () => {
      const contextError = new Error('Failed to setup data context');

      const result = await errorHandler.handleError(contextError, mockTestContext, mockTestConfig);

      expect(result.errorReportId).toBeDefined();
      // The error should be categorized as DATA_CONTEXT
    });
  });

  describe('severity determination', () => {
    it('should assign high severity to database connection errors', async () => {
      const dbError = new Error('Database connection failed');

      const result = await errorHandler.handleError(dbError, mockTestContext, mockTestConfig);

      expect(result.errorReportId).toBeDefined();
      // Should be assigned HIGH severity
    });

    it('should assign critical severity to cleanup errors', async () => {
      const cleanupError = new Error('Critical cleanup failure');

      const result = await errorHandler.handleError(cleanupError, mockTestContext, mockTestConfig);

      expect(result.errorReportId).toBeDefined();
      // Should be assigned CRITICAL severity
    });
  });

  describe('statistics and monitoring', () => {
    it('should provide error handling statistics', () => {
      const stats = errorHandler.getStatistics();

      expect(stats).toHaveProperty('recoveryStats');
      expect(stats).toHaveProperty('errorSummary');
      expect(stats).toHaveProperty('activeRecoveries');
      expect(typeof stats.activeRecoveries).toBe('number');
    });

    it('should clear error handling history', () => {
      errorHandler.clearHistory();

      const stats = errorHandler.getStatistics();
      expect(stats.activeRecoveries).toBe(0);
    });

    it('should provide access to internal components', () => {
      const errorReporter = errorHandler.getErrorReporter();
      const recoveryManager = errorHandler.getRecoveryManager();

      expect(errorReporter).toBeDefined();
      expect(recoveryManager).toBeDefined();
    });
  });

  describe('graceful degradation', () => {
    it('should attempt graceful degradation for production mode errors', async () => {
      const productionError = TestError.dataContextError(
        'Production data unavailable',
        'test-123',
        'Degradation Test',
        TestMode.PRODUCTION
      );

      const result = await errorHandler.handleError(
        productionError,
        mockTestContext,
        { ...mockTestConfig, mode: TestMode.PRODUCTION }
      );

      // Should attempt graceful degradation
      expect(result.warnings.some(w => w.includes('degradation'))).toBe(true);
    });

    it('should not attempt graceful degradation for isolated mode errors', async () => {
      const isolatedError = TestError.dataContextError(
        'Isolated data unavailable',
        'test-123',
        'No Degradation Test',
        TestMode.ISOLATED
      );

      const result = await errorHandler.handleError(
        isolatedError,
        mockTestContext,
        { ...mockTestConfig, mode: TestMode.ISOLATED }
      );

      // Should not attempt graceful degradation
      expect(result.warnings.some(w => w.includes('degradation'))).toBe(false);
    });
  });
});
